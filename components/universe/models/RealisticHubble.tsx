'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

interface RealisticHubbleProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

export const RealisticHubble: React.FC<RealisticHubbleProps> = ({
  body,
  isSelected,
  onSelect,
  language,
}) => {
  const hubbleRootRef = useRef<THREE.Group>(null);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (hubbleRootRef.current) {
      registerCelestialObject('hubble', hubbleRootRef.current);
    }
    return () => {
      unregisterCelestialObject('hubble');
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!hubbleRootRef.current) return;
    // Slow authentic orbital attitude tracking
    hubbleRootRef.current.rotation.y += delta * 0.08;
    hubbleRootRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.3) * 0.04;
  });

  return (
    <group
      ref={hubbleRootRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* ================================================================= */}
      {/* 1. MAIN OPTICAL BARREL (SILVER ALUMINIZED MLI BLANKET)            */}
      {/* ================================================================= */}
      {/* Forward Light Shield Cylinder */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 1.1, 32]} />
        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.92}
          roughness={0.15}
        />
      </mesh>

      {/* Aft Equipment Shroud (Wider Cylinder) */}
      <mesh position={[0, -0.45, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.95, 32]} />
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.88}
          roughness={0.25}
        />
      </mesh>

      {/* Aft Bulkhead Ring */}
      <mesh position={[0, -0.93, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.04, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>

      {/* ================================================================= */}
      {/* 2. OPEN APERTURE DOOR & SECONDARY MIRROR SPIDER                   */}
      {/* ================================================================= */}
      {/* Dark Optical Tube Interior */}
      <mesh position={[0, 1.05, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial color="#020617" side={THREE.DoubleSide} />
      </mesh>

      {/* Secondary Mirror Spider Support (4 Struts) */}
      <group position={[0, 1.05, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.76, 0.015, 0.015]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.76, 0.015, 0.015]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        {/* Secondary Mirror Housing */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      </group>

      {/* Aperture Door (Hinged open at 95°) */}
      <group position={[0, 1.05, 0.42]} rotation={[-Math.PI / 1.9, 0, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.02, 32]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Door Hinge */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.3, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 3. TWIN ARTICULATED SOLAR ARRAY WINGS                             */}
      {/* ================================================================= */}
      {/* Left Solar Array */}
      <group position={[-0.55, 0, 0]}>
        {/* Support Boom */}
        <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        {/* Solar Panel Wing */}
        <group position={[-1.4, 0, 0]} rotation={[Math.PI / 6, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.02, 0.75]} />
            <meshStandardMaterial
              color="#1e3a8a"
              emissive="#1d4ed8"
              emissiveIntensity={0.3}
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>
          {/* Blue Cell Grid Overlay */}
          {[-0.5, 0, 0.5].map((xOff, i) => (
            <mesh key={`hubble-lgrid-${i}`} position={[xOff, 0.015, 0]}>
              <boxGeometry args={[0.015, 0.01, 0.74]} />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Right Solar Array */}
      <group position={[0.55, 0, 0]}>
        {/* Support Boom */}
        <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        {/* Solar Panel Wing */}
        <group position={[1.4, 0, 0]} rotation={[Math.PI / 6, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.02, 0.75]} />
            <meshStandardMaterial
              color="#1e3a8a"
              emissive="#1d4ed8"
              emissiveIntensity={0.3}
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>
          {/* Blue Cell Grid Overlay */}
          {[-0.5, 0, 0.5].map((xOff, i) => (
            <mesh key={`hubble-rgrid-${i}`} position={[xOff, 0.015, 0]}>
              <boxGeometry args={[0.015, 0.01, 0.74]} />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ================================================================= */}
      {/* 4. DUAL HIGH-GAIN DISH ANTENNAS                                   */}
      {/* ================================================================= */}
      {[-1, 1].map((dir, idx) => (
        <group
          key={`hubble-ant-${idx}`}
          position={[dir * 0.45, 0.25, -0.35]}
          rotation={[Math.PI / 4, dir * (Math.PI / 4), 0]}
        >
          {/* Mast */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} />
          </mesh>
          {/* Parabolic Dish */}
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.04, 0.06, 24]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.7} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* ================================================================= */}
      {/* 5. ASTRONAUT SERVICING HANDRAILS & STAR TRACKERS                  */}
      {/* ================================================================= */}
      {/* Yellow Servicing Handrails */}
      {[-0.56, 0.56].map((xPos, i) => (
        <mesh key={`rail-${i}`} position={[xPos, -0.3, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
          <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* ================================================================= */}
      {/* 6. SELECTION AURA & BILLBOARD HUD BADGE                           */}
      {/* ================================================================= */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 1.95, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Html position={[0, 1.9, 0]} center distanceFactor={28}>
        <div
          className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
            isSelected
              ? 'border-sky-400 ring-2 ring-sky-400 shadow-sky-500/30'
              : 'border-sky-500/40'
          } text-[11px] font-bold text-sky-300 whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105`}
          onClick={onSelect}
        >
          <span className="text-sm">🔭</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200">
            LEO 540km
          </span>
        </div>
      </Html>
    </group>
  );
};
