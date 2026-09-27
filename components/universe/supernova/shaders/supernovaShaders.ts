// ============================================================================
// SUPERNOVA & KILONOVA GLSL SHADERS
// Models:
//   1. SN 1987A Circumstellar Pearl Ring (36 incandescent collision beads)
//   2. Rayleigh-Taylor Ejecta Blast Front
//   3. Kilonova r-process heavy element radioactive fireball
// ============================================================================

export const CircumstellarRingVertexShader = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const CircumstellarRingFragmentShader = `
uniform float uTime;
uniform vec3 uBaseColor;      // Glowing amber/golden shock plasma
uniform vec3 uHotspotColor;   // Incandescent pearl white-blue hotspot
uniform float uPearlCount;    // ~36 collision pearls

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // Angular coordinate around the circumstellar ring
  float angle = atan(vWorldPos.z, vWorldPos.x); // [-PI, PI]
  float normAngle = (angle + 3.14159265) / 6.2831853; // [0, 1]

  // Periodic pearls/hotspot beads where shockwave hits dense knots
  float pearlWave = sin(normAngle * uPearlCount * 6.2831853);
  float pearlIntensity = pow(clamp(pearlWave, 0.0, 1.0), 6.0);

  // Micro-flicker caused by relativistic plasma turbulence
  float flicker = sin(uTime * 3.0 + normAngle * 25.0) * 0.15 + 0.85;

  // Hotspots are intensely incandescent
  vec3 color = mix(uBaseColor, uHotspotColor, pearlIntensity * flicker);
  color *= (0.4 + pearlIntensity * 2.2 * flicker);

  // Soft ring edge falloff
  float edgeFalloff = clamp(dot(vNormal, vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
  float alpha = clamp(0.35 + pearlIntensity * 0.65, 0.0, 0.95);

  gl_FragColor = vec4(color, alpha);
}
`;

export const SupernovaEjectaVertexShader = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vViewDir = normalize(cameraPosition - vWorldPos);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const SupernovaEjectaFragmentShader = `
uniform float uTime;
uniform vec3 uCoreColor;       // Blinding radioactive fireball core
uniform vec3 uShockColor;      // Relativistic synchrotron shock shell
uniform float uInstabilityScale;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

// Simple pseudo-random hash & noise
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
  );
}

void main() {
  vec3 p = vWorldPos * 0.025;
  float t = uTime * 0.05;

  // Rayleigh-Taylor turbulent fingers expanding outward
  float rtFingers = noise(p * 2.5 + vec3(0.0, t, 0.0)) * 0.6 + noise(p * 5.0 - vec3(t, 0.0, t)) * 0.4;
  rtFingers = pow(rtFingers, 1.8);

  // Limb brightening
  float NdotV = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
  float rim = pow(1.0 - NdotV, 2.5);

  vec3 color = mix(uCoreColor, uShockColor, rtFingers);
  color += uShockColor * rim * 2.0;

  float alpha = clamp((rtFingers * 0.6 + rim * 0.4) * 0.85, 0.0, 0.92);

  gl_FragColor = vec4(color, alpha);
}
`;
