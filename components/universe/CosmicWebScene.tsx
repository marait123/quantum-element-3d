'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { useDistanceFade } from '@/components/universe/rendering/useDistanceFade';
import { COSMIC_WEB_FADE_START, COSMIC_WEB_FADE_FULL } from '@/lib/scaleVisibility';
import { GALAXY_INTERIORS, interiorFade } from '@/lib/galaxyInteriors';

const ENTERABLE_IDS = Object.keys(GALAXY_INTERIORS);
const _webFadeVec = new THREE.Vector3();
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticBlackHole } from './blackhole/RealisticBlackHole';
import { scaledCount, isLowQuality } from '@/lib/deviceQuality';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';

const noRaycast = () => null;

// Deterministic randomness (the web looks the same on every visit)
function seededRandom(seed: number) {
  let h = seed >>> 0;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    h = (h + 0x6d2b79f5) >>> 0;
    return h / 4294967296;
  };
}

// 3D simplex noise (GLSL) for the CMB sky
const SNOISE3 = /* glsl */ `
vec4 cPermute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 cTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
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
  vec4 p = cPermute(cPermute(cPermute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
  vec4 norm = cTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Cosmic microwave background: Planck-like temperature anisotropies (±200 µK, colour-coded blue → red) on the
// inside of the last-scattering sphere. Multi-scale noise mimics the acoustic-peak structure (most power on ~1°
// scales, plus large-scale modulation). Drawn faintly so it frames the universe without flooding the sky.
const CMB_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;
const CMB_FRAGMENT = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uOpacity;
varying vec3 vDir;
${SNOISE3}
void main() {
  #include <logdepthbuf_fragment>
  vec3 d = normalize(vDir);
  float t = snoise(d * 2.2) * 0.35 + snoise(d * 7.0 + 3.1) * 0.35 + snoise(d * 18.0 - 1.7) * 0.22 + snoise(d * 42.0 + 5.3) * 0.08;
  t = clamp(t * 1.6, -1.0, 1.0);
  // Planck colour scale: deep blue (cold) → pale → orange/red (hot)
  vec3 cold = vec3(0.05, 0.16, 0.55);
  vec3 mid = vec3(0.85, 0.82, 0.72);
  vec3 hot = vec3(0.85, 0.22, 0.04);
  vec3 col = t < 0.0 ? mix(mid, cold, smoothstep(0.0, 0.8, -t)) : mix(mid, hot, smoothstep(0.0, 0.8, t));
  gl_FragColor = vec4(col, uOpacity * (0.55 + 0.45 * abs(t)));
}
`;

