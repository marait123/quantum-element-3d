'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';
import {
  getGoldFoilTexture,
  getSolarCellTexture,
  getSunshieldTexture,
  hexSegmentGeometry,
  parabolicDishGeometry,
  useSpacecraftEnvMap,
} from './spacecraftKit';

interface RealisticJWSTProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

// Built in metres from the real observatory: sunshield 21.2 × 14.2 m (five Kapton layers), 6.5 m primary mirror of
// 18 gold-coated beryllium hexagons (1.32 m flat-to-flat), secondary mirror 7.2 m in front on three struts,
// deployable tower between the spacecraft bus and the telescope. The long axis of the shield runs along the
// telescope's line of sight (+z); the Sun is always below the shield (−y).
const METRE = 0.03;
const SEGMENT = 1.32;
const GAP = 0.07;
const FOCAL = 7.8; // primary focal length (f/1.2)

const SHIELD_OUTLINE: [number, number][] = [
  [0, 10.6],
  [7.1, 3.2],
  [7.1, -3.2],
  [0, -10.6],
  [-7.1, -3.2],
  [-7.1, 3.2],
];

export const RealisticJWST: React.FC<RealisticJWSTProps> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const envMap = useSpacecraftEnvMap();

  useEffect(() => {
    if (rootRef.current) registerCelestialObject('jwst', rootRef.current);
    return () => unregisterCelestialObject('jwst');
  }, []);

  const mats = useMemo(() => {
    const shield = getSunshieldTexture();
    return {
      shieldSun: new THREE.MeshStandardMaterial({ map: shield, color: '#d9cdea', metalness: 0.75, roughness: 0.35, envMap, side: THREE.DoubleSide }),
      shieldCold: new THREE.MeshStandardMaterial({ map: shield, color: '#c8c3d6', metalness: 0.85, roughness: 0.3, envMap, side: THREE.DoubleSide, transparent: true, opacity: 0.96 }),
      gold: new THREE.MeshPhysicalMaterial({ color: '#f5c451', metalness: 1, roughness: 0.14, envMap, envMapIntensity: 1.6, clearcoat: 0.3 }),
      backplane: new THREE.MeshStandardMaterial({ color: '#1a1c22', metalness: 0.4, roughness: 0.6 }),
      strut: new THREE.MeshStandardMaterial({ color: '#2b2e36', metalness: 0.6, roughness: 0.4, envMap }),
      foil: new THREE.MeshStandardMaterial({ map: getGoldFoilTexture(), metalness: 0.85, roughness: 0.35, envMap }),
      silver: new THREE.MeshStandardMaterial({ color: '#cfd5dd', metalness: 0.85, roughness: 0.3, envMap }),
      cells: new THREE.MeshStandardMaterial({ map: getSolarCellTexture(), metalness: 0.35, roughness: 0.3, envMap }),
      white: new THREE.MeshStandardMaterial({ color: '#eef0f3', roughness: 0.55, metalness: 0.1, envMap, side: THREE.DoubleSide }),
      black: new THREE.MeshStandardMaterial({ color: '#07080b', roughness: 0.95 }),
    };
  }, [envMap]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  // Sunshield membranes: the kite outline; lower (sun-side) layers slightly larger, gaps widening outwards
  const shieldGeometries = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => {
        const k = 1 - i * 0.025;
        const shape = new THREE.Shape(SHIELD_OUTLINE.map(([x, z]) => new THREE.Vector2(x * k, z * k)));
        const geo = new THREE.ShapeGeometry(shape);
        geo.rotateX(Math.PI / 2); // lie in the xz plane
        return geo;
      }),
    []
  );

  // Primary mirror: 18 hexagons (a hexagon of radius 2 minus the centre), each on the paraboloid, tipped to the focus
  const segments = useMemo(() => {
    const out: { x: number; y: number; z: number; rx: number; ry: number }[] = [];
    const w = SEGMENT + GAP;
    for (let q = -2; q <= 2; q++) {
      for (let s = Math.max(-2, -q - 2); s <= Math.min(2, -q + 2); s++) {
        if (q === 0 && s === 0) continue;
        const x = w * (s + q / 2);
        const y = ((w * Math.sqrt(3)) / 2) * q;
        const d2 = x * x + y * y;
        out.push({ x, y, z: -d2 / (4 * FOCAL), rx: Math.atan(y / (2 * FOCAL)), ry: -Math.atan(x / (2 * FOCAL)) });
      }
    }
    return out;
  }, []);
  const hexGeo = useMemo(() => hexSegmentGeometry(SEGMENT, 0.06), []);
  const hga = useMemo(() => parabolicDishGeometry(0.3, 0.1, 24, 8), []);
  useEffect(
    () => () => {
      shieldGeometries.forEach((g) => g.dispose());
      hexGeo.dispose();
      hga.dispose();
    },
    [shieldGeometries, hexGeo, hga]
  );

  const _toSun = useMemo(() => new THREE.Vector3(), []);
  const _down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const _q = useMemo(() => new THREE.Quaternion(), []);
  const _spin = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    // Halo orbit around Sun–Earth L2, moving with Earth (frame graph)
    worldPositionAt('jwst', simClock.time, root.position);
    // Keep the sunshield (its −y face) turned to the Sun at the origin; roll slowly about that axis as it
    // repoints between targets within its field of regard
    _toSun.copy(root.position).negate().normalize();
    _q.setFromUnitVectors(_down, _toSun);
    _spin.setFromAxisAngle(_toSun, simClock.time * 0.03);
    root.quaternion.copy(_spin).multiply(_q);
  });

  const showLabel = hovered || isSelected;
  const mirrorY = 4.3;

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group scale={METRE}>
        {/* ---- Sunshield: five membranes, sun-facing layer at the bottom ---- */}
        {shieldGeometries.map((geo, i) => (
          <mesh key={i} geometry={geo} position={[0, i * 0.16, 0]} material={i === 0 ? mats.shieldSun : mats.shieldCold} />
        ))}
        {/* Spreader bars along the long axis and the mid-booms across */}
        <mesh position={[0, 0.35, 0]} material={mats.strut}>
          <boxGeometry args={[0.12, 0.12, 21]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={mats.strut}>
          <boxGeometry args={[14.2, 0.1, 0.1]} />
        </mesh>
        {/* Momentum trim flap at the aft end */}
        <mesh position={[0, -0.2, -11.3]} rotation={[0.5, 0, 0]} material={mats.shieldSun}>
          <boxGeometry args={[2.2, 0.02, 1.4]} />
        </mesh>

        {/* ---- Spacecraft bus under the shield (warm side): solar array, high-gain antenna, star trackers ---- */}
        <group position={[0, -1.1, -1.5]}>
          <mesh material={mats.foil}>
            <boxGeometry args={[2.0, 1.4, 2.6]} />
          </mesh>
          {/* Single solar array panel, facing the Sun */}
          <mesh position={[0, -0.6, -3.4]} rotation={[-0.25, 0, 0]} material={mats.cells}>
            <boxGeometry args={[2.1, 0.04, 5.9]} />
          </mesh>
          <mesh position={[0.4, -1.1, 1.0]} rotation={[Math.PI, 0, 0]} geometry={hga} material={mats.white} />
          <mesh position={[-0.7, 0.8, 0.9]} material={mats.silver}>
            <boxGeometry args={[0.25, 0.35, 0.25]} />
          </mesh>
        </group>
        {/* Deployable tower assembly lifting the telescope clear of the shield */}
        <mesh position={[0, 1.4, -1.5]} material={mats.strut}>
          <cylinderGeometry args={[0.25, 0.25, 2.2, 12]} />
        </mesh>

        {/* ---- Optical telescope element (cold side) ---- */}
        <group position={[0, mirrorY, -1.2]} rotation={[0.15, 0, 0]}>
          {/* Backplane and the instrument module (ISIM) behind the mirror */}
          <mesh position={[0, 0, -0.45]} material={mats.backplane}>
            <boxGeometry args={[5.2, 5.6, 0.5]} />
          </mesh>
          <mesh position={[0, -0.4, -1.4]} material={mats.black}>
            <boxGeometry args={[2.2, 2.4, 1.4]} />
          </mesh>
          {/* 18 gold primary-mirror segments */}
          {segments.map((s, i) => (
            <mesh key={i} geometry={hexGeo} position={[s.x, s.y, s.z]} rotation={[s.rx, s.ry, 0]} material={mats.gold} />
          ))}
          {/* Aft optics subsystem baffle in the central hole */}
          <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={mats.black}>
            <cylinderGeometry args={[0.35, 0.45, 0.8, 16]} />
          </mesh>
          {/* Secondary mirror on three struts, 7.2 m in front */}
          <mesh position={[0, 0, 7.2]} material={mats.gold}>
            <cylinderGeometry args={[0.37, 0.37, 0.1, 24]} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
            const base = new THREE.Vector3(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0);
            const tip = new THREE.Vector3(0, 0, 7.2);
            const mid = base.clone().add(tip).multiplyScalar(0.5);
            const len = base.distanceTo(tip);
            const dir = tip.clone().sub(base).normalize();
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            return (
              <mesh key={i} position={mid} quaternion={quat} material={mats.strut}>
                <cylinderGeometry args={[0.05, 0.05, len, 6]} />
              </mesh>
            );
          })}
        </group>
      </group>

      {showLabel && (
        <Html position={[0, 0.45, 0]} center>
          <div
            className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
              isSelected ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-indigo-500/40'
            } text-[11px] font-bold text-indigo-300 whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer pointer-events-auto`}
            onClick={onSelect}
          >
            <span className="text-sm">🔭</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">L2 Halo</span>
          </div>
        </Html>
      )}
    </group>
  );
};
