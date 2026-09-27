// ============================================================================
// PHOTOREALISTIC COMET DUAL-TAIL GLSL SHADERS
// Models:
//   1. Sublimating Gas Coma (C2 / CN Cyan/Emerald Fluorescence)
//   2. Type I Ion (Plasma) Tail: Straight, striated, CO+ electric blue
//   3. Type II Dust Tail: Broad, curved, radiation-pressure pushed golden dust
// ============================================================================

export const CometComaVertexShader = `
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

export const CometComaFragmentShader = `
uniform float uTime;
uniform vec3 uComaColor; // Cyan/emerald C2 Swan band fluorescence (#38bdf8 / #22d3ee)
uniform float uSublimationIntensity;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float NdotV = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
  // Expanding gas density falls off with radial distance
  float coreGlow = pow(NdotV, 1.8);
  float outerHaze = pow(1.0 - NdotV, 2.0);

  vec3 color = uComaColor * (0.8 + 0.6 * coreGlow);
  color += vec3(1.0, 1.0, 1.0) * pow(NdotV, 4.0) * 1.5; // Dense icy core glint

  float alpha = clamp((coreGlow * 0.7 + outerHaze * 0.3) * uSublimationIntensity, 0.0, 0.85);

  gl_FragColor = vec4(color, alpha);
}
`;

export const CometTailVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const CometTailFragmentShader = `
uniform float uTime;
uniform vec3 uTailColor;       // Electric blue for Ion, Golden for Dust
uniform float uTailType;        // 0.0 = Ion Tail (straight/striated), 1.0 = Dust Tail (diffuse/curved)
uniform float uLengthFalloff;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  // vUv.x is along tail length (0 = nucleus, 1 = distant tip)
  // vUv.y is across tail width (0 to 1, center at 0.5)

  float distFromCenter = abs(vUv.y - 0.5) * 2.0; // 0 at center, 1 at edge
  float lengthFactor = 1.0 - vUv.x;               // 1 at nucleus, 0 at tip

  float intensity = 0.0;

  if (uTailType < 0.5) {
    // ----------------------------------------------------
    // ION TAIL (Type I: CO+ plasma, striated rays & knots)
    // ----------------------------------------------------
    // Relativistic solar wind creates striations and ray knots
    float striations = sin(vUv.y * 35.0 + uTime * 4.0 + vUv.x * 20.0) * 0.15 + 0.85;
    float crossWidth = exp(-distFromCenter * distFromCenter * 5.0);
    intensity = crossWidth * pow(lengthFactor, 1.4) * striations;

  } else {
    // ----------------------------------------------------
    // DUST TAIL (Type II: curved, diffuse, radiation pressure)
    // ----------------------------------------------------
    // Wider, softer Gaussian envelope with gentle Keplerian curvature
    float crossWidth = exp(-distFromCenter * distFromCenter * 2.5);
    intensity = crossWidth * pow(lengthFactor, 1.1) * 0.85;
  }

  intensity = clamp(intensity * uLengthFalloff, 0.0, 1.0);

  gl_FragColor = vec4(uTailColor * 1.4, intensity * 0.75);
}
`;
