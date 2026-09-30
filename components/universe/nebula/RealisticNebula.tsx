'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject, CELESTIAL_ANGLES } from '@/lib/celestialRegistry';
import { makeSliceGeometry, createSliceMaterial, orientSlices, seededRandom } from './sliceVolume';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';
import { isLowQuality } from '@/lib/deviceQuality';

interface RealisticNebulaProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

type Morph = 0 | 1 | 2 | 3 | 4; // pillars, remnant (Crab), planetary (Ring), H II nursery, superbubble

interface NebulaLook {
  morph: Morph;
  colA: string; // H-alpha / [N II]
  colB: string; // [O III] / blue reflection
  colC: string; // [S II] / ionization fronts
  colD: string; // synchrotron / hot core
  dust: number;
  filaments?: number;
  gain?: number;
  /** Bright core / cavity centre in units of the radius */
  core?: [number, number, number];
  /** Embedded hot stars: count and spread (units of the radius) */
  stars?: number;
  starSpread?: number;
  rotate?: boolean;
}

// Each nebula's look follows its real appearance (Hubble / JWST / ground-based colour images)
const NEBULA_LOOKS: Record<string, NebulaLook> = {
  pillars_of_creation: { morph: 0, colA: '#8a4a22', colB: '#3aa89a', colC: '#ffb866', colD: '#bcd4ff', dust: 1, gain: 1.2, stars: 5, starSpread: 0.9 },
  crab_nebula: { morph: 1, colA: '#ff4128', colB: '#6ee7f5', colC: '#ffb347', colD: '#8fb3ff', dust: 0.4, gain: 1.1 },
  ring_nebula: { morph: 2, colA: '#ff2a1a', colB: '#27c4b0', colC: '#b9d45a', colD: '#6f9fff', dust: 0.6, gain: 1.15, rotate: false },
  orion_nebula: { morph: 3, colA: '#ff4f86', colB: '#5f9dff', colC: '#ffcf8a', colD: '#f2f6ff', dust: 0.8, gain: 1.05, core: [0.12, 0.08, 0.05], stars: 4, starSpread: 0.06 },
  carina_nebula: { morph: 3, colA: '#ff5a3a', colB: '#4fc3f7', colC: '#ffc46b', colD: '#e8f1ff', dust: 1, filaments: 0.5, gain: 1.0, core: [-0.1, 0.15, 0.0], stars: 14, starSpread: 0.3 },
  tarantula_nebula: { morph: 3, colA: '#ff4d7a', colB: '#7dd3fc', colC: '#fde68a', colD: '#eef6ff', dust: 0.6, filaments: 1, gain: 1.0, core: [0.0, 0.0, 0.0], stars: 18, starSpread: 0.12 },
  ngc_604_nebula: { morph: 3, colA: '#ff5c8d', colB: '#5eead4', colC: '#ffd29a', colD: '#e6f0ff', dust: 0.5, filaments: 0.4, gain: 1.0, stars: 16, starSpread: 0.2 },
  ngc_346_nebula: { morph: 3, colA: '#ff6b9a', colB: '#60a5fa', colC: '#fcd9a8', colD: '#eef4ff', dust: 0.7, filaments: 0.6, gain: 1.0, stars: 16, starSpread: 0.18 },
  ngc_595: { morph: 3, colA: '#ff5f8f', colB: '#67e8f9', colC: '#ffd7a0', colD: '#eaf2ff', dust: 0.5, filaments: 0.3, stars: 10, starSpread: 0.2 },
  ngc_588: { morph: 3, colA: '#ff6592', colB: '#7dd3fc', colC: '#ffd7a0', colD: '#eaf2ff', dust: 0.4, stars: 8, starSpread: 0.2 },
  ngc_592: { morph: 3, colA: '#ff6a8c', colB: '#93c5fd', colC: '#ffd7a0', colD: '#eaf2ff', dust: 0.4, stars: 8, starSpread: 0.2 },
  ic_133: { morph: 3, colA: '#ff6b85', colB: '#67e8f9', colC: '#ffe0b0', colD: '#eaf2ff', dust: 0.9, stars: 6, starSpread: 0.15 },
  lmc_n11: { morph: 4, colA: '#ff4f7f', colB: '#7dd3fc', colC: '#ffc9a0', colD: '#e8f0ff', dust: 0.5, gain: 0.55, stars: 14, starSpread: 0.3 },
  lmc_n44: { morph: 4, colA: '#ff5470', colB: '#60a5fa', colC: '#ffd0a0', colD: '#e8f0ff', dust: 0.5, gain: 0.55, stars: 12, starSpread: 0.25 },
};
const DEFAULT_LOOK: NebulaLook = { morph: 3, colA: '#ff5a8a', colB: '#60a5fa', colC: '#ffd29a', colD: '#eef4ff', dust: 0.6, stars: 8, starSpread: 0.2 };

