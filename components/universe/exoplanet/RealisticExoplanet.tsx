'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRealTexture, RealTextureName } from '@/lib/realTextures';
import { createAtmosphereMaterial, kelvinToColor } from '@/components/universe/rendering/celestialMaterials';
import { isLowQuality } from '@/lib/deviceQuality';

// Exoplanets rendered from the real Solar System maps (no extra downloads): each world reuses the closest analogue's
// texture, recoloured by brightness into the colours measured or expected for it, lit by its host star, with a
// day-side-weighted atmosphere rim, optional clouds, incandescent day sides for ultra-hot planets, thermal night-side
// glow, and tidal locking (the same face kept towards the star).

export interface ExoplanetLook {
  map: RealTextureName;
  /** Recolour the map by its brightness: [shadow colour, highlight colour] */
  ramp?: [string, string];
  /** 0 keeps the original map colours, 1 uses only the ramp */
  colorize?: number;
  /** Luminance range stretched onto the ramp (more contrast for bland maps) */
  contrast?: [number, number];
  roughness?: number;
  metalness?: number;
  atmosphere?: { color: string; strength?: number; scale?: number };
  clouds?: { opacity?: number; color?: string };
  /** Incandescent glow on the side facing the star (ultra-hot Jupiters, lava oceans) */
  dayGlow?: { color: string; intensity: number };
  /** Thermal glow on the night side */
  nightGlow?: { color: string; intensity: number };
  /** Glow follows the dark parts of the map (lava seas) instead of the bright ones (hot cloud bands) */
  glowInDark?: boolean;
  /** Ice-covered except for an open ocean around the point facing the star ("eyeball" world) */
  eyeball?: { ice: string };
  /** Keep one face towards the host star */
  tidallyLocked?: boolean;
}

// Starlight from the host is applied in the shader (a Lambert term towards the star), so every planet is lit by its
// own star at the right colour however the pooled scene lights are assigned (their inverse-square falloff leaves
// planets tens of units from their star almost black).
const STARLIGHT_GLSL = /* glsl */ `#include <lights_fragment_end>
  {
    vec3 toStarL = normalize(uStarView + vViewPosition);
    reflectedLight.directDiffuse += saturate(dot(normal, toStarL)) * uStarLight * BRDF_Lambert(material.diffuseColor);
  }`;

type SharedStarUniforms = { uStarView: { value: THREE.Vector3 }; uStarLight: { value: THREE.Color } };

function createStarUniforms(hostKelvin: number): SharedStarUniforms {
  return {
    uStarView: { value: new THREE.Vector3(0, 0, 1e6) },
    uStarLight: { value: kelvinToColor(hostKelvin).multiplyScalar(2.8) },
  };
}

function createCloudMaterial(clouds: NonNullable<ExoplanetLook['clouds']>, star: SharedStarUniforms) {
  const mat = new THREE.MeshStandardMaterial({
    color: clouds.color ?? '#ffffff',
    alphaMap: getRealTexture('earth_clouds'),
    transparent: true,
    opacity: clouds.opacity ?? 0.8,
    depthWrite: false,
    roughness: 1,
  });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, star);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `uniform vec3 uStarView;
uniform vec3 uStarLight;
void main() {`)
      .replace('#include <lights_fragment_end>', STARLIGHT_GLSL);
  };
  mat.customProgramCacheKey = () => 'exoplanet-clouds';
  return mat;
}

