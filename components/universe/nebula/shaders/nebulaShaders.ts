// ============================================================================
// PHOTOREALISTIC VOLUMETRIC NEBULA SHADERS
// Calibrated to Hubble Space Telescope SHO Filter Palette:
//   - [S II] 672 nm (Ionized Sulfur - Amber/Orange Shock Fronts)
//   - H-alpha 656 nm (Ionized Hydrogen - Deep Crimson Recombination Veil)
//   - [O III] 501 nm (Doubly Ionized Oxygen - Electric Emerald/Cyan High Excitation)
// Plus dark dust extinction channels (tau_dust) for elephant trunks & proplyds
// ============================================================================

export const NebulaCloudVertexShader = `
varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vViewDir = normalize(cameraPosition - vWorldPos);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const NebulaCloudFragmentShader = `
uniform float uTime;
uniform vec3 uColorSulfur;    // Amber/copper shock front ([S II])
uniform vec3 uColorHydrogen;  // Crimson recombination veil (H-alpha)
uniform vec3 uColorOxygen;    // Electric cyan/teal core ([O III])
uniform float uMorphology;     // 0: Pillars (M16), 1: Remnant (M1), 2: Planetary Ring (M57), 3: Nursery (M42)
uniform float uDensity;
uniform float uDustExtinction;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

// 3D Simplex / Perlin noise implementation in pure GLSL
vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

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

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractional Brownian Motion (fBm) with 4 octaves
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    p += vec3(0.3, 0.7, 0.2);
    frequency *= 2.05;
    amplitude *= 0.48;
  }
  return value;
}

void main() {
  vec3 pos = vWorldPos * 0.02;
  float t = uTime * 0.035;

  // View grazing factor for volumetric thickness illusion
  float NdotV = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
  float rim = 1.0 - NdotV;

  float noiseVal = 0.0;
  float dust = 0.0;
  vec3 gasColor = vec3(0.0);

  if (uMorphology < 0.5) {
    // ----------------------------------------------------
    // 0: PILLARS OF CREATION (Eroding Elephant Trunks)
    // ----------------------------------------------------
    // Vertical stretching in Y to model columns
    vec3 columnPos = vec3(pos.x * 1.8, pos.y * 0.65 - t * 0.2, pos.z * 1.8);
    float n1 = fbm(columnPos);
    float n2 = fbm(columnPos * 2.2 + vec3(1.2, 0.4, 2.1));
    noiseVal = n1 * 0.65 + n2 * 0.35;

    // Ionization front at top/outer boundary where OB stellar wind erodes cloud
    float ionizationFront = smoothstep(-0.2, 0.5, noiseVal) * (1.0 - smoothstep(0.4, 0.85, noiseVal));
    float denseCore = smoothstep(0.35, 0.75, noiseVal);

    // Dark dust silhouette trunks (absorption extinction)
    dust = smoothstep(0.2, 0.6, snoise(columnPos * 1.4 + 5.0)) * uDustExtinction;

    gasColor = mix(uColorHydrogen, uColorSulfur, ionizationFront * 1.4);
    gasColor = mix(gasColor, uColorOxygen, denseCore * 0.75);
    gasColor *= (1.0 - dust * 0.85); // Dark dust lanes

  } else if (uMorphology < 1.5) {
    // ----------------------------------------------------
    // 1: SUPERNOVA REMNANT (Crab Nebula Synchrotron Filament Web)
    // ----------------------------------------------------
    // Tangled expanding filaments: high-frequency turbulence & cellular shock ribbons
    vec3 filamentPos = pos * 1.4 + vec3(sin(t), cos(t * 0.8), sin(t * 0.5));
    float f1 = abs(snoise(filamentPos * 1.5));
    float f2 = abs(snoise(filamentPos * 3.2 + 2.5));
    noiseVal = 1.0 - (f1 * 0.6 + f2 * 0.4); // Invert for razor-sharp filaments
    noiseVal = pow(max(noiseVal, 0.0), 2.2);

    // Central pulsar wind nebula cavity
    float coreDist = length(pos);
    float pwnGlow = exp(-coreDist * 1.2);

    gasColor = mix(uColorSulfur, uColorHydrogen, noiseVal);
    gasColor += uColorOxygen * pwnGlow * 2.5; // Synchrotron blue core glow

  } else if (uMorphology < 2.5) {
    // ----------------------------------------------------
    // 2: PLANETARY RING (Ring Nebula M57 / Helix)
    // ----------------------------------------------------
    // Toroidal barrel morphology: cylindrical distance
    float r = length(pos.xz);
    float ringShape = exp(-pow(r - 0.75, 2.0) / 0.12);
    float spires = fbm(pos * 2.5 + vec3(0.0, t, 0.0));
    noiseVal = ringShape * (0.7 + 0.3 * spires);

    // Inner [O III] green/cyan cavity vs outer [N II] / H-alpha red ring
    float innerCavity = smoothstep(0.0, 0.7, 1.0 - r);
    gasColor = mix(uColorHydrogen, uColorOxygen, innerCavity * 1.8);
    gasColor = mix(gasColor, uColorSulfur, (1.0 - innerCavity) * ringShape);

  } else {
    // ----------------------------------------------------
    // 3: EMISSION NURSERY (Orion Nebula M42 / Carina)
    // ----------------------------------------------------
    // Cavernous multi-scale billowing turbulent cloud
    vec3 nurseryPos = pos * 0.85 + vec3(t * 0.3, -t * 0.15, t * 0.2);
    float n1 = fbm(nurseryPos);
    float n2 = fbm(nurseryPos * 2.4 + 3.1);
    float n3 = snoise(nurseryPos * 4.8);
    noiseVal = n1 * 0.55 + n2 * 0.35 + n3 * 0.1;

    // Glowing ionization shock fronts against dark backdrop
    float highExcitation = smoothstep(0.1, 0.6, noiseVal);
    float shockRim = pow(rim, 1.8) * 1.5;

    dust = smoothstep(0.4, 0.8, snoise(nurseryPos * 1.6 + 7.0)) * uDustExtinction;

    gasColor = mix(uColorHydrogen, uColorOxygen, highExcitation);
    gasColor = mix(gasColor, uColorSulfur, shockRim);
    gasColor *= (1.0 - dust * 0.75);
  }

  // Alpha composition based on density and limb falloff
  float alpha = clamp(noiseVal * uDensity * (0.35 + 0.65 * rim), 0.0, 0.88);

  gl_FragColor = vec4(gasColor * 1.5, alpha);
}
`;