const noRaycast = () => null;
export const RealisticNebula: React.FC<RealisticNebulaProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const sliceRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const low = useMemo(() => isLowQuality(), []);
  const look = NEBULA_LOOKS[body.id] ?? DEFAULT_LOOK;
  const radius = body.size;

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const sliceCount = low ? 9 : 18;
  const geometry = useMemo(() => makeSliceGeometry(radius, sliceCount), [radius, sliceCount]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Ring Nebula: we look almost straight down the barrel (as from Earth) — aim its axis at the default framing
  // viewpoint, tipped ~15° so it still reads as a 3D shell
  const ringAxis = useMemo(() => {
    const s = new THREE.Vector3(...body.position);
    const angle = CELESTIAL_ANGLES[body.id] ?? { elevation: 0.35, lateralAngle: 0.25 };
    if (s.lengthSq() < 1e-6) return new THREE.Vector3(0, 1, 0);
    s.normalize();
    const perp = new THREE.Vector3(-s.z, 0, s.x).normalize();
    const v = s.multiplyScalar(Math.cos(angle.lateralAngle)).addScaledVector(perp, Math.sin(angle.lateralAngle)).normalize();
    return new THREE.Vector3(v.x, angle.elevation, v.z).normalize().add(new THREE.Vector3(0.18, 0.1, 0)).normalize();
  }, [body.position, body.id]);

  const material = useMemo(
    () => createSliceMaterial(look, { id: body.id, radius, sliceCount, low, axis: ringAxis }),
    [body.id, look, low, sliceCount, radius, ringAxis]
  );
  useEffect(() => () => material.dispose(), [material]);

  // Embedded hot stars (Trapezium, R136, NGC 6611 …) — soft sprites, not spheres
  const stars = useMemo(() => {
    const n = look.stars ?? 0;
    if (n === 0) return null;
    const rand = seededRandom(body.id + ':stars');
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    const core = look.core ?? [0, 0, 0];
    const spread = (look.starSpread ?? 0.2) * radius;
    for (let i = 0; i < n; i++) {
      // Pillars: the ionizing cluster sits above the columns
      const off = look.morph === 0 ? [0, 0.75 * radius, 0] : [core[0] * radius, core[1] * radius, core[2] * radius];
      pos[i * 3] = off[0] + (rand() - 0.5) * 2 * spread;
      pos[i * 3 + 1] = off[1] + (rand() - 0.5) * 2 * spread * (look.morph === 0 ? 0.25 : 1);
      pos[i * 3 + 2] = off[2] + (rand() - 0.5) * 2 * spread;
      c.setHSL(0.6 + rand() * 0.04, 0.6, 0.82 + rand() * 0.15);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, [body.id, look, radius]);

  // Central star of the Ring Nebula (a ~125,000 K white dwarf) and the Crab's pulsar
  const centralStar = look.morph === 2 ? '#dbeafe' : look.morph === 1 ? '#e0e7ff' : null;

  useFrame(({ clock, camera }) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    const t = clock.getElapsedTime();
    material.uniforms.uTime.value = t;

    if (look.rotate !== false) {
      root.rotation.y = t * 0.004;
      root.rotation.z = Math.sin(t * 0.003) * 0.02;
    }

    // Keep the slice stack facing the camera and tell the shader how slices map into the nebula frame
    if (sliceRef.current) orientSlices(sliceRef.current, root, camera, material);
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
      {/* Ionizing light from the embedded stars */}
      <PooledPointLight color={look.morph === 1 ? look.colD : look.colA} intensity={5.0} distance={radius * 6} />

      {/* Picking volume (draws nothing): the cloud itself is camera-facing slices */}
      <mesh>
        <sphereGeometry args={[radius * 0.75, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>

      {/* The glowing gas and dust, rendered as a volume */}
      <mesh ref={sliceRef} geometry={geometry} material={material} raycast={noRaycast} />

      {stars && (
        <points raycast={noRaycast}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stars.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[stars.col, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={softenPointSprites}
            size={radius * (look.morph === 3 && (look.starSpread ?? 1) < 0.1 ? 0.12 : 0.06)}
            map={getCoronaTexture()}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}

      {centralStar && (
        <sprite scale={[radius * 0.12, radius * 0.12, 1]} raycast={noRaycast}>
          <spriteMaterial
            map={getCoronaTexture()}
            color={centralStar}
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.15, radius * 1.185, 128]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, radius * 1.15 + 30, 0]} center distanceFactor={radius * 3.5}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
