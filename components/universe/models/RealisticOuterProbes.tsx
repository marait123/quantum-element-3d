'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { hasFrame, worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';
import { getGoldFoilTexture, getMliTexture, parabolicDishGeometry, useSpacecraftEnvMap } from './spacecraftKit';

interface ProbeProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

// Built in metres, the same scale as the Voyager model, with the high-gain dish (+y) kept pointed home
const METRE = 0.07;

const ACCENT: Record<string, { ring: string; text: string; badge: string }> = {
  pioneer_10: { ring: 'border-amber-400 ring-2 ring-amber-400 text-amber-200', text: 'border-amber-500/40 text-amber-300', badge: 'bg-amber-500/20 text-amber-200' },
  pioneer_11: { ring: 'border-pink-400 ring-2 ring-pink-400 text-pink-200', text: 'border-pink-500/40 text-pink-300', badge: 'bg-pink-500/20 text-pink-200' },
  new_horizons: { ring: 'border-violet-400 ring-2 ring-violet-400 text-violet-200', text: 'border-violet-500/40 text-violet-300', badge: 'bg-violet-500/20 text-violet-200' },
};

/** Shared behaviour: follows its trajectory frame, faces home, registers for camera tracking, carries a label */
const ProbeShell: React.FC<ProbeProps & { badgeEn: string; badgeAr: string; children: React.ReactNode }> = ({
  body,
  isSelected,
  onSelect,
  language,
  badgeEn,
  badgeAr,
  children,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const _toSun = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const accent = ACCENT[body.id] ?? ACCENT.pioneer_10;

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    if (hasFrame(body.id)) worldPositionAt(body.id, simClock.time, root.position);
    else root.position.set(...body.position);
    _toSun.copy(root.position).negate().normalize();
    root.quaternion.setFromUnitVectors(_up, _toSun);
  });

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
    >
      <group scale={METRE}>{children}</group>
      <Html position={[0, 0.3, 0]} center>
        <div
          className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${isSelected ? accent.ring : accent.text} text-[11px] font-bold whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer pointer-events-auto transition-transform hover:scale-105`}
          onClick={onSelect}
        >
          <span className="text-sm">🛰️</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${accent.badge}`}>{language === 'ar' ? badgeAr : badgeEn}</span>
        </div>
      </Html>
    </group>
  );
};

function useProbeMaterials() {
  const envMap = useSpacecraftEnvMap();
  const mats = useMemo(
    () => ({
      dish: new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.6, metalness: 0.05, envMap, envMapIntensity: 0.5, side: THREE.DoubleSide }),
      silver: new THREE.MeshStandardMaterial({ color: '#c3c9d1', roughness: 0.3, metalness: 0.9, envMap }),
      foil: new THREE.MeshStandardMaterial({ map: getGoldFoilTexture(), roughness: 0.35, metalness: 0.85, envMap }),
      mli: new THREE.MeshStandardMaterial({ map: getMliTexture(), roughness: 0.55, metalness: 0.4, envMap }),
      boom: new THREE.MeshStandardMaterial({ color: '#9ca3ad', roughness: 0.45, metalness: 0.7, envMap }),
      rtg: new THREE.MeshStandardMaterial({ color: '#3a3d44', roughness: 0.5, metalness: 0.6, envMap }),
      plaque: new THREE.MeshStandardMaterial({ color: '#e0b94a', roughness: 0.25, metalness: 1, envMap, envMapIntensity: 1.4 }),
      dark: new THREE.MeshStandardMaterial({ color: '#15171c', roughness: 0.7, metalness: 0.2 }),
    }),
    [envMap]
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  return mats;
}

/** A finned radioisotope generator lying along +z */
const Rtg: React.FC<{ mat: THREE.Material; radius: number; length: number; fins?: number }> = ({ mat, radius, length, fins = 6 }) => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <mesh material={mat}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
    </mesh>
    {Array.from({ length: fins }, (_, k) => (
      <mesh key={k} rotation={[0, (k / fins) * Math.PI, 0]} material={mat}>
        <boxGeometry args={[radius * 3.1, length * 0.95, 0.02]} />
      </mesh>
    ))}
  </group>
);

/**
 * Pioneer 10 / 11: a 2.74 m dish over a hexagonal equipment compartment, two trusses 120° apart each carrying two
 * SNAP-19 RTGs in tandem, a 6.6 m magnetometer boom, the medium-gain horn on a tripod at the feed, and the
 * gold-anodised plaque on the antenna struts.
 */