// Boötes Void: a faint darker bubble (soft-edged, darkest through its middle)
const VOID_VERTEX = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;
const VOID_FRAGMENT = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform float uOpacity;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  #include <logdepthbuf_fragment>
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  gl_FragColor = vec4(0.004, 0.006, 0.02, uOpacity * pow(facing, 1.8));
}
`;

// Large Scale Cosmic Web Filaments (Dark matter & galaxy scaffolding spanning 100,000 -> 600,000 units)
const FilamentaryWeb: React.FC<{ glowTexture?: THREE.CanvasTexture }> = ({ glowTexture }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);

  const [linePositions, nodePositions, nodeColors, glowPositions, glowColors] = useMemo(() => {
    const rand = seededRandom(618);
    const numNodes = 450;
    const nodeCoords: THREE.Vector3[] = [];

    // Distribute nodes in the cosmos, excluding the Boötes void
    const voidCenter = new THREE.Vector3(420000, 250000, -360000);
    const voidRadius = 140000;

    for (let i = 0; i < numNodes; i++) {
      const radius = 80000 + rand() * 480000;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const v = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      if (v.distanceTo(voidCenter) > voidRadius) nodeCoords.push(v);
    }

    // Connect close neighbours with filaments; each filament is also dusted with glowing galaxies (denser near
    // the clusters at its ends), which is what makes the web read as soft glowing threads
    const linePts: number[] = [];
    const glowPts: number[] = [];
    const glowCols: number[] = [];
    const perFilament = isLowQuality() ? 4 : 9;
    const cA = new THREE.Color('#60a5fa');
    const cB = new THREE.Color('#c4b5fd');
    const tmp = new THREE.Color();
    for (let i = 0; i < nodeCoords.length; i++) {
      for (let j = i + 1; j < nodeCoords.length; j++) {
        const a = nodeCoords[i];
        const b = nodeCoords[j];
        const dist = a.distanceTo(b);
        if (dist < 110000) {
          linePts.push(a.x, a.y, a.z, b.x, b.y, b.z);
          for (let k = 0; k < perFilament; k++) {
            // Bias towards the ends (clusters) with a gentle sag across the filament
            let f = rand();
            f = f < 0.5 ? 0.5 * Math.pow(2 * f, 1.6) : 1 - 0.5 * Math.pow(2 * (1 - f), 1.6);
            const spread = dist * 0.035;
            glowPts.push(
              a.x + (b.x - a.x) * f + (rand() - 0.5) * spread,
              a.y + (b.y - a.y) * f + (rand() - 0.5) * spread,
              a.z + (b.z - a.z) * f + (rand() - 0.5) * spread
            );
            tmp.lerpColors(cA, cB, rand());
            glowCols.push(tmp.r, tmp.g, tmp.b);
          }
        }
      }
    }

    const nPos = new Float32Array(nodeCoords.length * 3);
    const nCol = new Float32Array(nodeCoords.length * 3);
    const brightCyan = new THREE.Color('#bae6fd');
    const amberCore = new THREE.Color('#fde68a');
    for (let i = 0; i < nodeCoords.length; i++) {
      const i3 = i * 3;
      nPos[i3] = nodeCoords[i].x;
      nPos[i3 + 1] = nodeCoords[i].y;
      nPos[i3 + 2] = nodeCoords[i].z;
      const c = new THREE.Color().lerpColors(amberCore, brightCyan, rand());
      nCol[i3] = c.r;
      nCol[i3 + 1] = c.g;
      nCol[i3 + 2] = c.b;
    }

    return [new Float32Array(linePts), nPos, nCol, new Float32Array(glowPts), new Float32Array(glowCols)];
  }, []);

  const webRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (webRef.current) webRef.current.rotation.y += delta * 0.001;
  });

  return (
    <group ref={webRef}>
      {/* Faint filament spines */}
      <lineSegments ref={linesRef} raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#1d6fb8" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* Glowing galaxies strung along the filaments */}
      <points raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[glowPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[glowColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={2600}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Galaxy clusters at the nodes */}
      <points ref={nodesRef} raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={5200}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// Cosmic Microwave Background Outer Boundary (Radius 750,000)
const CMBSphereBoundary: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.cmb_sphere;

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('cmb_sphere', rootRef.current);
    }
    return () => unregisterCelestialObject('cmb_sphere');
  }, []);

  const cmbMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CMB_VERTEX,
        fragmentShader: CMB_FRAGMENT,
        uniforms: { uOpacity: { value: 0.1 } },
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    []
  );
  useEffect(() => () => cmbMaterial.dispose(), [cmbMaterial]);

  useFrame((_, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y -= delta * 0.0005;
    }
  });

  return (
    <group
      ref={rootRef}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Last-scattering surface: faint Planck-like anisotropy map on the inside of the sphere */}
      <mesh ref={sphereRef} material={cmbMaterial}>
        <sphereGeometry args={[body.size, 96, 64]} />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.7, 0]} center distanceFactor={body.size * 3}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-amber-500 text-xs font-bold text-amber-200 whitespace-nowrap shadow-2xl">
            📡 {language === 'ar' ? body.nameAr : body.nameEn} (z ≈ 1,100 Horizon)
          </div>
        </Html>
      )}
    </group>
  );
};

// Boötes Void Sphere (Size 160,000)
const BootesVoidStructure: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ isSelected, onSelect, language, glowTexture }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.bootes_void;

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('bootes_void', rootRef.current);
    }
    return () => unregisterCelestialObject('bootes_void');
  }, []);

  const voidMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VOID_VERTEX,
        fragmentShader: VOID_FRAGMENT,
        uniforms: { uOpacity: { value: 0.55 } },
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    []
  );
  useEffect(() => () => voidMaterial.dispose(), [voidMaterial]);

  const voidGalaxies = useMemo(() => {
    const rand = seededRandom(330);
    const wall = scaledCount(1800, 0.5);
    const inside = 60;
    const n = wall + inside;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const R = body.size * 0.5;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      // Walls: galaxies swept up at the edge (a thick, clumpy shell); a few isolated galaxies inside
      const r = i < wall ? R * (1.0 + (rand() + rand() + rand() - 1.5) * 0.12) : R * Math.cbrt(rand()) * 0.85;
      pos[i * 3] = Math.cos(a) * s * r;
      pos[i * 3 + 1] = u * r;
      pos[i * 3 + 2] = Math.sin(a) * s * r;
      c.set(i < wall ? (rand() < 0.5 ? '#93c5fd' : '#c7d2fe') : '#fde68a');
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, [body.size]);

  return (
    <group
      ref={rootRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* The void: a subtly darker bubble... */}
      <mesh material={voidMaterial}>
        <sphereGeometry args={[body.size * 0.5, 48, 32]} />
      </mesh>
      {/* ...outlined by the galaxies piled up on its walls, with only a handful (~60 known) inside */}
      <points raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[voidGalaxies.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[voidGalaxies.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={1400}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.55, 0]} center distanceFactor={body.size * 4}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-indigo-500 text-xs font-bold text-indigo-300 whitespace-nowrap shadow-2xl">
            🌌 {language === 'ar' ? body.nameAr : body.nameEn} (330M ly Supervoid)
          </div>
        </Html>
      )}
    </group>
  );
};

// Laniakea Supercluster Flow (Size 180,000)
const LaniakeaFlowModel: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ isSelected, onSelect, language, glowTexture }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.laniakea_supercluster;
  const flowRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('laniakea_supercluster', rootRef.current);
    }
    return () => unregisterCelestialObject('laniakea_supercluster');
  }, []);

  // Peculiar-velocity streamlines (Tully et al. 2014): galaxies across Laniakea flow along converging lines into
  // the Great Attractor, the basin of attraction that defines the supercluster
  const flow = useMemo(() => {
    const rand = seededRandom(2014);
    const R = body.size * 0.5;
    const greatAttractor = new THREE.Vector3(-30000, -6000, -26000);
    const lines = isLowQuality() ? 40 : 80;
    const steps = 28;
    const linePts: number[] = [];
    const lineCols: number[] = [];
    const galaxyPts: number[] = [];
    const galaxyCols: number[] = [];
    const paths: THREE.Vector3[][] = [];
    const dim = new THREE.Color('#1e3a8a');
    const bright = new THREE.Color('#e0f2fe');
    const gold = new THREE.Color('#fde68a');
    const tmp = new THREE.Color();
    for (let l = 0; l < lines; l++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r0 = R * (0.55 + 0.45 * rand());
      const p = new THREE.Vector3(Math.cos(a) * s * r0, u * r0 * 0.45, Math.sin(a) * s * r0);
      // A gentle swirl so the lines braid like the real flow maps instead of running straight
      const swirlAxis = new THREE.Vector3(rand() - 0.5, 1, rand() - 0.5).normalize();
      const path: THREE.Vector3[] = [p.clone()];
      for (let k = 0; k < steps; k++) {
        const toGA = greatAttractor.clone().sub(p);
        const d = toGA.length();
        if (d < 2500) break;
        toGA.normalize();
        const swirl = new THREE.Vector3().crossVectors(swirlAxis, toGA).multiplyScalar(0.55 * Math.min(1, d / R));
        p.addScaledVector(toGA.add(swirl).normalize(), Math.min(d * 0.14, R * 0.08));
        path.push(p.clone());
      }
      paths.push(path);
      for (let k = 0; k < path.length - 1; k++) {
        const f0 = k / (path.length - 1);
        const f1 = (k + 1) / (path.length - 1);
        linePts.push(path[k].x, path[k].y, path[k].z, path[k + 1].x, path[k + 1].y, path[k + 1].z);
        tmp.lerpColors(dim, bright, f0 * f0);
        lineCols.push(tmp.r, tmp.g, tmp.b);
        tmp.lerpColors(dim, bright, f1 * f1);
        lineCols.push(tmp.r, tmp.g, tmp.b);
      }
      // Galaxies strewn along the stream, crowding in toward the attractor
      const per = isLowQuality() ? 14 : 30;
      for (let g = 0; g < per; g++) {
        const f = Math.pow(rand(), 0.6);
        const idx = Math.min(path.length - 1, Math.floor(f * (path.length - 1)));
        const q = path[idx];
        const jitter = 1400 + 2600 * (1 - f);
        galaxyPts.push(q.x + (rand() - 0.5) * jitter, q.y + (rand() - 0.5) * jitter, q.z + (rand() - 0.5) * jitter);
        tmp.lerpColors(new THREE.Color('#7dd3fc'), gold, f * 0.8);
        galaxyCols.push(tmp.r, tmp.g, tmp.b);
      }
    }
    // Moving tracers along the streamlines (animated each frame)
    const tracersPerLine = 2;
    const tracerPos = new Float32Array(paths.length * tracersPerLine * 3);
    const tracerPhase = paths.flatMap(() => Array.from({ length: tracersPerLine }, () => rand()));
    return {
      greatAttractor,
      linePos: new Float32Array(linePts),
      lineCol: new Float32Array(lineCols),
      galaxyPos: new Float32Array(galaxyPts),
      galaxyCol: new Float32Array(galaxyCols),
      paths,
      tracerPos,
      tracerPhase,
      tracersPerLine,
    };
  }, [body.size]);

  const tracerGeomRef = useRef<THREE.BufferGeometry>(null);
  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    const t = clock.getElapsedTime() * 0.05;
    const { paths, tracerPos, tracerPhase, tracersPerLine } = flow;
    let i = 0;
    for (let l = 0; l < paths.length; l++) {
      const path = paths[l];
      for (let k = 0; k < tracersPerLine; k++, i++) {
        const f = (tracerPhase[i] + t) % 1;
        const x = f * (path.length - 1);
        const a = Math.floor(x);
        const b = Math.min(a + 1, path.length - 1);
        const w = x - a;
        tracerPos[i * 3] = path[a].x + (path[b].x - path[a].x) * w;
        tracerPos[i * 3 + 1] = path[a].y + (path[b].y - path[a].y) * w;
        tracerPos[i * 3 + 2] = path[a].z + (path[b].z - path[a].z) * w;
      }
    }
    const attr = tracerGeomRef.current?.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <group
      ref={rootRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Converging flow streamlines */}
      <lineSegments raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[flow.linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[flow.lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* Galaxies riding the streams (clickable: they are the supercluster) */}
      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[flow.galaxyPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[flow.galaxyCol, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={900}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Tracers flowing inward */}
      <points raycast={noRaycast}>
        <bufferGeometry ref={tracerGeomRef}>
          <bufferAttribute attach="attributes-position" args={[flow.tracerPos, 3]} usage={THREE.DynamicDrawUsage} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={1300}
          map={glowTexture}
          color="#f0f9ff"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* The Great Attractor: the dense heart the flows converge on (Norma cluster region) */}
      <sprite position={flow.greatAttractor} scale={[16000, 16000, 1]} raycast={noRaycast}>
        <spriteMaterial map={glowTexture} color="#fde68a" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.35, 0]} center distanceFactor={body.size * 4}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-sky-400 text-xs font-bold text-sky-200 whitespace-nowrap shadow-2xl">
            ✨ {language === 'ar' ? body.nameAr : body.nameEn} (100K Galaxies)
          </div>
        </Html>
      )}
    </group>
  );
};

// TON 618 Ultramassive Black Hole & Hyperluminous Quasar (66 Billion Solar Masses)
const TON618Quasar: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  return (
    <RealisticBlackHole
      body={body}
      shadowRadius={body.size * 0.75}
      innerDiskRadius={body.size * 0.88}
      outerDiskRadius={body.size * 2.85}
      colorCore="#faf5ff"
      colorMid="#c084fc"
      colorOuter="#7e22ce"
      accretionTilt={[-Math.PI / 4, Math.PI / 6, 0]}
      spinSpeed={1.5}
      dopplerStrength={1.3}
      hasLensingHalo={true}
      hasDustyTorus={true}
      hasJet={true}
      jetProps={{
        length: body.size * 5.8,
        radius: body.size * 0.42,
        color: '#a855f7',
        knotColor: '#f3e8ff',
        speed: 1.8,
        knotFrequency: 3.2,
        bipolar: true,
      }}
      isSelected={isSelected}
      onSelect={onSelect}
      language={language}
    />
  );
};

export const CosmicWebScene: React.FC = () => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  // Available from the first frame: a material compiled without its map draws square sprites, and three.js does
  // not recompile it when the map arrives later
  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(() => getGlowPointTexture());

  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  // The cosmic web surrounds the Local Group: dissolve it while flying in towards the Milky Way, so it is fully
  // transparent by the time this layer turns off at the Milky Way boundary (no pop in either direction)
  // …and let it vanish while the camera is inside another galaxy (as it does inside the Milky Way)
  useDistanceFade(groupRef, (cam) => {
    const fromHome = THREE.MathUtils.smoothstep(cam.position.length(), COSMIC_WEB_FADE_START, COSMIC_WEB_FADE_FULL);
    let inside = 0;
    for (const id of ENTERABLE_IDS) {
      const b = CELESTIAL_BODIES[id];
      inside = Math.max(inside, interiorFade(cam.position.distanceTo(_webFadeVec.set(...b.position)), b.size));
    }
    return fromHome * (1 - inside);
  });

  return (
    <group ref={groupRef}>
      {/* 3D Dark Matter & Galaxy Filaments */}
      <FilamentaryWeb glowTexture={glowTexture} />

      {/* Laniakea Supercluster Flow */}
      <LaniakeaFlowModel
        isSelected={selectedCosmicBodyId === 'laniakea_supercluster'}
        onSelect={() => setSelectedCosmicBodyId('laniakea_supercluster')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* Boötes Great Void */}
      <BootesVoidStructure
        isSelected={selectedCosmicBodyId === 'bootes_void'}
        onSelect={() => setSelectedCosmicBodyId('bootes_void')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* Cosmic Microwave Background 380,000-year Shell */}
      <CMBSphereBoundary
        isSelected={selectedCosmicBodyId === 'cmb_sphere'}
        onSelect={() => setSelectedCosmicBodyId('cmb_sphere')}
        language={language}
      />

      {/* TON 618 Ultramassive Black Hole & Quasar */}
      {CELESTIAL_BODIES.ton_618 && (
        <TON618Quasar
          body={CELESTIAL_BODIES.ton_618}
          isSelected={selectedCosmicBodyId === 'ton_618'}
          onSelect={() => setSelectedCosmicBodyId('ton_618')}
          language={language}
        />
      )}
    </group>
  );
};
