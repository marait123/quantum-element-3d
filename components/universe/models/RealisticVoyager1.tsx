'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { hasFrame, worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';
import { getGoldFoilTexture, parabolicDishGeometry, useSpacecraftEnvMap } from './spacecraftKit';

interface RealisticVoyagerProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

// Built in metres from the real Voyager spacecraft: 3.66 m high-gain dish on a ten-sided bus (1.78 m across),
// a 2.3 m science boom with the scan platform (cameras, IRIS, UVS, PPS) plus the cosmic-ray and LECP instruments,
// three RTGs on the opposite boom, a 13 m magnetometer Astromast and two 10 m plasma-wave antennas in a V.
// The dish is kept pointed back at Earth/the Sun.
const METRE = 0.07;

export const RealisticVoyagerProbe: React.FC<RealisticVoyagerProps> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Group>(null);
  const envMap = useSpacecraftEnvMap();
  const isV2 = body.id === 'voyager_2';

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const mats = useMemo(
    () => ({
      dish: new THREE.MeshStandardMaterial({ color: '#f2f2ee', roughness: 0.6, metalness: 0.05, envMap, envMapIntensity: 0.5, side: THREE.DoubleSide }),
      blanket: new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.75, metalness: 0.3, envMap }),
      silver: new THREE.MeshStandardMaterial({ color: '#c3c9d1', roughness: 0.3, metalness: 0.9, envMap }),
      foil: new THREE.MeshStandardMaterial({ map: getGoldFoilTexture(), roughness: 0.35, metalness: 0.85, envMap }),
      record: new THREE.MeshStandardMaterial({ color: '#e0b94a', roughness: 0.2, metalness: 1, envMap, envMapIntensity: 1.4 }),
      boom: new THREE.MeshStandardMaterial({ color: '#9ca3ad', roughness: 0.45, metalness: 0.7, envMap }),
      rtg: new THREE.MeshStandardMaterial({ color: '#3a3d44', roughness: 0.5, metalness: 0.6, envMap }),
      lens: new THREE.MeshStandardMaterial({ color: '#0a0c10', roughness: 0.1, metalness: 0.5 }),
    }),
    [envMap]
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const dish = useMemo(() => parabolicDishGeometry(1.83, 0.55, 48, 14), []);
  const magPoints = useMemo(() => {
    // Astromast: a triangular lattice mast, 13 m long; drawn as three longerons with diagonal battens
    const pts: THREE.Vector3[] = [];
    const n = 26;
    const r = 0.12;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * 13;
      const y1 = ((i + 1) / n) * 13;
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        const b = ((k + 1) / 3) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y0, Math.sin(a) * r), new THREE.Vector3(Math.cos(a) * r, y1, Math.sin(a) * r));
        pts.push(new THREE.Vector3(Math.cos(a) * r, y0, Math.sin(a) * r), new THREE.Vector3(Math.cos(b) * r, y1, Math.sin(b) * r));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  useEffect(() => () => {
    dish.dispose();
    magPoints.dispose();
  }, [dish, magPoints]);

  const _toSun = useMemo(() => new THREE.Vector3(), []);
  const _up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    if (hasFrame(body.id)) worldPositionAt(body.id, simClock.time, root.position);
    else root.position.set(...body.position);
    // High-gain antenna (+y) points home
    _toSun.copy(root.position).negate().normalize();
    root.quaternion.setFromUnitVectors(_up, _toSun);
    if (scanRef.current) scanRef.current.rotation.y = Math.sin(simClock.time * 0.1) * 0.3;
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
      <group scale={METRE}>
        {/* High-gain antenna: 3.66 m paraboloid, white, with the sub-reflector on a tripod */}
        <mesh position={[0, 0.5, 0]} geometry={dish} material={mats.dish} />
        <mesh position={[0, 1.55, 0]} material={mats.silver}>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 20]} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.35, 1.05, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]} material={mats.boom}>
              <cylinderGeometry args={[0.02, 0.02, 1.1, 5]} />
            </mesh>
          );
        })}

        {/* Ten-sided bus (electronics), black and silver thermal blankets */}
        <mesh position={[0, 0, 0]} material={mats.blanket}>
          <cylinderGeometry args={[0.89, 0.89, 0.47, 10]} />
        </mesh>
        <mesh position={[0, 0.26, 0]} material={mats.silver}>
          <cylinderGeometry args={[0.92, 0.92, 0.04, 10]} />
        </mesh>
        {/* Propellant tank below the bus */}
        <mesh position={[0, -0.45, 0]} material={mats.foil}>
          <sphereGeometry args={[0.36, 20, 14]} />
        </mesh>
        {/* The Golden Record on the outside of the bus */}
        <mesh position={[0.88, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.record}>
          <cylinderGeometry args={[0.155, 0.155, 0.02, 32]} />
        </mesh>

        {/* Science boom (2.3 m) with the scan platform at the end, cosmic-ray and LECP instruments along it */}
        <group position={[isV2 ? -0.9 : 0.9, -0.1, 0.4]} rotation={[0, 0, isV2 ? 0.1 : -0.1]}>
          <mesh position={[0, 0, 1.15]} rotation={[Math.PI / 2, 0, 0]} material={mats.boom}>
            <cylinderGeometry args={[0.05, 0.05, 2.3, 8]} />
          </mesh>
          <mesh position={[0, 0.15, 0.9]} material={mats.foil}>
            <boxGeometry args={[0.35, 0.3, 0.3]} />
          </mesh>
          <mesh position={[0, -0.12, 1.5]} material={mats.silver}>
            <cylinderGeometry args={[0.15, 0.12, 0.3, 12]} />
          </mesh>
          <group ref={scanRef} position={[0, -0.25, 2.35]}>
            <mesh material={mats.blanket}>
              <boxGeometry args={[0.55, 0.3, 0.45]} />
            </mesh>
            {/* Narrow-angle and wide-angle cameras */}
            <mesh position={[0.12, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]} material={mats.silver}>
              <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
            </mesh>
            <mesh position={[0.12, 0, 0.76]} rotation={[Math.PI / 2, 0, 0]} material={mats.lens}>
              <cylinderGeometry args={[0.085, 0.085, 0.02, 16]} />
            </mesh>
            <mesh position={[-0.14, 0.02, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={mats.silver}>
              <cylinderGeometry args={[0.07, 0.07, 0.4, 12]} />
            </mesh>
            {/* IRIS infrared interferometer (a small telescope) */}
            <mesh position={[0, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={mats.silver}>
              <cylinderGeometry args={[0.2, 0.2, 0.35, 16]} />
            </mesh>
          </group>
        </group>

        {/* RTG boom with three finned radioisotope generators, opposite the science boom */}
        <group position={[isV2 ? 0.9 : -0.9, -0.15, -0.3]}>
          <mesh position={[0, 0, -1.0]} rotation={[Math.PI / 2, 0, 0]} material={mats.boom}>
            <cylinderGeometry args={[0.04, 0.04, 2.0, 8]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <group key={i} position={[0, 0, -0.9 - i * 0.55]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh material={mats.rtg}>
                <cylinderGeometry args={[0.2, 0.2, 0.5, 16]} />
              </mesh>
              {Array.from({ length: 6 }, (_, k) => (
                <mesh key={k} rotation={[0, (k / 6) * Math.PI, 0]} material={mats.rtg}>
                  <boxGeometry args={[0.62, 0.48, 0.02]} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        {/* 13 m magnetometer Astromast (triangular lattice) with its two sensors */}
        <group position={[0, -0.1, -0.7]} rotation={[-Math.PI / 2 + 0.25, 0, isV2 ? 0.6 : -0.6]}>
          <lineSegments geometry={magPoints}>
            <lineBasicMaterial color="#b9c0c9" transparent opacity={0.85} />
          </lineSegments>
          <mesh position={[0, 6.5, 0]} material={mats.foil}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
          </mesh>
          <mesh position={[0, 13, 0]} material={mats.foil}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
          </mesh>
        </group>

        {/* Two 10 m plasma-wave / planetary-radio antennas forming a V */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 1.6, -2.4, -2.0]} rotation={[0.8, 0, s * 0.55]} material={mats.boom}>
            <cylinderGeometry args={[0.012, 0.012, 10, 4]} />
          </mesh>
        ))}
      </group>

      <Html position={[0, 0.3, 0]} center>
        <div
          className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
            isSelected
              ? isV2
                ? 'border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-500/30 text-emerald-200'
                : 'border-amber-400 ring-2 ring-amber-400 shadow-amber-500/30 text-amber-200'
              : isV2
                ? 'border-emerald-500/40 text-emerald-300'
                : 'border-amber-500/40 text-amber-300'
          } text-[11px] font-bold whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer pointer-events-auto transition-transform hover:scale-105`}
          onClick={onSelect}
        >
          <span className="text-sm">🛰️</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${isV2 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
            {language === 'ar' ? 'بين النجوم' : 'Interstellar'}
          </span>
        </div>
      </Html>
    </group>
  );
};