export const RealisticPioneerProbe: React.FC<ProbeProps> = (props) => {
  const mats = useProbeMaterials();
  const dish = useMemo(() => parabolicDishGeometry(1.37, 0.46, 48, 14), []);
  useEffect(() => () => dish.dispose(), [dish]);

  return (
    <ProbeShell {...props} badgeEn={props.body.id === 'pioneer_10' ? 'Silent · 2003' : 'Silent · 1995'} badgeAr={props.body.id === 'pioneer_10' ? 'صامت · 2003' : 'صامت · 1995'}>
      {/* High-gain antenna with the medium-gain horn on a tripod at its focus */}
      <mesh position={[0, 0.35, 0]} geometry={dish} material={mats.dish} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.28, 0.95, Math.sin(a) * 0.28]} rotation={[Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45]} material={mats.boom}>
            <cylinderGeometry args={[0.015, 0.015, 1.2, 5]} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.5, 0]} material={mats.silver}>
        <coneGeometry args={[0.12, 0.35, 16, 1, true]} />
      </mesh>

      {/* Hexagonal equipment compartment (insulated) with the smaller science bay beside it */}
      <mesh position={[0, 0, 0]} material={mats.mli}>
        <cylinderGeometry args={[0.71, 0.71, 0.36, 6]} />
      </mesh>
      <mesh position={[0.62, -0.02, 0.38]} material={mats.mli}>
        <boxGeometry args={[0.55, 0.32, 0.45]} />
      </mesh>
      {/* The Pioneer plaque, bolted to the antenna support struts */}
      <mesh position={[-0.35, 0.25, 0.62]} rotation={[0.3, 0.5, 0]} material={mats.plaque}>
        <boxGeometry args={[0.229, 0.152, 0.005]} />
      </mesh>

      {/* Two RTG trusses, 120° apart, each with two SNAP-19 generators in tandem */}
      {[Math.PI * 0.15, Math.PI * 0.85].map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh position={[0, -0.05, 1.5]} rotation={[Math.PI / 2, 0, 0]} material={mats.boom}>
            <cylinderGeometry args={[0.025, 0.025, 2.4, 6]} />
          </mesh>
          {[2.2, 2.75].map((z) => (
            <group key={z} position={[0, -0.05, z]}>
              <Rtg mat={mats.rtg} radius={0.13} length={0.42} />
            </group>
          ))}
        </group>
      ))}

      {/* 6.6 m magnetometer boom, its sensor at the tip */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, -0.05, 3.3 + 0.6]} rotation={[Math.PI / 2, 0, 0]} material={mats.boom}>
          <cylinderGeometry args={[0.012, 0.012, 6.6, 4]} />
        </mesh>
        <mesh position={[0, -0.05, 7.2]} material={mats.foil}>
          <sphereGeometry args={[0.09, 12, 8]} />
        </mesh>
      </group>
    </ProbeShell>
  );
};

/**
 * New Horizons: a piano-sized triangular body (~2.1 × 2.7 × 0.7 m) wrapped in gold thermal blankets, a 2.1 m dish
 * on top, the single RTG cantilevered from one corner, and the science instruments (LORRI's long telescope, Ralph,
 * Alice, SWAP, PEPSSI) on the sides.
 */
export const RealisticNewHorizonsProbe: React.FC<ProbeProps> = (props) => {
  const mats = useProbeMaterials();
  const dish = useMemo(() => parabolicDishGeometry(1.05, 0.3, 48, 12), []);
  const body = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.05, -0.9);
    shape.lineTo(1.05, -0.9);
    shape.lineTo(0.35, 1.8);
    shape.lineTo(-0.35, 1.8);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: false });
    g.translate(0, -0.3, -0.35);
    g.rotateX(-Math.PI / 2); // lie flat, dish side up
    return g;
  }, []);
  useEffect(() => () => {
    dish.dispose();
    body.dispose();
  }, [dish, body]);

  return (
    <ProbeShell {...props} badgeEn="Active · Kuiper Belt" badgeAr="نشطة · حزام كايبر">
      {/* Triangular body in gold multi-layer insulation */}
      <mesh geometry={body} material={mats.foil} />
      {/* High-gain antenna on top, with its sub-reflector */}
      <mesh position={[0, 0.4, 0]} geometry={dish} material={mats.dish} />
      <mesh position={[0, 0.95, 0]} material={mats.silver}>
        <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.72, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]} material={mats.boom}>
            <cylinderGeometry args={[0.012, 0.012, 0.6, 5]} />
          </mesh>
        );
      })}
      {/* Single RTG on a strut from the narrow corner */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={mats.boom}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        </mesh>
        <group position={[0, 0, -0.35]}>
          <Rtg mat={mats.rtg} radius={0.21} length={1.1} fins={8} />
        </group>
      </group>
      {/* LORRI telescope (long black tube), Ralph and Alice boxes, SWAP and PEPSSI detectors */}
      <mesh position={[0.75, -0.05, 0.2]} rotation={[0, 0, Math.PI / 2]} material={mats.dark}>
        <cylinderGeometry args={[0.11, 0.11, 0.6, 16]} />
      </mesh>
      <mesh position={[-0.75, -0.05, 0.25]} material={mats.mli}>
        <boxGeometry args={[0.35, 0.3, 0.4]} />
      </mesh>
      <mesh position={[-0.55, -0.05, -0.5]} material={mats.silver}>
        <boxGeometry args={[0.25, 0.22, 0.25]} />
      </mesh>
      <mesh position={[0.5, 0.1, -0.6]} material={mats.silver}>
        <cylinderGeometry args={[0.12, 0.12, 0.18, 12]} />
      </mesh>
      <mesh position={[0.15, -0.25, 1.15]} material={mats.dark}>
        <boxGeometry args={[0.2, 0.12, 0.15]} />
      </mesh>
    </ProbeShell>
  );
};
