import * as THREE from 'three';

/**
 * Procedural Simplex/Hash Noise in GLSL
 * Efficient and seamless without requiring any external textures.
 */
const NOISE_GLSL = `
// 2D Simplex/Hash noise helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  return 0.65 * snoise(p) + 0.35 * snoise(p * 2.05);
}
`;

/**
 * 1. RELATIVISTIC ACCRETION DISK SHADER
 * Grounded in Kip Thorne (2015), Jeremy Schnittman (NASA GSFC 2019), and EHT (2019, 2022).
 * Features:
 * - Keplerian differential rotation (Omega ~ r^-1.5)
 * - Relativistic Doppler boosting (flux ~ delta^3)
 * - Gravitational redshift (sqrt(1 - Rs/r))
 * - Procedural sheared magneto-hydrodynamic (MHD) plasma turbulence
 * - Razor-sharp photon ring emission at 1.5 Rs
 */
export const AccretionDiskVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

void main() {
  vUv = uv;
  vLocalPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;

  float phi = atan(position.y, position.x);
  vec3 localTangent = vec3(-sin(phi), cos(phi), 0.0);
  vWorldTangent = normalize((modelMatrix * vec4(localTangent, 0.0)).xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const AccretionDiskFragmentShader = `
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorOuter;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uRs; // Schwarzschild radius
uniform float uDopplerStrength;
uniform float uTurbulenceScale;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

${NOISE_GLSL}

void main() {
  // Cylindrical coordinate distance in disk plane (XZ)
  float r = length(vLocalPos.xy); // Geometry is ring in XY or XZ
  if (r < uInnerRadius || r > uOuterRadius) {
    discard;
  }

  // Normalized radial coordinate: 0 at inner edge (ISCO), 1 at outer edge
  float normR = clamp((r - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);
  float phi = atan(vLocalPos.y, vLocalPos.x);

  // 1. Keplerian differential rotation: Inner gas orbits much faster (Omega ~ r^-1.5)
  float omega = pow(uInnerRadius / max(r, 0.01), 1.5) * 2.5;
  float advectedPhi = phi - uTime * omega;

  // 2. Sheared Turbulent Plasma using FBM Noise
  vec2 polarCoords = vec2(normR * 12.0 * uTurbulenceScale, advectedPhi * 4.0);
  // Logarithmic spiral twist
  polarCoords.x += sin(advectedPhi * 2.0 - normR * 8.0) * 1.5;
  float turbulence = fbm(polarCoords) * 0.5 + 0.5;

  // Filamentary spirals
  float spiralWaves = sin(advectedPhi * 3.0 - normR * 16.0 + uTime * 0.8) * 0.5 + 0.5;
  turbulence = mix(turbulence, spiralWaves, 0.35);

  // 3. Relativistic Doppler Boosting (Headlight Effect)
  vec3 worldTangent = normalize(vWorldTangent);
  // View direction from surface to camera
  vec3 viewDir = normalize(cameraPosition - vWorldPos);

  // Velocity beta = v/c ~ sqrt(Rs / (2*r)), caps at ~0.5c at ISCO
  float beta = clamp(sqrt(max(uRs / (2.0 * max(r, 0.01)), 0.0)) * 0.65, 0.0, 0.58);
  float cosTheta = dot(worldTangent, viewDir);
  // Relativistic Doppler factor delta = sqrt(1 - beta^2) / (1 - beta * cosTheta)
  float gamma = 1.0 / sqrt(max(1.0 - beta * beta, 0.001));
  float dopplerFactor = 1.0 / (gamma * (1.0 - beta * cosTheta));
  // Flux intensity boost ~ delta^3
  float dopplerBoost = pow(clamp(dopplerFactor, 0.15, 3.5), 3.0 * uDopplerStrength);

  // 4. Gravitational Redshift: Light climbing out of potential loses energy
  // g = sqrt(1 - Rs / r)
  float gravRedshift = clamp(sqrt(max(1.0 - uRs / max(r, uRs * 1.05), 0.05)), 0.05, 1.0);

  // 5. Thermal Color Gradient (White-hot inner ISCO -> Synchrotron Gold -> Crimson Outer)
  vec3 color;
  if (normR < 0.25) {
    float t = normR / 0.25;
    color = mix(uColorCore, uColorMid, t);
  } else {
    float t = (normR - 0.25) / 0.75;
    color = mix(uColorMid, uColorOuter, t);
  }

  // Apply Doppler color temperature shift: Approaching side blueshifts/heats, receding redshifts/cools
  if (dopplerFactor > 1.0) {
    color = mix(color, vec3(1.0, 1.0, 1.0), clamp((dopplerFactor - 1.0) * 0.6, 0.0, 0.8));
  } else {
    color = mix(color, vec3(0.5, 0.05, 0.01), clamp((1.0 - dopplerFactor) * 0.7, 0.0, 0.9));
  }

  // 6. Razor-Sharp Photon Ring (at r ~ 1.5 * Rs = 3 GM/c^2)
  float photonRingPos = (uRs * 1.5 - uInnerRadius) / (uOuterRadius - uInnerRadius);
  float distToPhotonRing = abs(normR - photonRingPos);
  float photonRing = exp(-distToPhotonRing * 60.0) * 3.5;

  // 7. Radial Falloff & Inner Plunge
  // Inner boundary plunge into horizon: rapid drop inside ISCO
  float innerPlunge = smoothstep(0.0, 0.08, normR);
  // Outer soft boundary
  float outerFade = smoothstep(1.0, 0.65, normR);
  float density = innerPlunge * outerFade * (0.6 + 0.8 * turbulence);

  // Combine radiance
  vec3 finalColor = (color * (density + photonRing * 0.8) * dopplerBoost) * gravRedshift;

  // Alpha transparency
  float alpha = clamp((density * 0.85 + photonRing * 0.95) * uOpacity * (0.4 + 0.6 * dopplerBoost), 0.0, 0.98);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

/**
 * 2. GRAVITATIONAL LENSING HALO SHADER (The "Interstellar" / Kip Thorne Arch)
 * Renders the secondary image of the accretion disk gravitationally bent
 * over the top and bottom of the event horizon shadow.
 */
export const LensingHaloVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

void main() {
  vUv = uv;
  vLocalPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;

  float phi = atan(position.y, position.x);
  vec3 localTangent = vec3(-sin(phi), cos(phi), 0.0);
  vWorldTangent = normalize((modelMatrix * vec4(localTangent, 0.0)).xyz);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const LensingHaloFragmentShader = `
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorOuter;
uniform float uShadowRadius;
uniform float uHaloRadius;
uniform float uDopplerStrength;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

${NOISE_GLSL}

void main() {
  // Cylindrical distance from center
  float r = length(vLocalPos.xy);
  if (r < uShadowRadius || r > uHaloRadius) {
    discard;
  }

  float normR = clamp((r - uShadowRadius) / (uHaloRadius - uShadowRadius), 0.0, 1.0);
  float phi = atan(vLocalPos.y, vLocalPos.x);

  // Orbital motion in the halo
  float omega = pow(uShadowRadius / max(r, 0.01), 1.2) * 1.8;
  float advectedPhi = phi - uTime * omega;

  // Turbulent shearing plasma
  float turb = fbm(vec2(normR * 10.0, advectedPhi * 3.0)) * 0.5 + 0.5;

  // View direction and Doppler beaming across the arch
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 worldTangent = normalize(vWorldTangent);

  float beta = clamp(sqrt(max(uShadowRadius / (2.5 * max(r, 0.01)), 0.0)) * 0.5, 0.0, 0.45);
  float cosTheta = dot(worldTangent, viewDir);
  float gamma = 1.0 / sqrt(max(1.0 - beta * beta, 0.001));
  float dopplerFactor = 1.0 / (gamma * (1.0 - beta * cosTheta));
  float dopplerBoost = pow(clamp(dopplerFactor, 0.2, 3.0), 2.5 * uDopplerStrength);

  // Color gradient
  vec3 baseColor = mix(uColorMid, uColorCore, 1.0 - normR);
  if (dopplerFactor > 1.0) {
    baseColor = mix(baseColor, vec3(1.0, 1.0, 1.0), (dopplerFactor - 1.0) * 0.5);
  } else {
    baseColor = mix(baseColor, uColorOuter, (1.0 - dopplerFactor) * 0.6);
  }

  // Extreme limb brightening near shadow boundary (Einstein Ring peak)
  float einsteinPeak = exp(-normR * 14.0) * 2.8;
  float outerFade = smoothstep(1.0, 0.4, normR);
  float intensity = (einsteinPeak + (1.0 - normR) * 0.8 * turb) * outerFade * dopplerBoost;

  float alpha = clamp(intensity * uOpacity, 0.0, 0.95);
  gl_FragColor = vec4(baseColor * intensity, alpha);
}
`;

/**
 * 3. RELATIVISTIC SYNCHROTRON PLASMA JET SHADER
 * Models ultra-relativistic collimated plasma jets (M87*, TON 618, Cygnus X-1)
 * Features:
 * - Helical magnetic field lines twisting around the jet
 * - Periodic internal shock knots (e.g. HST-1 knot in M87)
 * - Limb-brightened hollow sheath geometry
 * - Axial Doppler velocity gradient
 */
export const RelativisticJetVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const RelativisticJetFragmentShader = `
uniform float uTime;
uniform vec3 uJetColor;
uniform vec3 uKnotColor;
uniform float uSpeed;
uniform float uKnotFrequency;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;

${NOISE_GLSL}

void main() {
  // vUv.y is axial position along jet (0 at base, 1 at tip)
  // vUv.x is azimuth around jet cylinder
  float axial = vUv.y;
  float azimuth = vUv.x * 6.2831853;

  // 1. Helical Magnetic Twist: Filaments corkscrewing around the jet axis
  float twist = azimuth + axial * 18.0 - uTime * uSpeed * 2.0;
  float helix = sin(twist * 2.0) * 0.5 + 0.5;
  helix = pow(helix, 3.0);

  // 2. Relativistic Internal Shock Knots (Periodic plasma compression nodes like HST-1)
  float knotPhase = axial * uKnotFrequency - uTime * uSpeed;
  float knots = pow(sin(knotPhase * 3.14159) * 0.5 + 0.5, 8.0) * 2.5;

  // 3. Turbulent Synchrotron Plasma
  float turb = snoise(vec2(azimuth * 2.0, axial * 12.0 - uTime * uSpeed * 1.5)) * 0.5 + 0.5;

  // 4. Limb Brightening (Hollow cylindrical plasma sheath)
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = 1.0 - abs(dot(vNormal, viewDir));
  rim = pow(rim, 1.8);

  // 5. Axial Falloff (Bright base, dissipation at tip)
  float baseFade = smoothstep(0.0, 0.05, axial);
  float tipFade = smoothstep(1.0, 0.6, axial);
  float axialEnvelope = baseFade * tipFade;

  // Color mix: Core synchrotron blue/violet with white-hot shock knots
  vec3 color = mix(uJetColor, uKnotColor, clamp(knots * 0.6 + helix * 0.4, 0.0, 1.0));
  float intensity = (rim * 1.4 + helix * 0.8 + knots * 1.5 + turb * 0.4) * axialEnvelope;

  float alpha = clamp(intensity * uOpacity, 0.0, 0.95);
  gl_FragColor = vec4(color * (intensity * 1.2), alpha);
}
`;
