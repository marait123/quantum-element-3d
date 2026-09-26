'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

interface RealisticVoyager1Props {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

export const RealisticVoyager1: React.FC<RealisticVoyager1Props> = ({
  body,
  isSelected,
  onSelect,
  language,
}) => {
  const probeRootRef = useRef<THREE.Group>(null);
  const scanPlatformRef = useRef<THREE.Group>(null);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (probeRootRef.current) {
      registerCelestialObject('voyager_1', probeRootRef.current);
    }
    return () => {
      unregisterCelestialObject('voyager_1');
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!probeRootRef.current) return;
    // Slow authentic interstellar cruise stabilization rotation
    probeRootRef.current.rotation.y += delta * 0.05;
    probeRootRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.04;

    // Scan platform subtle calibration sweep
    if (scanPlatformRef.current) {
      scanPlatformRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.15;
    }
  });

  return (
    <group
      ref={probeRootRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* ================================================================= */}
      {/* 1. 3.7M HIGH-GAIN PARABOLIC ANTENNA (HGA)                         */}
      {/* ================================================================= */}
      {/* Main Parabolic Dish Shell (Pointing toward Earth in deep space) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 0.32, 0.48, 48, 2, true]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.28}
          metalness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dish Outer Rim Torus */}
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.035, 16, 48]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Parabolic Dish Back Support Ribs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={`rib-${i}`}
            position={[Math.cos(angle) * 0.9, -0.05, Math.sin(angle) * 0.9]}
            rotation={[0, -angle, Math.PI / 6]}
          >
            <boxGeometry args={[0.025, 0.06, 1.2]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Sub-Reflector Feed Horn Assembly (Tripod Struts) */}
      <group position={[0, 0.58, 0]}>
        {/* Sub-reflector dish */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.05, 0.08, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Central waveguide feed */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.38, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.7} />
        </mesh>
        {/* Tripod support legs */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <mesh
            key={`tripod-${i}`}
            position={[Math.cos(angle) * 0.48, -0.25, Math.sin(angle) * 0.48]}
            rotation={[Math.sin(angle) * 0.45, 0, Math.cos(angle) * 0.45]}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.85} />
          </mesh>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 2. 10-SIDED DECAGONAL BUS CHASSIS (GOLD FOIL MLI BLANKET)        */}
      {/* ================================================================= */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.82, 0.85, 0.5, 10]} />
        <meshStandardMaterial
          color="#d97706"
          emissive="#b45309"
          emissiveIntensity={0.25}
          metalness={0.94}
          roughness={0.18}
        />
      </mesh>
      {/* Bus Structural Aluminum Frame Rings */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 0.04, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 0.04, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* ================================================================= */}
      {/* 3. THE GOLDEN RECORD (VOYAGER INTERSTELLAR MESSAGE)               */}
      {/* ================================================================= */}
      <group position={[0.78, -0.35, 0.28]} rotation={[0, Math.PI / 4, 0]}>
        {/* Gold Aluminum Cover Disk */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.02, 36]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#ca8a04"
            emissiveIntensity={0.45}
            metalness={0.98}
            roughness={0.06}
          />
        </mesh>
        {/* Phonograph Grooves and Pulsar Map Calibration Rings */}
        <mesh position={[0.015, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.1, 0.36, 32]} />
          <meshBasicMaterial color="#b45309" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Pulsar Lines Representation */}
        <mesh position={[0.018, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.22, 0.24, 24]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 4. 13-METER ASTROMAST MAGNETOMETER BOOM & SENSORS                 */}
      {/* ================================================================= */}
      <group position={[-0.8, -0.35, 0]} rotation={[0, 0, -Math.PI / 7]}>
        {/* Triangular Lattice Astromast Truss */}
        <mesh position={[-1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 3.2, 3]} />
          <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.3} />
        </mesh>
        {/* Mid-span Low-Field Magnetometer Canister */}
        <mesh position={[-1.4, 0.06, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.75} roughness={0.2} />
        </mesh>
        {/* Tip High-Field Magnetometer Sensor Canister */}
        <mesh position={[-3.25, 0, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.15} />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 5. RTG BOOM (3 STACKED NUCLEAR THERMOELECTRIC GENERATORS)         */}
      {/* ================================================================= */}
      <group position={[0.85, -0.5, -0.4]} rotation={[0, -Math.PI / 6, Math.PI / 6]}>
        {/* Structural Deployment Boom */}
        <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.08, 1.3, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.85} />
        </mesh>

        {/* 3 SNAP-19 Multi-Hundred Watt RTG Cylinders */}
        {[-0.26, 0, 0.26].map((offset, idx) => (
          <group key={`rtg-${idx}`} position={[1.35 + offset, 0, 0]} rotation={[0, 0, 0]}>
            {/* Core Cylinder */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.45, 18]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.4} />
            </mesh>
            {/* Heat Dissipation Radiator Fins */}
            {Array.from({ length: 6 }).map((_, finIdx) => (
              <mesh
                key={`fin-${finIdx}`}
                rotation={[(finIdx / 6) * Math.PI, 0, 0]}
              >
                <boxGeometry args={[0.02, 0.36, 0.42]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ================================================================= */}
      {/* 6. SCIENCE INSTRUMENT SCAN PLATFORM                               */}
      {/* ================================================================= */}
      <group ref={scanPlatformRef} position={[-0.65, -0.65, 0.7]}>
        {/* Articulated Azimuth-Elevation Gimbal Mount */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>

        {/* Narrow-Angle Telephoto Camera Barrel */}
        <mesh position={[0.15, -0.15, 0.12]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.38, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Optical Glass Lens */}
        <mesh position={[0.15, -0.28, 0.25]}>
          <circleGeometry args={[0.065, 16]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>

        {/* Wide-Angle Camera Barrel */}
        <mesh position={[-0.15, -0.12, 0.08]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.24, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        {/* Infrared Radiometer & Spectrometer (IRIS) Housing */}
        <mesh position={[0, 0.15, 0.1]}>
          <boxGeometry args={[0.22, 0.18, 0.28]} />
          <meshStandardMaterial
            color="#ca8a04"
            emissive="#ca8a04"
            emissiveIntensity={0.2}
            metalness={0.95}
          />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 7. DUAL 10-METER PLASMA WAVE ANTENNA (PWS) WHIPS                  */}
      {/* ================================================================= */}
      <group position={[0, -0.6, 0]}>
        {/* Left Beryllium-Copper Dipole Whip */}
        <mesh position={[-1.2, -0.8, 0]} rotation={[0, 0, -Math.PI / 3]}>
          <cylinderGeometry args={[0.008, 0.008, 2.5, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        {/* Right Beryllium-Copper Dipole Whip */}
        <mesh position={[1.2, -0.8, 0]} rotation={[0, 0, Math.PI / 3]}>
          <cylinderGeometry args={[0.008, 0.008, 2.5, 6]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>

      {/* ================================================================= */}
      {/* 8. ATTITUDE CONTROL HYDRAZINE THRUSTER PODS                       */}
      {/* ================================================================= */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <group
          key={`thruster-${i}`}
          position={[Math.cos(angle) * 0.88, -0.35, Math.sin(angle) * 0.88]}
          rotation={[0, -angle, 0]}
        >
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.045, 0.08, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ================================================================= */}
      {/* 9. SELECTION AURA & BILLBOARD HUD BADGE                           */}
      {/* ================================================================= */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.15, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}

      <Html position={[0, 2.2, 0]} center distanceFactor={28}>
        <div
          className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
            isSelected
              ? 'border-amber-400 ring-2 ring-amber-400 shadow-amber-500/30'
              : 'border-amber-500/40'
          } text-[11px] font-bold text-amber-300 whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer transition-transform hover:scale-105`}
          onClick={onSelect}
        >
          <span className="text-sm">🛰️</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">
            {language === 'ar' ? 'بين النجوم' : 'Interstellar'}
          </span>
        </div>
      </Html>
    </group>
  );
};
