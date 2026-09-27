'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

interface RealisticAsteroidProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

export const RealisticAsteroid: React.FC<RealisticAsteroidProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const orbitAngleRef = useRef<number>(Math.random() * Math.PI * 2);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const isCeres = body.id === 'ceres';
  const isPsyche = body.id === 'psyche_asteroid';
  const isBennu = body.id === 'bennu_asteroid';
  const isApophis = body.id === 'apophis_asteroid';

  useFrame((_, delta) => {
    // 1. Orbital motion
    if (rootRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 0.9;
      rootRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      rootRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }

    // 2. Tumbling rotation
    if (meshRef.current) {
      const rot = body.rotationSpeed || 0.03;
      meshRef.current.rotation.y += rot * delta * 30;
      if (!isCeres) {
        meshRef.current.rotation.x += rot * delta * 15;
      }
    }
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
      {/* Asteroid Mesh with Authentic Topology */}
      <mesh ref={meshRef}>
        {isCeres ? (
          // Spherical dwarf planet (hydrostatic equilibrium)
          <sphereGeometry args={[body.size, 32, 32]} />
        ) : isBennu ? (
          // Diamond / spinning-top faceted octahedron
          <octahedronGeometry args={[body.size, 1]} />
        ) : isApophis ? (
          // Elongated peanut
          <capsuleGeometry args={[body.size * 0.45, body.size * 1.1, 8, 16]} />
        ) : (
          // Irregular 16 Psyche
          <dodecahedronGeometry args={[body.size, 1]} />
        )}

        <meshStandardMaterial
          color={isPsyche ? '#e2e8f0' : isCeres ? '#64748b' : '#475569'}
          metalness={isPsyche ? 0.9 : 0.15}
          roughness={isPsyche ? 0.25 : 0.88}
        />

        {/* Ceres Occator Crater Bright Sodium Carbonate Salt Spots */}
        {isCeres && (
          <group position={[body.size * 0.85, body.size * 0.4, 0]}>
            <mesh>
              <sphereGeometry args={[body.size * 0.14, 12, 12]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          </group>
        )}
      </mesh>

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.45, body.size * 1.65, 32]} />
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
        <Html position={[0, body.size * 1.6 + 1.2, 0]} center distanceFactor={body.size * 18}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-500 text-xs font-bold text-slate-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
