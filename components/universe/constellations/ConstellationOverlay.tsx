'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CONSTELLATIONS, ConstellationDefinition } from '@/data/constellationData';

export const ConstellationOverlay: React.FC = () => {
  const showConstellations = useQuantumStore((s) => s.showConstellations);
  const selectedConstellationId = useQuantumStore((s) => s.selectedConstellationId);
  const setSelectedConstellationId = useQuantumStore((s) => s.setSelectedConstellationId);
  const language = useQuantumStore((s) => s.language);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Build static lines geometry for all constellations
  const constellationMeshes = useMemo(() => {
    return Object.values(CONSTELLATIONS).map((constellation) => {
      const starMap = new Map<string, [number, number, number]>();
      constellation.stars.forEach((s) => starMap.set(s.id, s.position));

      const linePoints: number[] = [];
      constellation.lines.forEach(([s1, s2]) => {
        const p1 = starMap.get(s1);
        const p2 = starMap.get(s2);
        if (p1 && p2) {
          linePoints.push(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]);
        }
      });

      const positions = new Float32Array(linePoints);
      return {
        constellation,
        positions,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!showConstellations) return;
    const t = clock.getElapsedTime();
    // Subtle breathing pulse for constellation lines
    const pulse = Math.sin(t * 1.5) * 0.15 + 0.85;
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
          child.material.opacity = 0.45 * pulse;
        }
      });
    }
  });

  if (!showConstellations) return null;

  return (
    <group ref={groupRef}>
      {constellationMeshes.map(({ constellation, positions }) => {
        const isSelected = selectedConstellationId === constellation.id;
        const isHovered = hoveredId === constellation.id;

        const lineColor = isSelected ? '#fbbf24' : isHovered ? '#38bdf8' : '#60a5fa';
        const opacity = isSelected ? 0.95 : isHovered ? 0.75 : 0.4;

        return (
          <group
            key={constellation.id}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta && e.delta > 5) return;
              e.stopPropagation();
              setSelectedConstellationId(isSelected ? null : constellation.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(constellation.id);
            }}
            onPointerOut={() => setHoveredId(null)}
          >
            {/* 3D Asterism Lines */}
            <lineSegments>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[positions, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={lineColor}
                transparent
                opacity={opacity}
                linewidth={isSelected || isHovered ? 2 : 1}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </lineSegments>

            {/* Glowing Star Junction Nodes */}
            {constellation.stars.map((star) => (
              <mesh key={star.id} position={star.position}>
                <sphereGeometry args={[isSelected || isHovered ? 6.0 : 3.5, 12, 12]} />
                <meshBasicMaterial
                  color={star.color}
                  transparent
                  opacity={isSelected || isHovered ? 0.95 : 0.7}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Constellation Center Floating Label */}
            {(isHovered || isSelected) && (
              <Html
                position={constellation.centerPosition}
                center
                distanceFactor={constellation.boundingRadius * 1.8}
              >
                <div
                  className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border text-xs font-bold whitespace-nowrap shadow-2xl transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                      : 'bg-slate-900/90 border-cyan-400 text-cyan-200'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConstellationId(isSelected ? null : constellation.id);
                  }}
                >
                  <span className="text-amber-400">✨</span>
                  <span>{language === 'ar' ? constellation.nameAr : constellation.nameEn}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({constellation.abbreviation})</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
