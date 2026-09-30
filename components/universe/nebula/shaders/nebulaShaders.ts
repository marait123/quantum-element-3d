// ============================================================================
// VOLUMETRIC NEBULA SHADERS (view-aligned slices)
// The nebula is drawn as a stack of camera-facing slices in ONE mesh (ordered far → near, so a single draw call
// composites correctly). Each fragment evaluates the nebula's emission and dust at its true 3D position in the
// nebula's own frame, so the cloud looks the same from every side, has no spherical silhouette, and dust can
// really obscure the glowing gas behind it (premultiplied "over" blending: rgb = emission, a = absorption).
//
// Morphologies (uMorph): 0 Pillars of Creation (M16) · 1 Crab Nebula (M1) · 2 Ring Nebula (M57)
//                        3 H II star-forming nursery (M42, Carina, 30 Dor, NGC 604…) · 4 superbubble (N44, N11)
// Palette: uColA H-alpha / [N II] red-pink · uColB [O III] teal / blue reflection · uColC [S II] gold ionization
//          fronts · uColD synchrotron / hot-core blue-white
// Includes three's log-depth chunks (the universe canvas uses a logarithmic depth buffer).
// ============================================================================

export const NebulaSliceVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
uniform mat4 uSliceToLocal;   // slice mesh frame -> nebula frame (rotation only)
uniform float uRadius;
varying vec3 vP;              // position in the nebula frame, in units of its radius