export function createExoplanetMaterial(look: ExoplanetLook, star: SharedStarUniforms = createStarUniforms(5772)) {
  const mat = new THREE.MeshStandardMaterial({
    map: getRealTexture(look.map),
    roughness: look.roughness ?? 0.85,
    metalness: look.metalness ?? 0.02,
  });
  const ramp = look.ramp ?? ['#000000', '#ffffff'];
  const uniforms = {
    ...star,
    uRampDark: { value: new THREE.Color(ramp[0]) },
    uRampLight: { value: new THREE.Color(ramp[1]) },
    uColorize: { value: look.ramp ? look.colorize ?? 1 : 0 },
    uLumRange: { value: new THREE.Vector2(...(look.contrast ?? [0, 1])) },
    uDayGlow: { value: new THREE.Color(look.dayGlow?.color ?? '#000000').multiplyScalar(look.dayGlow?.intensity ?? 0) },
    uNightGlow: { value: new THREE.Color(look.nightGlow?.color ?? '#000000').multiplyScalar(look.nightGlow?.intensity ?? 0) },
    uIce: { value: new THREE.Color(look.eyeball?.ice ?? '#ffffff') },
  };
  const eyeball = !!look.eyeball;
  const glowInDark = !!look.glowInDark;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform vec3 uStarView;
uniform vec3 uStarLight;
uniform vec3 uRampDark;
uniform vec3 uRampLight;
uniform float uColorize;
uniform vec2 uLumRange;
uniform vec3 uDayGlow;
uniform vec3 uNightGlow;
uniform vec3 uIce;
void main() {`
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  vec4 exoTex = texture2D( map, vMapUv );
  float exoLum = clamp((dot(exoTex.rgb, vec3(0.299, 0.587, 0.114)) - uLumRange.x) / (uLumRange.y - uLumRange.x), 0.0, 1.0);
  exoTex.rgb = mix(exoTex.rgb, mix(uRampDark, uRampLight, exoLum), uColorize);
  diffuseColor *= exoTex;
#else
  float exoLum = 0.5;
#endif`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
  {
    // view space: the surface point is -vViewPosition
    vec3 toStar = normalize(uStarView + vViewPosition);
    float facing = dot(normal, toStar);
    ${
      eyeball
        ? `diffuseColor.rgb = mix(uIce * (0.78 + 0.3 * exoLum), diffuseColor.rgb, smoothstep(0.5, 0.78, facing));`
        : ''
    }
    float heat = ${glowInDark ? 'pow(1.0 - exoLum, 2.5) * 1.8 + 0.08' : '0.35 + 1.1 * exoLum'};
    totalEmissiveRadiance += uDayGlow * smoothstep(-0.25, 0.85, facing) * heat;
    totalEmissiveRadiance += uNightGlow * smoothstep(0.15, -0.35, facing) * heat;
  }`
      )
      .replace('#include <lights_fragment_end>', STARLIGHT_GLSL);
  };
  mat.customProgramCacheKey = () => `exoplanet-${eyeball ? 1 : 0}${glowInDark ? 1 : 0}`;
  mat.userData.uniforms = uniforms;
  return mat;
}

const _v = new THREE.Vector3();

interface ExoplanetSurfaceProps {
  radius: number;
  look: ExoplanetLook;
  /** Object whose origin is the host star (the system root). Lights the glow terms and the tidal lock. */
  host?: React.RefObject<THREE.Object3D>;
  /** Host star temperature: colour of the light falling on the planet */
  hostKelvin?: number;
  /** Non-uniform stretch, e.g. a tidally distorted "egg" planet */
  stretch?: [number, number, number];
  segments?: number;
}

export const ExoplanetSurface: React.FC<ExoplanetSurfaceProps> = ({
  radius,
  look,
  host,
  hostKelvin = 5772,
  stretch,
  segments = 48,
}) => {
  const star = useMemo(() => createStarUniforms(hostKelvin), [hostKelvin]);
  const material = useMemo(() => createExoplanetMaterial(look, star), [look, star]);
  const hostWorld = useMemo(() => new THREE.Vector3(), []);
  const atmoMaterial = useMemo(
    () => (look.atmosphere ? createAtmosphereMaterial(look.atmosphere.color, look.atmosphere.strength ?? 1, hostWorld) : null),
    [look, hostWorld]
  );
  const cloudMaterial = useMemo(() => (look.clouds ? createCloudMaterial(look.clouds, star) : null), [look, star]);
  useEffect(
    () => () => {
      material.dispose();
      atmoMaterial?.dispose();
      cloudMaterial?.dispose();
    },
    [material, atmoMaterial, cloudMaterial]
  );

  const orientRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const seg = isLowQuality() ? Math.min(segments, 32) : segments;

  useFrame((_, delta) => {
    if (host?.current) host.current.getWorldPosition(hostWorld);
    if (look.tidallyLocked && orientRef.current) orientRef.current.lookAt(hostWorld);
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.012;
  });

  // Star direction in view space, with the camera matrices of the frame being drawn
  const onBeforeRender = useMemo(
    () => (_r: THREE.WebGLRenderer, _s: THREE.Scene, camera: THREE.Camera) => {
      star.uStarView.value.copy(_v.copy(hostWorld).applyMatrix4(camera.matrixWorldInverse));
    },
    [star, hostWorld]
  );

  return (
    <group>
      <group ref={orientRef}>
        <mesh material={material} scale={stretch} onBeforeRender={onBeforeRender}>
          <sphereGeometry args={[radius, seg, seg]} />
        </mesh>
        {cloudMaterial && (
          <mesh ref={cloudRef} material={cloudMaterial} scale={stretch} raycast={() => null}>
            <sphereGeometry args={[radius * 1.012, seg, seg]} />
          </mesh>
        )}
      </group>
      {atmoMaterial && (
        <mesh material={atmoMaterial} scale={stretch} raycast={() => null}>
          <sphereGeometry args={[radius * (look.atmosphere?.scale ?? 1.05), seg, seg]} />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Looks for the catalogued exoplanets, from what is measured (or the leading interpretation) for each
// ---------------------------------------------------------------------------------------------------------------
export const EXOPLANET_LOOKS: Record<string, ExoplanetLook> = {
  // Rocky, probably airless or thin-aired, tidally locked under a red flare star
  proxima_centauri_b: {
    map: 'mars',
    ramp: ['#24160f', '#b89276'],
    colorize: 0.7,
    roughness: 0.95,
    atmosphere: { color: '#ffbfa0', strength: 0.45, scale: 1.035 },
    tidallyLocked: true,
  },
  // Earth-sized, Earth-like density; possibly oceans under a thin atmosphere
  trappist_1e: {
    map: 'earth_daymap',
    ramp: ['#0a1b30', '#c9b69a'],
    colorize: 0.55,
    clouds: { opacity: 0.55 },
    atmosphere: { color: '#9ec9ff', strength: 0.9 },
    tidallyLocked: true,
  },
  // Sub-Neptune with a hydrogen atmosphere rich in methane and CO2 (JWST): hazy teal, Neptune-like
  k2_18b: {
    map: 'neptune',
    ramp: ['#0e4552', '#a6e3dc'],
    colorize: 0.85,
    contrast: [0.2, 0.85],
    roughness: 1,
    atmosphere: { color: '#7fe3ff', strength: 1.4, scale: 1.07 },
    tidallyLocked: true,
  },
  // Deep cobalt-blue hot Jupiter (Hubble albedo measurement), silicate haze, glowing faintly on its night side
  hd_189733_b: {
    map: 'jupiter',
    ramp: ['#040b33', '#4b86ff'],
    colorize: 1,
    contrast: [0.25, 0.95],
    atmosphere: { color: '#5aa2ff', strength: 1.3 },
    nightGlow: { color: '#7a1d0a', intensity: 0.12 },
    tidallyLocked: true,
  },
  // The first hot Jupiter: dark, ~1,250 K, hazy
  pegasi_51_b: {
    map: 'jupiter',
    ramp: ['#1a0c07', '#c78a5c'],
    colorize: 0.85,
    atmosphere: { color: '#ffa46b', strength: 0.9 },
    dayGlow: { color: '#ff7a2e', intensity: 0.15 },
    nightGlow: { color: '#5a1405', intensity: 0.12 },
    tidallyLocked: true,
  },
  // Earth-sized, 86% of Earth's sunlight: temperate, possibly oceans and clouds
  toi_700_d: {
    map: 'earth_daymap',
    ramp: ['#081a2e', '#b9c6a0'],
    colorize: 0.45,
    clouds: { opacity: 0.7 },
    atmosphere: { color: '#8fc1ff', strength: 1 },
    tidallyLocked: true,
  },
  // Hot sub-Earth (3.15-day orbit), bare rock
  barnard_b: {
    map: 'mercury',
    ramp: ['#1c1917', '#a69d93'],
    colorize: 0.6,
    roughness: 1,
    tidallyLocked: true,
  },
  // Inner edge of the habitable zone, ~1.6× Earth's sunlight: most likely a cloud-wrapped, Venus-like world
  tau_ceti_e: {
    map: 'venus_atmosphere',
    ramp: ['#8a6d3f', '#f3e3b8'],
    colorize: 0.45,
    roughness: 1,
    atmosphere: { color: '#ffe2a8', strength: 1.1 },
  },
  gliese_667c_e: {
    map: 'earth_daymap',
    ramp: ['#10233a', '#c7a77c'],
    colorize: 0.5,
    clouds: { opacity: 0.6 },
    atmosphere: { color: '#a6c8ff', strength: 1 },
    tidallyLocked: true,
  },
  // JWST 2024: a possible water world, frozen over except for an open ocean facing its star
  lhs_1140_b: {
    map: 'earth_daymap',
    ramp: ['#041a36', '#2f6f9e'],
    colorize: 0.85,
    eyeball: { ice: '#dfe9f2' },
    clouds: { opacity: 0.3 },
    atmosphere: { color: '#bcd8ff', strength: 0.9 },
    tidallyLocked: true,
  },
  // 2.4 Earth radii in the habitable zone of a Sun-like star: often pictured as a global ocean
  kepler_22b: {
    map: 'earth_daymap',
    ramp: ['#04152b', '#2f8fa6'],
    colorize: 0.85,
    clouds: { opacity: 0.75 },
    atmosphere: { color: '#7fb6ff', strength: 1.1 },
  },
  // Blacker than asphalt (albedo < 0.07), ~2,600 K day side, egg-shaped and losing its atmosphere
  wasp_12b: {
    map: 'jupiter',
    ramp: ['#030304', '#2a1a12'],
    colorize: 1,
    roughness: 1,
    dayGlow: { color: '#ff5a1f', intensity: 0.9 },
    nightGlow: { color: '#4a0d02', intensity: 0.25 },
    atmosphere: { color: '#ff7a3a', strength: 1.3, scale: 1.08 },
  },
  // Older, larger cousin of Earth around a Sun-like star: drier continents, thicker air
  kepler_452b: {
    map: 'earth_daymap',
    ramp: ['#1a1a12', '#d0b27c'],
    colorize: 0.4,
    clouds: { opacity: 0.8 },
    atmosphere: { color: '#9cc4ff', strength: 1.3, scale: 1.06 },
  },
  // Earth-sized, a third of Earth's sunlight: colder, more ice and cloud
  kepler_186f: {
    map: 'earth_daymap',
    ramp: ['#0a1626', '#d9d2c4'],
    colorize: 0.55,
    clouds: { opacity: 0.7 },
    atmosphere: { color: '#9fc0ff', strength: 1 },
  },
  // Cold Saturn-mass circumbinary giant
  kepler_16b: {
    map: 'saturn',
    ramp: ['#3b2c1a', '#e3cf9e'],
    colorize: 0.35,
    atmosphere: { color: '#f5deb0', strength: 0.6 },
  },
  kepler_1649c: {
    map: 'earth_daymap',
    ramp: ['#0a1a2c', '#c4a987'],
    colorize: 0.5,
    clouds: { opacity: 0.6 },
    atmosphere: { color: '#9cc2ff', strength: 1 },
    tidallyLocked: true,
  },
  // Hottest known planet: 4,600 K day side, atoms of iron and titanium, an evaporating envelope
  kelt_9b: {
    map: 'jupiter',
    ramp: ['#6b1e05', '#ffd27a'],
    colorize: 1,
    roughness: 1,
    dayGlow: { color: '#ffc890', intensity: 1.4 }, // glows like a 4,600 K star
    nightGlow: { color: '#ff5a14', intensity: 0.7 },
    atmosphere: { color: '#ffb347', strength: 1.7, scale: 1.15 },
    tidallyLocked: true,
  },
  // Warm gas giant at 1 AU
  kepler_90_h: {
    map: 'jupiter',
    ramp: ['#3a2410', '#f0d6a8'],
    colorize: 0.3,
    atmosphere: { color: '#ffe0b0', strength: 0.6 },
  },
  // Ultra-hot Jupiter where iron vaporises on the day side and rains out on the night side
  wasp_76_b: {
    map: 'jupiter',
    ramp: ['#12050a', '#b0421c'],
    colorize: 1,
    dayGlow: { color: '#ff6a24', intensity: 1.1 },
    nightGlow: { color: '#3a0a04', intensity: 0.2 },
    atmosphere: { color: '#ff8a4a', strength: 1.4, scale: 1.07 },
    tidallyLocked: true,
  },
  // 6.34 Jupiter masses (microlensing): a Jupiter-like giant
  pa_99_n2_planet: {
    map: 'jupiter',
    colorize: 0,
    atmosphere: { color: '#ffe6c8', strength: 0.5 },
  },
  // Lava world: dark basalt with molten seas glowing on the day side, dimmer on the night side; thin CO/CO2 air (JWST)
  cancri_55_e: {
    map: 'moon',
    ramp: ['#0d0b0a', '#57504a'],
    colorize: 1,
    roughness: 0.9,
    glowInDark: true,
    dayGlow: { color: '#ff6a1a', intensity: 1.6 },
    nightGlow: { color: '#b3260a', intensity: 0.45 },
    atmosphere: { color: '#ffb080', strength: 0.8, scale: 1.04 },
    tidallyLocked: true,
  },
};

/** Look for a body, or a plain rocky fallback tinted by its catalogue colour */
const fallbackLooks = new Map<string, ExoplanetLook>();
export function getExoplanetLook(id: string, fallbackColor?: string): ExoplanetLook {
  const known = EXOPLANET_LOOKS[id];
  if (known) return known;
  // Cached so the returned object is stable (materials are memoised on it)
  let look = fallbackLooks.get(id);
  if (!look) {
    look = {
      map: 'mercury',
      ramp: ['#111111', fallbackColor ?? '#9ca3af'],
      colorize: 0.8,
      atmosphere: { color: fallbackColor ?? '#9ca3af', strength: 0.5 },
    };
    fallbackLooks.set(id, look);
  }
  return look;
}
