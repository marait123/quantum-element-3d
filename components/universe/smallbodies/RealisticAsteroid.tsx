'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { worldPositionAt, hasFrame } from '@/lib/frames';
import { simClock } from '@/lib/simClock';
import { rockGeometry, RockOptions } from './rockGeometry';

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

  // Shapes and colours from the real bodies
  const geometry = useMemo(() => {
    const opts: Record<string, Omit<RockOptions, 'radius'>> = {
      // Ceres: round dwarf planet, dark grey, with Occator crater's bright salt (sodium carbonate) deposits
      ceres: {
        seed: 1, detail: 5, relief: 0.03, craters: 30, craterSize: [0.05, 0.2], color: '#5d5a57', albedoJitter: 0.15,
        brightSpot: { dir: [0.9, 0.35, 0.1], size: 0.09, color: '#f4f6f8' },
      },
      // Bennu: 490 m spinning-top rubble pile, one of the darkest objects known (4% albedo), boulder-strewn
      bennu_asteroid: { seed: 2, detail: 4, relief: 0.1, craters: 10, shape: 'spinning-top', color: '#2e2b28', albedoJitter: 0.5 },
      // Apophis: elongated, probably bilobed ~450 m stony (Sq-type) asteroid
      apophis_asteroid: { seed: 3, detail: 4, relief: 0.08, craters: 8, shape: 'bilobed', stretch: [1.8, 0.9, 0.9], color: '#8a7f70', albedoJitter: 0.3 },
      // 16 Psyche: metal-rich M-type, irregular (~280 × 230 × 190 km)
      psyche_asteroid: { seed: 4, detail: 4, relief: 0.12, craters: 12, stretch: [1.18, 0.82, 0.95], color: '#9a958d', albedoJitter: 0.2 },
    };
    const o = opts[body.id] ?? { seed: 9, color: '#6b6560' };
    return rockGeometry({ radius: body.size, ...o });
  }, [body.id, body.size]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const isCeres = body.id === 'ceres';
  const isPsyche = body.id === 'psyche_asteroid';

  useFrame((_, delta) => {
    // 1. Orbital motion
    if (rootRef.current && hasFrame(body.id)) {
      // Real period and inclination from the frame graph (lib/frames.ts)
      worldPositionAt(body.id, simClock.time, rootRef.current.position);
    } else if (rootRef.current && body.orbitalRadius && body.orbitalSpeed) {
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
      {/* Real shapes and surfaces (see ROCKS): cratered, with albedo variation */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial vertexColors metalness={isPsyche ? 0.55 : 0} roughness={isPsyche ? 0.45 : 0.95} />
      </mesh>

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.55, body.size * 1.59, 96]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.45}
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
