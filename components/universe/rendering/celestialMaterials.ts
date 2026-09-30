import * as THREE from 'three';
import { getRealTexture } from '@/lib/realTextures';

// Shared, physically-motivated materials for planets and stars. Every custom shader includes three's
// logarithmic-depth chunks (the universe canvas uses a log depth buffer; without them custom shaders depth-test
// wrongly against standard materials).

// ---------------------------------------------------------------------------------------------------------------
// Temperature → colour (blackbody approximation, Tanner Helland's fit), for stars and hot gas
// ---------------------------------------------------------------------------------------------------------------
export function kelvinToColor(kelvin: number, out = new THREE.Color()) {
  const t = Math.min(40000, Math.max(1000, kelvin)) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return out.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
}

// ---------------------------------------------------------------------------------------------------------------
// Planet surface with night-side lights: a standard material (so it is lit by the pooled Sun light like
// everything else) whose emissive map shows only on the side facing away from the Sun.
// ---------------------------------------------------------------------------------------------------------------
const _sunView = new THREE.Vector3();

export function createNightLitMaterial(
  params: THREE.MeshStandardMaterialParameters & { sunWorld?: THREE.Vector3; oceanGlint?: boolean }
) {
  const { sunWorld = new THREE.Vector3(0, 0, 0), oceanGlint = false, ...rest } = params;
  const mat = new THREE.MeshStandardMaterial(rest);
  const uniforms = { uSunView: { value: new THREE.Vector3() } };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSunView = uniforms.uSunView;
    if (oceanGlint) {
      // Oceans are glossy, land is matte: water pixels of the day map are distinctly blue
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
  {
    float ocean = smoothstep(0.02, 0.12, diffuseColor.b - max(diffuseColor.r, diffuseColor.g * 0.9));
    roughnessFactor = mix(roughnessFactor, 0.22, ocean);
  }`
      );
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec3 uSunView;\nvoid main() {')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
  {
    // Night lights fade in across the terminator (view space: surface point = -vViewPosition)
    vec3 toSun = normalize(uSunView + vViewPosition);
    float sunFacing = dot(normalize(vNormal), toSun);
    totalEmissiveRadiance *= smoothstep(0.08, -0.22, sunFacing);
  }`
      );
  };
  mat.customProgramCacheKey = () => (oceanGlint ? 'night-lit-ocean' : 'night-lit');
  // Callers invoke this from onBeforeRender (or useFrame) with the active camera
  mat.userData.updateSun = (camera: THREE.Camera) => {
    uniforms.uSunView.value.copy(_sunView.copy(sunWorld).applyMatrix4(camera.matrixWorldInverse));
  };
  return mat;
}

// ---------------------------------------------------------------------------------------------------------------
// Atmosphere rim: a slightly larger shell, brightest at the limb and on the day side (Rayleigh-like haze)
// ---------------------------------------------------------------------------------------------------------------
export function createAtmosphereMaterial(color: THREE.ColorRepresentation, strength = 1, sunWorld = new THREE.Vector3()) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uStrength: { value: strength },
      uSunWorld: { value: sunWorld },
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform vec3 uColor;
      uniform float uStrength;
      uniform vec3 uSunWorld;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        #include <logdepthbuf_fragment>
        vec3 viewDir = normalize(cameraPosition - vPosW);
        float rim = 1.0 - max(dot(vNormalW, viewDir), 0.0);
        rim = pow(rim, 2.6);
        float day = dot(vNormalW, normalize(uSunWorld - vPosW));
        float lit = smoothstep(-0.35, 0.45, day);
        gl_FragColor = vec4(uColor * rim * lit * uStrength, rim * lit);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Star photosphere: the Sun's real texture reused for every star, tinted by temperature, slowly churning
// granulation, limb darkening. `time` advances via material.uniforms.uTime.
// ---------------------------------------------------------------------------------------------------------------
export function createStarMaterial(opts: { kelvin?: number; color?: THREE.ColorRepresentation; brightness?: number; spots?: number } = {}) {
  const tint = opts.color !== undefined ? new THREE.Color(opts.color) : kelvinToColor(opts.kelvin ?? 5772);
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: getRealTexture('sun') },
      uTint: { value: tint },
      uBrightness: { value: opts.brightness ?? 1.6 },
      uSpots: { value: opts.spots ?? 1 },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_vertex>
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <logdepthbuf_pars_fragment>
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uBrightness;
      uniform float uSpots;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        #include <logdepthbuf_fragment>
        // Two drifting samples of the real photosphere: granulation that slowly boils
        vec3 a = texture2D(uMap, vUv + vec2(uTime * 0.0035, 0.0)).rgb;
        vec3 b = texture2D(uMap, vUv * 1.7 + vec2(-uTime * 0.0021, uTime * 0.0013)).rgb;
        float lum = dot(mix(a, b, 0.35), vec3(0.299, 0.587, 0.114));
        // Sunspots are the darkest parts of the map: keep them for Sun-like stars, soften for others
        lum = mix(max(lum, 0.45), lum, uSpots);
        // Limb darkening (Eddington approximation): the edge of a star is dimmer and redder
        float mu = max(dot(vNormalW, normalize(cameraPosition - vPosW)), 0.0);
        float limb = 0.4 + 0.6 * mu;
        vec3 col = uTint * (0.55 + 0.9 * lum) * limb * uBrightness;
        col = mix(col * vec3(1.0, 0.82, 0.62), col, mu);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// Soft camera-facing corona / glow sprite for stars (additive, fades with the star's colour)
let glowTexture: THREE.CanvasTexture | null = null;
export function getCoronaTexture() {
  if (glowTexture) return glowTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.05)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}
