'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

interface RealisticJWSTProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

export const RealisticJWST: React.FC<RealisticJWSTProps> = ({
  body,
  isSelected,
  onSelect,
  language,
}) => {
  const jwstRootRef = useRef<THREE.Group>(null);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (jwstRootRef.current) {
      registerCelestialObject('jwst', jwstRootRef.current);
    }
    return () => {
      unregisterCelestialObject('jwst');
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!jwstRootRef.current) return;
    // Gentle space stabilization drift
    jwstRootRef.current.rotation.y += delta * 0.06;
    jwstRootRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.25) * 0.03;
  });

  // Calculate coordinates for the 18 iconic hexagonal primary mirror segments
  // In a hexagonal grid: 1 central hole (omitted), 6 in inner ring, 12 in outer ring
  const mirrorSegments = useMemo(() => {
    const segs: [number, number][] = [];
    const r = 0.245; // Hexagon segment radius
    const dx = r * Math.sqrt(3);
    const dy = r * 1.5;

    // Rings layout
    for (let q = -2; q <= 2; q++) {
      const r1 = Math.max(-2, -q - 2);
      const r2 = Math.min(2, -q + 2);
      for (let s = r1; s <= r2; s++) {
        // Skip center hole (optical Cassegrain port)
        if (q === 0 && s === 0) continue;
        const x = dx * (s + q / 2);
        const y = dy * q;
        segs.push([x, y]);
      }
    }
    return segs; // Exactly 18 hexagonal segments!
  }, []);

  return (
    <group
      ref={jwstRootRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* ================================================================= */}
      {/* 1. 5-LAYER TENSIONED SUNSHIELD (KAPTON MEMBRANE SYSTEM)          */}
      {/* ================================================================= */}
      {/* 5 Distinct Layers with Spacers & Spreaders */}
      {[-0.12, -0.06, 0.0, 0.06, 0.12].map((yOffset, layerIdx) => {
        const isSunFacing = layerIdx <= 1;
        const scaleFac = 1 - Math.abs(yOffset) * 0.35;
        return (
          <group key={`sunshield-layer-${layerIdx}`} position={[0, yOffset - 0.45, 0]}>
            {/* Diamond Kite Membrane */}
            <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <planeGeometry args={[3.2 * scaleFac, 2.0 * scaleFac]} />
              <meshStandardMaterial
                color={isSunFacing ? '#fbcfe8' : '#e2e8f0'} // Sun-facing pink/silver Kapton sheen
                metalness={0.92}
                roughness={0.12}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* Sunshield Perimeter Tensioning Booms & Edge Spreaders */}
      <mesh position={[0, -0.45, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[3.4, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.45, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[2.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* ================================================================= */}
      {/* 2. PRIMARY MIRROR ASSEMBLY (18 GOLD BERYLLIUM HEXAGONS)           */}
      {/* ================================================================= */}
      {/* Mirror Backplane Graphite Support Tower */}
      <mesh position={[0, 0.25, -0.06]}>
        <cylinderGeometry args={[0.9, 0.9, 0.12, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.8} />
      </mesh>

      {/* 18 Individual Hexagonal Segments */}
      <group position={[0, 0.25, 0]}>
        {mirrorSegments.map(([x, y], idx) => (
          <group key={`hex-mirror-${idx}`} position={[x, y, 0]}>
            {/* Gold Hex Mirror Surface */}
            <mesh rotation={[0, 0, Math.PI / 6]}>
              <circleGeometry args={[0.138, 6]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#d97706"
                emissiveIntensity={0.52}
                metalness={0.98}
                roughness={0.03}
              />
            </mesh>
            {/* Hex Segment Bevel Border */}
            <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0, -0.005]}>
              <circleGeometry args={[0.142, 6]} />
              <meshBasicMaterial color="#78350f" />
            </mesh>
          </group>
        ))}

        {/* Central Cassegrain Light Baffle Hole */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 3. SECONDARY MIRROR ASSEMBLY (SMA) & TRIPOD SUPPORT STRUTS        */}
      {/* ================================================================= */}
      {/* Secondary Mirror Assembly Head */}
      <group position={[0, 0.25, 1.35]}>
        {/* Mirror Housing Conical Baffle */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.08, 0.14, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Gold Secondary Mirror (Facing Primary Mirror) */}
        <mesh position={[0, 0, -0.07]}>
          <circleGeometry args={[0.075, 24]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ca8a04"
            emissiveIntensity={0.5}
            metalness={0.98}
            roughness={0.03}
          />
        </mesh>
      </group>

      {/* 3 Deployable Composite Graphite Tubular Struts */}
      {/* Top Strut */}
      <mesh position={[0, 0.78, 0.68]} rotation={[-Math.PI / 4.8, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Bottom Left Strut */}
      <mesh position={[-0.62, -0.22, 0.68]} rotation={[Math.PI / 7.2, 0, -Math.PI / 5.2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Bottom Right Strut */}
      <mesh position={[0.62, -0.22, 0.68]} rotation={[Math.PI / 7.2, 0, Math.PI / 5.2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.55, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* ================================================================= */}
      {/* 4. INTEGRATED SCIENCE INSTRUMENT MODULE (ISIM) & RADIATORS        */}
      {/* ================================================================= */}
      <group position={[0, 0.25, -0.32]}>
        {/* ISIM Black Carbon-Fiber Enclosure */}
        <mesh>
          <boxGeometry args={[0.85, 0.75, 0.38]} />
          <meshStandardMaterial color="#090d16" roughness={0.7} metalness={0.5} />
        </mesh>
        {/* Cryocooler MIRI Heat Exchanger Radiators */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.95, 0.08, 0.42]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 5. SPACECRAFT BUS, SOLAR ARRAY & HIGH-GAIN DISH                   */}
      {/* ================================================================= */}
      <group position={[0, -0.72, 0]}>
        {/* Aluminum Honeycomb Main Bus Chassis */}
        <mesh>
          <boxGeometry args={[0.9, 0.35, 0.9]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Deployable 5-Panel Solar Array with Blue Photovoltaic Cells */}
        <group position={[0, -0.15, -0.85]} rotation={[Math.PI / 6, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.03, 0.75]} />
            <meshStandardMaterial
              color="#1e3a8a"
              emissive="#1d4ed8"
              emissiveIntensity={0.25}
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Solar Cell Grid Lines */}
          {[-0.5, 0, 0.5].map((xOffset, i) => (
            <mesh key={`grid-${i}`} position={[xOffset, 0.02, 0]}>
              <boxGeometry args={[0.015, 0.01, 0.74]} />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
          ))}
        </group>

        {/* Gimbaled High-Gain Antenna Dish */}
        <group position={[0.55, 0, 0.55]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.05, 0.08, 24]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Momentum Management Trim Flap */}
        <mesh position={[0, -0.1, 0.75]} rotation={[-Math.PI / 8, 0, 0]}>
          <boxGeometry args={[0.85, 0.02, 0.35]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 6. SELECTION AURA & BILLBOARD HUD BADGE                           */}
      {/* ================================================================= */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.35, 32]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Html position={[0, 2.1, 0]} center distanceFactor={28}>
        <div
          className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
            isSelected
              ? 'border-indigo-400 ring-2 ring-indigo-400 shadow-indigo-500/30'
              : 'border-indigo-500/40'
          } text-[11px] font-bold text-indigo-300 whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105`}
          onClick={onSelect}
        >
          <span className="text-sm">🔭</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">
            L2 Halo
          </span>
        </div>
      </Html>
    </group>
  );
};
