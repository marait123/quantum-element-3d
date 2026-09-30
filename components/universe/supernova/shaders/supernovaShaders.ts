// ============================================================================
// SUPERNOVA & KILONOVA GLSL SHADERS
//   1. Circumstellar ring (SN 1987A): thin glowing gas ring, angle measured in the ring's own frame
//   2. Expanding ejecta / fireball: optically thin shell with Rayleigh–Taylor fingers (noise in local space),
//      limb-brightened; optional polar/equatorial colouring (kilonova blue + red components)
// Both include three's log-depth chunks (the universe canvas uses a logarithmic depth buffer).
// ============================================================================

const VALUE_NOISE_GLSL = /* glsl */ `
float snHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float snNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(snHash(i + vec3(0,0,0)), snHash(i + vec3(1,0,0)), f.x),
        mix(snHash(i + vec3(0,1,0)), snHash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(snHash(i + vec3(0,0,1)), snHash(i + vec3(1,0,1)), f.x),
        mix(snHash(i + vec3(0,1,1)), snHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float snFbm(vec3 p) {
  return snNoise(p) * 0.55 + snNoise(p * 2.1 + 3.7) * 0.3 + snNoise(p * 4.3 - 1.9) * 0.15;
}
`;

export const CircumstellarRingVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vLocal = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
  #include <logdepthbuf_vertex>
}
`;

export const CircumstellarRingFragmentShader = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uHotspotColor;
uniform float uPearlCount;
uniform float uIntensity;
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

${VALUE_NOISE_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  // Torus lies in its local XY plane
  float angle = atan(vLocal.y, vLocal.x);
  float u = (angle + 3.14159265) / 6.2831853;
  // Clumpy gas: dense knots where the blast wave hits hardest
  float clump = snFbm(vec3(u * 24.0, 0.0, 0.0));
  float pearls = pow(max(sin(u * uPearlCount * 6.2831853 + clump * 2.0), 0.0), 8.0) * step(0.35, clump);
  float flicker = 0.85 + 0.15 * sin(uTime * 2.0 + u * 40.0);
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  float glow = 0.35 + 0.65 * facing;
  vec3 col = uBaseColor * (0.35 + 0.8 * clump) + uHotspotColor * pearls * 1.6 * flicker;
  gl_FragColor = vec4(col * glow * uIntensity, 1.0);
}
`;

export const SupernovaEjectaVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vLocal = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
  #include <logdepthbuf_vertex>
}
`;

export const SupernovaEjectaFragmentShader = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform vec3 uCoreColor;       // hot inner ejecta
uniform vec3 uShockColor;      // cooler outer fingers / limb
uniform vec3 uPolarColor;      // kilonova: fast, lanthanide-poor polar ejecta (blue)
uniform float uPolarMix;
uniform float uFingerScale;
uniform float uIntensity;
uniform vec3 uSeed;
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

${VALUE_NOISE_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  vec3 dir = normalize(vLocal);
  float t = uTime * 0.03;
  // Rayleigh–Taylor fingers: plumes of dense ejecta poking through the shell (direction-only pattern, slowly evolving)
  float cells = snFbm(dir * 4.0 * uFingerScale + uSeed + vec3(0.0, t, 0.0));
  float fingers = pow(smoothstep(0.35, 0.8, cells), 1.5);
  float fine = snNoise(dir * 13.0 * uFingerScale + uSeed * 1.3 - vec3(t));
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  float limb = pow(1.0 - facing, 1.6);
  vec3 col = mix(uCoreColor, uShockColor, clamp(limb * 0.8 + (1.0 - fingers) * 0.4, 0.0, 1.0));
  col = mix(col, uPolarColor, uPolarMix * smoothstep(0.35, 0.85, abs(dir.y)));
  float intensity = (0.18 + 0.9 * fingers * (0.6 + 0.4 * fine)) * (0.35 + 1.3 * limb);
  gl_FragColor = vec4(col * intensity * uIntensity, 1.0);
}
`;
