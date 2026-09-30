import * as THREE from 'three';

/**
 * Procedural GLSL Shaders for Photorealistic Galaxies
 * Includes:
 * 1. Logarithmic Spiral Density Wave Disc with De Vaucouleurs Bulge & Dark Dust Extinction
 * 2. Active Galactic Nucleus (AGN) Relativistic Synchrotron Plasma Jet (Centaurus A)
 * 3. Bipolar Ionized Hydrogen (H-alpha) Superwind Chimneys (Messier 82)
 */

// All shaders include three's log-depth chunks: the universe canvas uses a logarithmic depth buffer, and without
// them a shader writes linear depth and depth-tests wrongly against everything else (the disk vanished behind the
// cosmic web).
export const GalacticDiskShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>
    uniform float uTime;
    uniform vec3 uCoreColor;
    uniform vec3 uArmColor;
    uniform vec3 uH2Color;
    uniform vec3 uDustColor;
    uniform float uArms;
    uniform float uPitchAngle;
    uniform float uArmWidth;
    uniform float uBulgeRadius;
    uniform float uDiskRadius;
    uniform float uDustStrength;
    uniform float uH2Abundance;
    uniform float uBar;        // bar half-length in disk radii (0: unbarred)
    uniform float uBarAngle;
    uniform vec3 uCenter;      // galaxy centre (world)
    uniform vec3 uDiskNormal;  // disk normal (world)

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    // Simplex noise helper
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
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

    void main() {
      #include <logdepthbuf_fragment>
      // Coordinate transformation from center of disk (-1 to 1)
      vec2 pos = (vUv - 0.5) * 2.0;
      float r = length(pos);
      if (r > 1.0) discard;

      float phi = atan(pos.y, pos.x);
      float armSeparation = (2.0 * 3.14159265359) / max(uArms, 1.0);

      // 1. Logarithmic Spiral Density Wave: theta(r) = (1 / tan(pitch)) * ln(r / r0)
      float b = tan(uPitchAngle);
      float rNorm = clamp(r, 0.001, 1.0);
      float spiralTwist = (1.0 / b) * log(rNorm + 0.05);

      // Multi-octave turbulence along the spiral arms
      float armNoise = snoise(vec2(phi * 3.0, rNorm * 8.0)) * 0.15;
      float armNoiseFine = snoise(vec2(phi * 8.0, rNorm * 18.0 + uTime * 0.02)) * 0.08;

      float armAngle = phi - spiralTwist + armNoise + armNoiseFine;
      float relAngle = mod(armAngle, armSeparation);
      float distToArm = min(relAngle, armSeparation - relAngle);

      // Width of spiral arm increases with radius
      float localArmWidth = uArmWidth * (0.6 + 0.6 * rNorm);
      float armIntensity = exp(-pow(distToArm / localArmWidth, 2.0));

      // Central bar of old stars (barred spirals like the Milky Way, the LMC's off-centre bar): the arms start
      // at the bar's ends
      float bar = 0.0;
      if (uBar > 0.0) {
        float cb = cos(uBarAngle);
        float sb = sin(uBarAngle);
        vec2 bp = vec2(cb * pos.x + sb * pos.y, -sb * pos.x + cb * pos.y);
        bar = exp(-pow(abs(bp.x) / uBar, 3.0) - pow(bp.y / (uBar * 0.3), 2.0));
        armIntensity *= smoothstep(uBar * 0.55, uBar * 1.05, rNorm);
      }

      // Radial attenuation at outer disk rim
      float diskFalloff = smoothstep(1.0, 0.55, rNorm);

      // 2. De Vaucouleurs Central Bulge (r^1/4 law)
      float bulgeNorm = rNorm / max(uBulgeRadius, 0.01);
      float bulge = exp(-3.8 * pow(bulgeNorm, 0.35));

      // 3. Dark Dust Extinction Lanes (along inner edge of spiral arms)
      float dustShift = distToArm + 0.08;
      float dustProximity = exp(-pow(dustShift / (localArmWidth * 0.6), 2.0));
      float dustFbm = snoise(vec2(phi * 6.0, rNorm * 14.0)) * 0.5 + 0.5;
      float dustLane = dustProximity * dustFbm * uDustStrength * smoothstep(0.12, 0.75, rNorm);

      // 4. Clustered Pink H II Starburst Knots (H-alpha at 656nm)
      float h2Noise = snoise(vec2(phi * 12.0 + 1.7, rNorm * 22.0));
      float h2Knots = smoothstep(0.48, 0.78, h2Noise) * armIntensity * uH2Abundance * smoothstep(0.2, 0.85, rNorm);

      // 5. Young Blue OB Star Clusters
      float blueStarClusters = smoothstep(0.35, 0.75, snoise(vec2(phi * 16.0, rNorm * 30.0))) * armIntensity * 0.8;

      // Color composition
      vec3 finalColor = uCoreColor * bulge * 2.2 + mix(uCoreColor, vec3(1.0, 0.85, 0.6), 0.3) * bar * 1.3;
      // Smooth exponential disk of older stars between the arms (scale length ~0.28 R), warm toward the centre
      float smoothDisk = exp(-rNorm / 0.28) * (0.85 + 0.3 * snoise(vec2(phi * 5.0, rNorm * 10.0)));
      finalColor += mix(uArmColor, uCoreColor, exp(-rNorm / 0.35)) * smoothDisk * 0.55 * diskFalloff;
      finalColor += uArmColor * (armIntensity * 1.4 + blueStarClusters) * diskFalloff;
      finalColor += uH2Color * h2Knots * 3.5;

      // Apply dark dust extinction
      finalColor = mix(finalColor, uDustColor, clamp(dustLane * 0.85, 0.0, 0.92));

      // Total alpha transparency
      float totalDensity = (bulge * 1.5 + bar * 0.9 + armIntensity * 0.8 + h2Knots * 1.2 + smoothDisk * 0.45) * diskFalloff;
      float alpha = clamp(totalDensity, 0.0, 0.92);

      // Dust lanes on the NEAR side of an inclined disk are silhouetted against the bright bulge behind them
      // (as in M31 and Centaurus A); on the far side the bulge light is in front and the lanes barely show
      vec3 toCam = normalize(cameraPosition - uCenter);
      float incl = 1.0 - abs(dot(normalize(uDiskNormal), toCam));
      vec3 toFrag = vWorldPosition - uCenter;
      float near = smoothstep(-0.05, 0.35, dot(toFrag, toCam) / max(length(toFrag), 1e-3)) * smoothstep(0.05, 0.5, incl);
      float lane = clamp(dustLane * 1.6, 0.0, 1.0) * near * (1.0 - smoothstep(0.25, 0.8, rNorm));
      finalColor = mix(finalColor, uDustColor, lane * 0.9);
      alpha = max(alpha, lane * 0.85);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

export const RelativisticAGNJetShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>
    uniform float uTime;
    uniform vec3 uJetColor;
    uniform vec3 uKnotColor;
    uniform float uJetSpeed;

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      #include <logdepthbuf_fragment>
      float y = vUv.y; // distance along jet from core (0 to 1)
      float x = abs(vUv.x - 0.5) * 2.0; // distance from jet spine (0 to 1)

      // Collimated beam with slight expansion
      float beamProfile = exp(-pow(x / (0.15 + 0.35 * y), 2.0));

      // Supersonic relativistic shock knots moving outward along jet
      float knotWave = sin((y * 18.0 - uTime * uJetSpeed) * 3.14159);
      float knotIntensity = smoothstep(0.4, 0.95, knotWave) * exp(-y * 1.2);

      // Synchrotron radiation power-law attenuation
      float jetDecay = smoothstep(1.0, 0.05, y);

      // Radio lobes: the jets balloon into diffuse plumes where they are stopped by intergalactic gas
      float lobe = exp(-pow((y - 0.82) / 0.16, 2.0)) * exp(-pow(x / 0.85, 2.0)) * 0.45;

      vec3 col = mix(uJetColor, uKnotColor, knotIntensity * 0.7);
      float alpha = (beamProfile * (0.6 + knotIntensity * 0.8) * jetDecay + lobe) * smoothstep(0.0, 0.03, y);

      gl_FragColor = vec4(col * (1.2 + knotIntensity * 1.5), alpha);
    }
  `,
};

export const M82SuperwindShader = {
  vertexShader: `
    #include <common>
    #include <logdepthbuf_pars_vertex>
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    #include <logdepthbuf_pars_fragment>
    uniform float uTime;
    uniform vec3 uPlumeColor;
    uniform float uTurbulence;

    varying vec2 vUv;
    varying vec3 vNormal;

    // Simple 2D noise
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
      #include <logdepthbuf_fragment>
      // Cone apex sits at the starburst core: y = 0 there, 1 at the far end of the plume
      float y = 1.0 - vUv.y;
      float az = vUv.x * 6.2831853;

      // Outflowing filamentary H-alpha plasma (seamless around the cone)
      vec2 ring = vec2(cos(az), sin(az));
      float stream = noise(ring * 3.0 + vec2(0.0, y * 10.0 - uTime * 0.6));
      float streamFine = noise(ring * 7.0 + vec2(5.0, y * 22.0 - uTime * 1.1));
      float plume = (stream * 0.7 + streamFine * 0.3);

      // Soft volume: brightest through the middle of the cone, no hard silhouette
      float facing = abs(normalize(vNormal).z);
      float shape = pow(facing, 1.3) * smoothstep(1.0, 0.25, y) * smoothstep(0.0, 0.12, y);

      vec3 col = uPlumeColor * (0.9 + plume * 0.8);
      float alpha = shape * plume * 0.7;

      gl_FragColor = vec4(col, alpha);
    }
  `,
};
