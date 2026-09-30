// ============================================================================
// BLACK HOLE GLSL SHADERS
// Every shader carries three's logarithmic-depth chunks: the universe canvas uses a log depth buffer, and a shader
// without them writes linear depth, so it depth-tests wrongly against everything else (disks vanishing behind the
// cosmic web, jets poking through the shadow).
//
//   1. Accretion disk        Keplerian shear, Novikov–Thorne temperature profile (white-hot at the ISCO),
//                            relativistic Doppler beaming (one side much brighter), gravitational redshift
//   2. Lensed image          camera-facing billboard: the razor-thin photon ring, the far side of the disk bent
//                            over (and under) the shadow (Interstellar / Luminet 1979), and for EHT targets the
//                            blurred orange ring seen face-on (M87* 2019, Sgr A* 2022)
//   3. Relativistic jet      collimated paraboloidal sheath, bright spine, moving shock knots, synchrotron blue
//   4. Mass-transfer stream  Roche-lobe overflow flowing from a donor star into the disk
//   5. Dusty torus           clumpy obscuring torus around a quasar
// ============================================================================

const LOG_VERT_PARS = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
`;
const LOG_FRAG_PARS = /* glsl */ `
#include <logdepthbuf_pars_fragment>
`;

const NOISE_GLSL = /* glsl */ `
vec3 bhMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 bhMod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 bhPermute(vec3 x) { return bhMod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = bhMod289(i);
  vec3 p = bhPermute(bhPermute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  return 0.55 * snoise(p) + 0.3 * snoise(p * 2.07 + 11.3) + 0.15 * snoise(p * 4.3 - 7.1);
}
`;

// Shared thermal palette: t in [0,1] (0 = cool outer disk, 1 = hottest gas at the inner edge)
const THERMAL_GLSL = /* glsl */ `
vec3 thermalColor(float t, vec3 cCore, vec3 cMid, vec3 cOuter) {
  vec3 c = mix(cOuter, cMid, smoothstep(0.0, 0.55, t));
  c = mix(c, cCore, smoothstep(0.5, 0.95, t));
  // The hottest gas saturates towards white
  return mix(c, vec3(1.0, 0.98, 0.94), smoothstep(0.85, 1.0, t) * 0.6);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// 1. ACCRETION DISK (a flat ring in the local XY plane; normal = local +Z, gas orbits counter-clockwise)
// ---------------------------------------------------------------------------------------------------------------
export const AccretionDiskVertexShader = /* glsl */ `
${LOG_VERT_PARS}
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

void main() {
  vLocalPos = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  float phi = atan(position.y, position.x);
  vec3 localTangent = vec3(-sin(phi), cos(phi), 0.0);
  vWorldTangent = normalize((modelMatrix * vec4(localTangent, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
  #include <logdepthbuf_vertex>
}
`;

export const AccretionDiskFragmentShader = /* glsl */ `
${LOG_FRAG_PARS}
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorOuter;
uniform float uInnerRadius;
uniform float uOuterRadius;
uniform float uRs;
uniform float uDopplerStrength;
uniform float uOpacity;
uniform float uBrightness;

varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vWorldTangent;

${NOISE_GLSL}
${THERMAL_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  float r = length(vLocalPos.xy);
  if (r < uInnerRadius * 0.995 || r > uOuterRadius) discard;

  float normR = clamp((r - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);
  float phi = atan(vLocalPos.y, vLocalPos.x);

  // Keplerian shear (Omega ~ r^-1.5): inner gas laps the outer gas, winding turbulence into trailing spirals
  float omega = pow(uInnerRadius / max(r, 1e-3), 1.5) * 2.2;
  float lnR = log(r / uInnerRadius);
  // Keplerian shear winds the gas into trailing streaks. Left unbounded the winding grows forever and turns into
  // fine concentric rings (aliasing), so two noise layers are advected over a limited window and cross-faded
  // (flow-map technique); the disk mesh itself keeps turning slowly.
  const float SHEAR_T = 4.0;
  float phA = fract(uTime / SHEAR_T);
  float phB = fract(uTime / SHEAR_T + 0.5);
  float wA = 1.0 - abs(2.0 * phA - 1.0);
  vec2 spA = vec2(cos(phi - omega * phA * SHEAR_T), sin(phi - omega * phA * SHEAR_T));
  vec2 spB = vec2(cos(phi - omega * phB * SHEAR_T), sin(phi - omega * phB * SHEAR_T));
  float turb = mix(fbm(spB * 3.2 + vec2(lnR * 5.0, -lnR * 2.0) + 17.0), fbm(spA * 3.2 + vec2(lnR * 5.0, -lnR * 2.0)), wA) * 0.5 + 0.5;
  float streaks = mix(snoise(spB * 2.4 + vec2(lnR * 9.0, lnR * 3.0) - 9.0), snoise(spA * 2.4 + vec2(lnR * 9.0, lnR * 3.0)), wA) * 0.5 + 0.5;
  float gasDensity = mix(turb, streaks, 0.3);
  gasDensity = 0.4 + 0.85 * gasDensity * gasDensity;

  // Novikov–Thorne / Shakura–Sunyaev temperature: T ~ r^-3/4 (1 - sqrt(r_in / r))^1/4, peaking just outside the
  // ISCO. The inner lip is kept hot (the plunging region still glows) so the edge reads white-hot.
  float x = r / uInnerRadius;
  float nt = pow(x, -0.75) * pow(max(1.0 - 1.0 / sqrt(x), 0.0), 0.25) / 0.488;
  float temp = clamp(max(nt, exp(-normR * 22.0)), 0.0, 1.0);
  temp = clamp(temp * (0.85 + 0.3 * turb), 0.0, 1.0);

  // Relativistic Doppler beaming: delta = 1 / (gamma (1 - beta cos theta)); I ~ delta^3 (intensity) —
  // the approaching side of the disk is several times brighter and bluer than the receding side
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float beta = clamp(sqrt(uRs / (2.0 * max(r, 1e-3))) * 0.95, 0.0, 0.62);
  float cosT = dot(normalize(vWorldTangent), viewDir);
  float gamma = inversesqrt(max(1.0 - beta * beta, 1e-3));
  float delta = 1.0 / (gamma * (1.0 - beta * cosT));
  float beaming = pow(clamp(delta, 0.2, 3.0), 3.0 * uDopplerStrength);

  // Gravitational redshift: light climbing out of the well loses energy
  float gRed = sqrt(max(1.0 - uRs / max(r, uRs * 1.05), 0.05));

  // Observed temperature shifts with delta * g (blue-shifted approaching side runs hotter)
  float tObs = clamp(temp * mix(1.0, delta * gRed, 0.55), 0.0, 1.0);
  vec3 color = thermalColor(tObs, uColorCore, uColorMid, uColorOuter);

  float innerEdge = smoothstep(0.0, 0.025, normR);
  float outerFade = 1.0 - smoothstep(0.55, 1.0, normR);
  float emissivity = (0.1 + 1.05 * temp * temp) * gasDensity * innerEdge * outerFade;
  float intensity = emissivity * beaming * gRed * uBrightness;

  // Soft highlight roll-off (keeps the beamed side white-hot without clipping the whole disk)
  vec3 outCol = 1.0 - exp(-color * intensity * 1.2);
  gl_FragColor = vec4(outCol, clamp(uOpacity, 0.0, 1.0));
}
`;

// ---------------------------------------------------------------------------------------------------------------
// 2. LENSED IMAGE BILLBOARD (always faces the camera; local XY = screen right/up; unit = shadow radius)
//    uUp: screen direction the far side of the disk is lifted towards; uApp: screen direction of the approaching
//    side; uCosInc: |disk normal . view| (1 = face-on); uAsym: how clearly the camera is above or below the disk
// ---------------------------------------------------------------------------------------------------------------
export const LensedImageVertexShader = /* glsl */ `
${LOG_VERT_PARS}
varying vec2 vP;
uniform float uHalfSize;

void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;

export const LensedImageFragmentShader = /* glsl */ `
${LOG_FRAG_PARS}
uniform float uTime;
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorOuter;
uniform float uShadowRadius;
uniform float uDiskWidth;   // (outer - inner) disk radius in shadow radii
uniform vec2 uUp;
uniform vec2 uApp;
uniform float uCosInc;
uniform float uAsym;
uniform float uDoppler;
uniform float uLensing;     // 0: photon ring only
uniform float uEht;         // 1: EHT-style ring when face-on (M87*, Sgr A*)
uniform float uEhtKnots;    // Sgr A*: three bright knots on the ring
uniform float uBrightness;

varying vec2 vP;

${NOISE_GLSL}
${THERMAL_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  vec2 p = vP / uShadowRadius;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);
  float s = dot(dir, uUp);        // +1 over the top (far side lifted), -1 underneath
  float app = dot(dir, uApp);     // +1 approaching side
  float edgeOn = 1.0 - uCosInc;
  float ang = atan(p.y, p.x);

  // Doppler asymmetry of the lensed light (strongest edge-on, still present face-on — the EHT crescent)
  float dop = pow(clamp(1.0 + 0.55 * app * uDoppler * (0.45 + 0.55 * edgeOn), 0.15, 2.2), 3.0);

  // 1. Photon ring: light that orbited the hole before escaping — razor thin, just outside the shadow edge
  float pr = exp(-pow((r - 1.015) / 0.012, 2.0)) * 2.4 + exp(-pow((r - 1.04) / 0.035, 2.0)) * 0.55;
  vec3 col = vec3(1.0, 0.93, 0.82) * pr * (0.55 + 0.45 * dop);

  // 2. The far side of the disk bent over the shadow (thick arc on top) and its underside image (thin arc below).
  //    Face-on both merge into a thin ring hugging the shadow.
  float wTop = mix(0.18, max(0.32, uDiskWidth * 0.3), edgeOn);
  float wBot = mix(0.18, 0.09, edgeOn);
  float wMid = 0.5 * (wTop + wBot);
  float up01 = s * 0.5 + 0.5;
  float w = mix(mix(wMid, wBot, uAsym), mix(wMid, wTop, uAsym), smoothstep(0.0, 1.0, up01));
  float r0 = 1.06;
  float u = (r - r0) / w;                  // 0 at the inner edge of the arc, 1 at its outer edge
  float band = smoothstep(-0.08, 0.05, u) * (1.0 - smoothstep(0.55, 1.0, u));
  // The arc thins where it meets the disk at the sides (edge-on)
  band *= mix(1.0, 0.35 + 0.65 * abs(s), edgeOn * 0.8);
  // Hot inner rim of the image (the ISCO) grading to the cooler outer disk
  float tArc = exp(-max(u, 0.0) * 1.7);
  float advAng = ang - uTime * 0.9;
  vec2 sa = vec2(cos(advAng), sin(advAng));
  float turb = fbm(sa * 2.0 + vec2(u * 3.0, -u * 1.5)) * 0.5 + 0.5;
  // Compressed image of the disk's rings
  float striae = 0.75 + 0.25 * sin(u * 22.0 + turb * 4.0);
  vec3 arcCol = thermalColor(clamp(tArc * (0.85 + 0.3 * turb) * mix(1.0, 1.15, clamp(app, 0.0, 1.0)), 0.0, 1.0),
                             uColorCore, uColorMid, uColorOuter);
  float arc = band * (0.12 + 1.1 * tArc) * (0.6 + 0.55 * turb) * striae * dop * uLensing;
  col += arcCol * arc * 0.9;

  // 3. EHT look (M87* 2019, Sgr A* 2022): seen nearly face-on, the whole image is a thick, blurred orange ring
  //    ~2.6x the horizon with one bright crescent (Doppler beaming) — Sgr A* shows three bright knots
  float faceOn = smoothstep(0.55, 0.95, uCosInc) * uEht;
  if (faceOn > 0.0) {
    float ring = exp(-pow((r - 1.18) / 0.22, 2.0));
    float knots = 1.0 + uEhtKnots * 0.55 * (pow(0.5 + 0.5 * cos(3.0 * ang + 1.3), 3.0) - 0.35);
    float crescent = 0.45 + 0.75 * pow(clamp(0.5 + 0.5 * app, 0.0, 1.0), 1.6);
    vec3 eht = mix(vec3(0.85, 0.28, 0.03), vec3(1.0, 0.78, 0.38), ring * crescent);
    col += eht * ring * crescent * knots * faceOn * 1.6;
  }

  // 4. Faint scattered glow around the whole system (corona / unresolved emission)
  float glow = exp(-max(r - 1.0, 0.0) * 1.6) * smoothstep(0.92, 1.05, r) * 0.1;
  col += uColorMid * glow;

  // Inside the shadow nothing escapes
  col *= smoothstep(0.975, 1.0, r);
  // Fade at the billboard edge
  col *= 1.0 - smoothstep(0.8, 1.0, length(vP) / (uShadowRadius * 3.6));

  gl_FragColor = vec4(1.0 - exp(-col * uBrightness * 1.2), 1.0);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// 3. RELATIVISTIC JET (unit open cylinder, y in [-0.5, 0.5]; reshaped here into a paraboloid of length uLength)
// ---------------------------------------------------------------------------------------------------------------
export const RelativisticJetVertexShader = /* glsl */ `
${LOG_VERT_PARS}
uniform float uLength;
uniform float uRadius;
varying float vAxial;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vAzimuth;

void main() {
  float axial = position.y + 0.5;                 // 0 at the black hole, 1 at the tip
  // Collimation: parabolic near the base (r ~ z^0.58, as measured for M87), opening slowly further out
  float radius = uRadius * (0.035 + 0.965 * pow(axial, 0.58));
  vec3 p = vec3(position.x * radius, axial * uLength, position.z * radius);
  vAxial = axial;
  vAzimuth = atan(position.z, position.x);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * vec3(position.x, 0.0, position.z));
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

export const RelativisticJetFragmentShader = /* glsl */ `
${LOG_FRAG_PARS}
uniform float uTime;
uniform vec3 uJetColor;
uniform vec3 uKnotColor;
uniform float uSpeed;
uniform float uKnotFrequency;
uniform float uOpacity;
uniform float uLength;

varying float vAxial;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vAzimuth;

${NOISE_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  float a = vAxial;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  // The jet is a glowing volume, not a tube: brightest along the line of sight through its axis, fading to
  // nothing at the silhouette (no hard edge)
  float facing = abs(dot(normalize(vWorldNormal), viewDir));
  float body = pow(facing, 1.4);
  float spine = pow(facing, 10.0);

  // Shock knots moving outward (HST-1, knot A…): sharp in front, trailing behind
  float kp = a * uKnotFrequency * 2.0 - uTime * uSpeed * 0.35;
  float kf = fract(kp);
  float knots = pow(1.0 - kf, 5.0) * smoothstep(0.0, 0.06, kf) * 1.0 + exp(-pow((a - 0.08) / 0.03, 2.0)) * 1.2;
  knots *= 0.6 + 0.4 * snoise(vec2(floor(kp) * 3.7, 1.3));

  // Helical / Kelvin–Helmholtz filaments in the sheath
  float helix = snoise(vec2(vAzimuth * 1.6 + a * 14.0 - uTime * uSpeed * 0.6, a * 30.0 - uTime * uSpeed)) * 0.5 + 0.5;

  // Brightness falls along the jet (synchrotron losses); a gentle base brightening; soft ends
  float along = exp(-a * 2.3) * 0.8 + 0.2;
  float ends = smoothstep(0.0, 0.03, a) * (1.0 - smoothstep(0.7, 1.0, a));

  vec3 color = mix(uJetColor, vec3(1.0), spine * 0.6);
  color = mix(color, uKnotColor, clamp(knots * 0.7, 0.0, 1.0));
  float intensity = (body * (0.35 + 0.35 * helix) + spine * 1.1 + knots * body * 1.5) * along * ends;

  gl_FragColor = vec4((1.0 - exp(-color * intensity * 1.3)) * uOpacity, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// 4. MASS-TRANSFER STREAM (tube: uv.x runs from the donor star to the disk)
// ---------------------------------------------------------------------------------------------------------------
export const StreamVertexShader = /* glsl */ `
${LOG_VERT_PARS}
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

export const StreamFragmentShader = /* glsl */ `
${LOG_FRAG_PARS}
uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

${NOISE_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  float t = vUv.x;
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  float core = pow(facing, 1.6);
  // Clumps of gas flowing towards the disk
  float flow = snoise(vec2(t * 14.0 - uTime * 1.6, vUv.y * 2.0)) * 0.5 + 0.5;
  float ends = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));
  vec3 col = mix(uColorStart, uColorEnd, t);
  float intensity = core * (0.35 + 0.8 * flow) * ends * (0.6 + 0.8 * t);
  gl_FragColor = vec4(col * intensity, 1.0);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// 5. DUSTY TORUS (quasar): clumpy, dark, lit on its inner face by the central engine
// ---------------------------------------------------------------------------------------------------------------
export const DustyTorusVertexShader = /* glsl */ `
${LOG_VERT_PARS}
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vCenterWorld;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vCenterWorld = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

export const DustyTorusFragmentShader = /* glsl */ `
${LOG_FRAG_PARS}
uniform float uTime;
uniform float uRadius;
uniform vec3 uDustColor;
uniform vec3 uLitColor;
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vCenterWorld;

${NOISE_GLSL}

void main() {
  #include <logdepthbuf_fragment>
  float phi = atan(vLocal.y, vLocal.x);
  vec2 q = vec2(cos(phi - uTime * 0.02), sin(phi - uTime * 0.02)) * 3.0 + vec2(vLocal.z / uRadius * 6.0);
  float clumps = fbm(q) * 0.5 + 0.5;
  vec3 n = normalize(vWorldNormal);
  vec3 toCenter = normalize(vCenterWorld - vWorldPos);
  float lit = pow(max(dot(n, toCenter), 0.0), 1.5);
  float facing = abs(dot(n, normalize(cameraPosition - vWorldPos)));
  vec3 col = mix(uDustColor, uLitColor, lit * (0.4 + 0.6 * clumps));
  float alpha = clamp((0.35 + 0.55 * clumps) * (0.35 + 0.65 * facing), 0.0, 0.9);
  gl_FragColor = vec4(col * (0.4 + 1.4 * lit), alpha);
}
`;
