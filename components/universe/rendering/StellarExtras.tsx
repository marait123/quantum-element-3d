'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRealTexture } from '@/lib/realTextures';
import { getCoronaTexture, kelvinToColor } from './celestialMaterials';
import { isLowQuality } from '@/lib/deviceQuality';

// Extra star/gas visuals shared by the stellar-neighbourhood, Milky Way and extragalactic scenes: mottled
// supergiant photospheres, soft glowing gas shells (dust envelopes, eruption shells, nova remnants), mass-transfer
// streams and accretion disks. Every shader includes three's log-depth chunks (the universe canvas uses a
// logarithmic depth buffer) and outputs alpha 1 × fade so DistanceFadeGroup can dissolve it.

const NOISE_GLSL = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm3(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + 11.7;
      a *= 0.5;
    }
    return s;
  }
`;

const SHELL_VERTEX = /* glsl */ `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vDir;
  varying vec2 vUv;
  varying vec3 vCentreW;
  void main() {
    vUv = uv;
    vDir = position;
    vCentreW = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
    #include <logdepthbuf_vertex>
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// Red supergiant / hypergiant photosphere: a handful of enormous convection cells (as in the VLT/ALMA images of
// Betelgeuse and Antares) over the Sun's real granulation map, strong limb darkening and a redder limb.
// ---------------------------------------------------------------------------------------------------------------
export function createSupergiantMaterial(kelvin: number, brightness = 1.5, cellScale = 1.8) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: getRealTexture('sun') },
      uTint: { value: kelvinToColor(kelvin) },
      uBrightness: { value: brightness },
      uCellScale: { value: cellScale },
      uTime: { value: 0 },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uBrightness;
      uniform float uCellScale;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vDir;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        #include <logdepthbuf_fragment>
        vec3 d = normalize(vDir);
        float drift = uTime * 0.012;
        // Giant cells: hot rising plumes separated by cooler, darker sinking lanes
        float cells = fbm3(d * uCellScale + vec3(0.0, drift, drift * 0.7));
        float plumes = smoothstep(0.3, 0.7, cells);
        float fine = fbm3(d * uCellScale * 5.0 - vec3(drift * 2.0));
        float photo = dot(texture2D(uMap, vUv * 0.7 + vec2(uTime * 0.0012, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
        float lum = 0.32 + 0.95 * plumes + 0.3 * (fine - 0.5) + 0.3 * (photo - 0.5);
        // Strong limb darkening: a supergiant's extended atmosphere makes the edge much dimmer and redder
        float mu = max(dot(normalize(vNormalW), normalize(cameraPosition - vPosW)), 0.0);
        float limb = 0.2 + 0.8 * pow(mu, 0.6);
        vec3 col = uTint * max(lum, 0.12) * limb * uBrightness;
        col = mix(col * vec3(1.0, 0.55, 0.35), col, smoothstep(0.0, 0.6, mu));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

interface SupergiantStarProps {
  radius: number;
  kelvin: number;
  brightness?: number;
  /** Fewer, larger convection cells at lower values */
  cellScale?: number;
  glowScale?: number;
  glowOpacity?: number;
  segments?: number;
  spin?: number;
}

/** A cool supergiant: mottled giant-cell surface plus a soft glow sprite. Size it with the body's radius. */
export const SupergiantStar: React.FC<SupergiantStarProps> = ({ cellScale = 1.8, ...rest }) => {
  const material = useMemo(
    () => createSupergiantMaterial(rest.kelvin, rest.brightness ?? 1.5, cellScale),
    [rest.kelvin, rest.brightness, cellScale]
  );
  return <ShaderStar material={material} {...rest} />;
};

// ---------------------------------------------------------------------------------------------------------------
// Hot star photosphere (O/B/A stars, white dwarfs): radiative envelopes show no convective granulation, so the
// surface is smooth, with only a faint shimmer, gentler limb darkening and a whiter core fading to a bluer limb.
// ---------------------------------------------------------------------------------------------------------------
export function createHotStarMaterial(kelvin: number, brightness = 1.8) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTint: { value: kelvinToColor(kelvin) },
      uBrightness: { value: brightness },
      uTime: { value: 0 },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 uTint;
      uniform float uBrightness;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vDir;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        #include <logdepthbuf_fragment>
        vec3 d = normalize(vDir);
        float shimmer = fbm3(d * 9.0 + vec3(uTime * 0.05, 0.0, -uTime * 0.04)) - 0.5;
        float mu = max(dot(normalize(vNormalW), normalize(cameraPosition - vPosW)), 0.0);
        float limb = 0.45 + 0.55 * pow(mu, 0.8);
        vec3 col = uTint * (1.0 + 0.12 * shimmer) * limb * uBrightness;
        // Hot, dense core of the disc reads whiter; the limb keeps the star's blue tint
        col = mix(col, vec3(dot(col, vec3(0.333))), 0.25 * mu);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

export const HotStar: React.FC<Omit<SupergiantStarProps, 'cellScale'>> = (props) => {
  const material = useMemo(() => createHotStarMaterial(props.kelvin, props.brightness ?? 1.8), [props.kelvin, props.brightness]);
  return <ShaderStar material={material} {...props} />;
};

const ShaderStar: React.FC<Omit<SupergiantStarProps, 'cellScale'> & { material: THREE.ShaderMaterial }> = ({
  material,
  radius,
  kelvin,
  glowScale = 2.2,
  glowOpacity = 0.5,
  segments = 64,
  spin = 0.01,
}) => {
  useEffect(() => () => material.dispose(), [material]);
  const glowColor = useMemo(() => kelvinToColor(kelvin), [kelvin]);
  const meshRef = useRef<THREE.Mesh>(null);
  const seg = isLowQuality() ? Math.min(segments, 40) : segments;
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    if (meshRef.current) meshRef.current.rotation.y += delta * spin;
  });
  return (
    <group>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[radius, seg, seg]} />
      </mesh>
      {glowScale > 0 && (
        <sprite scale={[radius * glowScale * 2, radius * glowScale * 2, 1]} raycast={() => null}>
          <spriteMaterial
            map={getCoronaTexture()}
            color={glowColor}
            transparent
            opacity={glowOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Soft glowing gas shell. 'halo': a back-faced sphere brightest towards the centre and fading to nothing at its
// edge (a diffuse envelope around a star). 'rim': a limb-brightened bubble (eruption shells, nova remnants).
// Optional noise makes it clumpy / asymmetric like real dust envelopes. Fades out when the camera goes inside.
// ---------------------------------------------------------------------------------------------------------------
export function createGlowShellMaterial(opts: {
  color: THREE.ColorRepresentation;
  mode?: 'halo' | 'rim';
  strength?: number;
  power?: number;
  noise?: number;
  noiseScale?: number;
}) {
  const mode = opts.mode ?? 'halo';
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(opts.color) },
      uStrength: { value: opts.strength ?? 0.6 },
      uPower: { value: opts.power ?? (mode === 'halo' ? 2.2 : 2.5) },
      uNoise: { value: opts.noise ?? 0 },
      uNoiseScale: { value: opts.noiseScale ?? 2.5 },
      uHalo: { value: mode === 'halo' ? 1 : 0 },
      uTime: { value: 0 },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 uColor;
      uniform float uStrength;
      uniform float uPower;
      uniform float uNoise;
      uniform float uNoiseScale;
      uniform float uHalo;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vDir;
      varying vec2 vUv;
      varying vec3 vCentreW;
      ${NOISE_GLSL}
      void main() {
        #include <logdepthbuf_fragment>
        vec3 V = normalize(cameraPosition - vPosW);
        float ndv = abs(dot(normalize(vNormalW), V));
        float I = uHalo > 0.5 ? pow(ndv, uPower) : pow(1.0 - ndv, uPower);
        if (uNoise > 0.0) {
          float n = fbm3(normalize(vDir) * uNoiseScale + vec3(uTime * 0.015, -uTime * 0.01, 0.0));
          I *= mix(1.0, 0.15 + 1.7 * n * n, uNoise);
        }
        // Dissolve as the camera enters the shell (otherwise it would fog the whole view)
        float shellR = length(vPosW - vCentreW);
        I *= smoothstep(shellR * 0.85, shellR * 1.25, length(cameraPosition - vCentreW));
        gl_FragColor = vec4(uColor * I * uStrength, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: mode === 'halo' ? THREE.BackSide : THREE.FrontSide,
  });
}

interface GlowShellProps {
  radius: number;
  color: THREE.ColorRepresentation;
  mode?: 'halo' | 'rim';
  strength?: number;
  power?: number;
  noise?: number;
  noiseScale?: number;
  scale?: [number, number, number];
  segments?: number;
}

export const GlowShell = React.forwardRef<THREE.Mesh, GlowShellProps>(
  ({ radius, color, mode = 'halo', strength, power, noise, noiseScale, scale, segments = 48 }, ref) => {
    const material = useMemo(
      () => createGlowShellMaterial({ color, mode, strength, power, noise, noiseScale }),
      [color, mode, strength, power, noise, noiseScale]
    );
    useEffect(() => () => material.dispose(), [material]);
    useFrame((_, delta) => {
      if (noise) material.uniforms.uTime.value += delta;
    });
    const seg = isLowQuality() ? Math.min(segments, 32) : segments;
    return (
      <mesh ref={ref} material={material} scale={scale} raycast={() => null}>
        <sphereGeometry args={[radius, seg, seg]} />
      </mesh>
    );
  }
);
GlowShell.displayName = 'GlowShell';

// ---------------------------------------------------------------------------------------------------------------
// Mass-transfer stream (Roche-lobe overflow): a cylinder that glows along its axis, soft at the edges, with gas
// clumps flowing from the donor end (+y, v = 1) towards the accretor (-y, v = 0).
// ---------------------------------------------------------------------------------------------------------------
export function createGasStreamMaterial(colorDonor: THREE.ColorRepresentation, colorAccretor: THREE.ColorRepresentation, strength = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorAccretor) },
      uColorB: { value: new THREE.Color(colorDonor) },
      uStrength: { value: strength },
      uTime: { value: 0 },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uStrength;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vDir;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        #include <logdepthbuf_fragment>
        vec3 V = normalize(cameraPosition - vPosW);
        float core = pow(abs(dot(normalize(vNormalW), V)), 1.6);
        float clumps = vnoise(vec3(vUv.y * 9.0 + uTime * 1.4, vUv.x * 6.2831, 0.0));
        float ends = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
        vec3 col = mix(uColorA, uColorB, vUv.y);
        float I = core * ends * (0.45 + 0.9 * clumps) * uStrength;
        gl_FragColor = vec4(col * I, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Thin accretion disk on a ringGeometry (XY plane): white-hot at the inner edge, cooling and dimming outwards,
// with spiral turbulence shearing around it (inner parts orbit faster).
// ---------------------------------------------------------------------------------------------------------------
export function createAccretionDiskMaterial(inner: number, outer: number, hot: THREE.ColorRepresentation, cool: THREE.ColorRepresentation, strength = 1.4) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uHot: { value: new THREE.Color(hot) },
      uCool: { value: new THREE.Color(cool) },
      uStrength: { value: strength },
      uTime: { value: 0 },
    },
    vertexShader: SHELL_VERTEX,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform float uInner;
      uniform float uOuter;
      uniform vec3 uHot;
      uniform vec3 uCool;
      uniform float uStrength;
      uniform float uTime;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      varying vec3 vDir;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        #include <logdepthbuf_fragment>
        float r = length(vDir.xy);
        float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
        float ang = atan(vDir.y, vDir.x);
        // Keplerian shear: angular speed falls with radius
        float swirl = ang + uTime * 1.6 / (0.35 + t) + t * 7.0;
        float turb = vnoise(vec3(cos(swirl) * 2.5, sin(swirl) * 2.5, t * 6.0));
        float I = pow(1.0 - t, 1.6) * smoothstep(0.0, 0.06, t) * (0.55 + 0.8 * turb) * uStrength;
        vec3 col = mix(uHot, uCool, smoothstep(0.0, 0.8, t));
        gl_FragColor = vec4(col * I, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Advances `uTime` of a shader material every frame and disposes it on unmount. */
export function useAnimatedShader(material: THREE.ShaderMaterial, speed = 1) {
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta * speed;
  });
}

/** A soft additive glow sprite (clusters, flashes, compact bright knots). */
export const GlowSprite: React.FC<{ size: number; color: THREE.ColorRepresentation; opacity?: number; position?: [number, number, number] }> = ({
  size,
  color,
  opacity = 0.8,
  position,
}) => (
  <sprite position={position} scale={[size, size, 1]} raycast={() => null}>
    <spriteMaterial
      map={getCoronaTexture()}
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  </sprite>
);