void main() {
  vP = (uSliceToLocal * vec4(position, 1.0)).xyz / uRadius;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;

export const NebulaSliceFragmentShader = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform float uMorph;
uniform vec3 uColA;
uniform vec3 uColB;
uniform vec3 uColC;
uniform vec3 uColD;
uniform vec3 uDustCol;
uniform float uDust;
uniform float uFilaments;
uniform float uStep;
uniform float uGain;
uniform vec3 uSeed;
uniform vec3 uAxis;           // Ring Nebula barrel axis
uniform vec3 uCore;           // bright core / cavity centre (nursery)
uniform float uLayerFade;     // distance fade (declared here so it scales emission as well as absorption)

varying vec3 vP;

vec4 nPermute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 nTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = nPermute(nPermute(nPermute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = nTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < NEB_OCTAVES; i++) {
    v += a * snoise(p);
    p = p * 2.03 + vec3(0.31, 0.71, 0.17);
    a *= 0.5;
  }
  return v;
}

// Ridged noise: thin bright sheets/filaments where the noise crosses zero
float ridged(vec3 p, float sharp) {
  return pow(1.0 - abs(snoise(p)), sharp);
}

// One pillar (elephant trunk) of the Eagle: a leaning, tapering column with a rounded, eroded head
float pillar(vec3 p, vec2 base, float y0, float y1, float w, float lean, float n) {
  float h = clamp((p.y - y0) / (y1 - y0), 0.0, 1.0);
  vec2 axis = base + vec2(lean * h, 0.0);
  float rad = w * (1.0 - 0.35 * h) + n * 0.07;
  float d = length(p.xz - axis) - rad;
  float top = y1 + n * 0.08;
  float cap = length(vec2(max(d + rad * 0.6, 0.0), max(p.y - top + rad * 0.6, 0.0))) - rad * 0.6;
  return max(d, max(p.y - top, cap * 0.5));
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 p = vP;
  float r = length(p);
  if (r > 1.0) discard;
  float t = uTime * 0.012;

  vec3 emis = vec3(0.0);
  float dust = 0.0;

  if (uMorph < 0.5) {
    // ---------------- PILLARS OF CREATION: dark dusty columns against glowing gas ----------------
    float n = fbm(p * 3.2 + uSeed);
    float d1 = pillar(p, vec2(-0.34, 0.02), -1.1, 0.62, 0.21, 0.12, n);
    float d2 = pillar(p, vec2(0.06, -0.08), -1.1, 0.1, 0.17, 0.05, n);
    float d3 = pillar(p, vec2(0.4, 0.1), -1.1, -0.3, 0.15, -0.04, n);
    float d = min(d1, min(d2, d3));
    float inside = smoothstep(0.03, -0.03, d);
    // Photo-evaporating skin: bright where the column surface faces the ionizing cluster above (+y)
    float skin = exp(-pow(d / 0.025, 2.0));
    float lit = 0.15 + 0.85 * smoothstep(-0.3, 0.7, p.y);
    // Diffuse glowing gas of the H II region filling the frame, brighter upward (towards NGC 6611)
    float g = fbm(p * 1.7 + uSeed + vec3(0.0, t, 0.0)) * 0.5 + 0.5;
    float env = (1.0 - smoothstep(0.45, 1.0, r + 0.35 * (g - 0.5)));
    vec3 gasCol = mix(uColB, mix(uColB, uColC, 0.55), smoothstep(-0.6, 0.9, p.y + 0.5 * (g - 0.5)));
    emis += gasCol * env * (0.35 + 0.9 * g * g) * (1.0 - inside) * 1.5;
    emis += uColC * skin * lit * (0.6 + 0.8 * g) * 1.4;
    emis += uColA * inside * 0.05 * g;
    // Evaporating gaseous globules (EGGs) on the pillar heads
    float eggs = smoothstep(0.72, 0.85, snoise(p * 14.0 + uSeed)) * skin * lit;
    emis += vec3(1.0, 0.85, 0.7) * eggs * 0.8;
    dust = inside * (0.8 + 0.5 * n) * 9.0 * uDust;
  } else if (uMorph < 1.5) {
    // ---------------- CRAB NEBULA: red/orange filament cage around a blue synchrotron core ----------------
    vec3 q = p / vec3(1.0, 0.66, 0.78);
    float rq = length(q);
    float shell = 1.0 - smoothstep(0.78, 1.0, rq + 0.08 * snoise(q * 3.0 + uSeed));
    float f1 = ridged(q * 3.3 + uSeed + vec3(t), 7.0);
    float f2 = ridged(q * 7.1 + uSeed * 1.7 - vec3(t), 9.0);
    float fil = (f1 * 0.85 + f2 * 0.55) * smoothstep(0.2, 0.7, rq) * shell;
    vec3 filCol = mix(uColA, uColC, clamp(f2 * 1.4, 0.0, 1.0));
    emis += filCol * fil * 2.6;
    // Pulsar wind nebula: diffuse synchrotron glow (blue-white), wispy near the pulsar
    float wisp = fbm(q * 2.4 + uSeed * 0.5) * 0.5 + 0.5;
    float sync = exp(-pow(rq / 0.6, 2.0)) * (0.45 + 0.75 * wisp * wisp) * shell;
    emis += uColD * sync * 2.2;
    emis += vec3(0.85, 0.9, 1.0) * exp(-pow(rq / 0.1, 2.0)) * 1.2;
    dust = fil * 0.6;
  } else if (uMorph < 2.5) {
    // ---------------- RING NEBULA: barrel seen almost end-on; teal [O III] inside, red [N II] rim ----------------
    float y = dot(p, uAxis);
    float rho = length(p - uAxis * y);
    float n = fbm(p * 4.0 + uSeed) * 0.5 + 0.5;
    float barrel = exp(-pow((rho - 0.5 - 0.06 * (n - 0.5)) / 0.13, 2.0)) * exp(-pow(y / 0.55, 2.0));
    float inner = exp(-pow(rho / 0.42, 2.0)) * exp(-pow(y / 0.45, 2.0));
    float halo = exp(-pow((r - 0.86) / 0.08, 2.0)) * (0.4 + 0.6 * ridged(p * 5.0 + uSeed, 3.0));
    // Colour grades outward with ionization: O III (teal) -> H-alpha/[N II] (red)
    float grade = smoothstep(0.38, 0.62, rho);
    vec3 rimCol = mix(mix(uColB, uColC, smoothstep(0.25, 0.45, rho)), uColA, grade);
    float clumpy = 0.35 + 1.1 * n * n;
    emis += rimCol * barrel * clumpy * 1.3;
    emis += mix(uColD, uColB, smoothstep(0.0, 0.35, rho)) * inner * (0.6 + 0.4 * n) * 0.45;
    emis += uColA * halo * 0.3;
    // Dark knots in the rim (dense clumps shadowing the inner glow)
    float knots = smoothstep(0.55, 0.75, snoise(p * 11.0 + uSeed)) * barrel;
    dust = knots * 3.0 * uDust;
  } else if (uMorph < 3.5) {
    // ---------------- H II NURSERY (Orion, Carina, Tarantula, NGC 604…) ----------------
    vec3 q = p * vec3(1.5, 1.2, 1.5) + uSeed;
    float n = fbm(q + vec3(t, -t * 0.5, t * 0.3));
    float env = 1.0 - smoothstep(0.2, 0.95, r + 0.6 * n);            // noise-eroded, irregular outline
    float dc = length(p - uCore);
    float cavity = smoothstep(0.04, 0.3, dc);                         // blown out by the central cluster
    float gas = env * (0.3 + 0.7 * pow(n * 0.5 + 0.5, 1.5)) * mix(0.55, 1.0, cavity);
    // Ionization fronts: sharp bright ridges on the cavity walls and cloud surfaces
    float front = exp(-pow((n - 0.12) / 0.07, 2.0)) * env;
    float fil = uFilaments * ridged(q * 1.6 + vec3(0.0, t, 0.0), 6.0) * env;
    emis += uColA * gas * 1.1;
    emis += uColC * (front * 1.1 + fil * 1.2);
    // Blue reflection / [O III] glow around the hot core, and the bright core itself
    emis += uColB * exp(-pow(dc / 0.4, 2.0)) * (0.5 + 0.5 * (n * 0.5 + 0.5)) * 1.3;
    emis += uColD * exp(-pow(dc / 0.14, 2.0)) * 3.5;
    // Dark dust lanes and globules
    float dn = fbm(q * 1.2 + 7.3);
    float lanes = smoothstep(0.12, 0.42, dn) * env * smoothstep(0.08, 0.35, dc);
    dust = lanes * 5.0 * uDust;
    emis *= 1.0 - 0.6 * lanes * uDust;
  } else if (uMorph > 4.5) {
    // ---------------- YOUNG SUPERNOVA REMNANT (Cas A, N132D, 1E 0102, N49…) ----------------
    // Forward shock (thin blue X-ray/synchrotron rim), reverse-shocked ejecta knots and Rayleigh–Taylor fingers
    vec3 dir = p / max(r, 1e-3);
    float n = fbm(p * 2.2 + uSeed) * 0.5 + 0.5;
    float shellR = 0.66 + 0.14 * (n - 0.5);
    float fingers = ridged(dir * 3.6 + uSeed, 4.0) * 0.7 + ridged(dir * 7.5 + uSeed * 1.3, 6.0) * 0.5;
    float ejectaZone = smoothstep(0.3, 0.52, r) * (1.0 - smoothstep(shellR - 0.04, shellR + 0.06, r));
    float ejecta = fingers * ejectaZone * (0.45 + 0.8 * n);
    float knots = smoothstep(0.5, 0.78, snoise(p * 6.5 + uSeed)) * ejectaZone;
    float shock = exp(-pow((r - (shellR + 0.13 + 0.05 * (n - 0.5))) / 0.035, 2.0)) * (0.55 + 0.45 * n);
    // Ejecta colours by element layer (O/Ne outside, Si/S, Fe inside), knots hotter
    vec3 ejCol = mix(uColC, uColA, smoothstep(0.4, 0.7, r + 0.2 * (n - 0.5)));
    emis += ejCol * ejecta * 2.2;
    emis += mix(uColC, vec3(1.0, 0.95, 0.85), 0.35) * knots * 2.2;
    emis += uColD * shock * 1.4;
    emis += uColB * exp(-pow(r / 0.4, 2.0)) * 0.12 * n;
    dust = ejecta * 0.8 * uDust;
  } else {
    // ---------------- SUPERBUBBLE (N44, N11): glowing shell around a wind-blown cavity ----------------
    float n = fbm(p * 2.6 + uSeed) * 0.5 + 0.5;
    float shellR = 0.62 + 0.12 * (n - 0.5);
    float shell = exp(-pow((r - shellR) / (0.12 + 0.06 * n), 2.0));
    float clumps = smoothstep(0.35, 0.8, n);
    emis += uColA * shell * (0.4 + 1.2 * clumps) * 1.4;
    emis += uColC * shell * pow(clumps, 3.0) * 1.2;
    emis += uColB * exp(-pow(r / 0.55, 2.0)) * 0.25;
    emis += uColD * exp(-pow(length(p - uCore) / 0.12, 2.0)) * 0.9;
    dust = shell * smoothstep(0.6, 0.85, fbm(p * 5.0 + 3.0) * 0.5 + 0.5) * 2.0 * uDust;
  }

  // Soft outer boundary so no slice edge ever shows
  float edge = 1.0 - smoothstep(0.85, 1.0, r);
  vec3 rgb = emis * uGain * uStep * edge;
  float a = (1.0 - exp(-dust * uStep)) * edge;
  gl_FragColor = vec4(rgb * uLayerFade, a * uLayerFade);
}
`;
