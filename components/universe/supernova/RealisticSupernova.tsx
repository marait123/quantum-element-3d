'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  CircumstellarRingVertexShader,
  CircumstellarRingFragmentShader,
  SupernovaEjectaVertexShader,
  SupernovaEjectaFragmentShader,
} from './shaders/supernovaShaders';

interface RealisticSupernovaProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

export const RealisticSupernova: React.FC<RealisticSupernovaProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.ShaderMaterial>(null);
  const ejectaMatRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const isSN1987A = body.id === 'sn_1987a';
  const isKilonova = body.id === 'kilonova_factory';

  // SN 1987A Circumstellar Pearl Ring Uniforms
  const ringUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color('#f59e0b') },     // Glowing amber gas
      uHotspotColor: { value: new THREE.Color('#ffffff') },  // Incandescent white pearl beads
      uPearlCount: { value: 36.0 },                         // ~36 collision pearls
    }),
    []
  );

  // Supernova / Kilonova Ejecta Uniforms
  const ejectaUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCoreColor: {
        value: isKilonova ? new THREE.Color('#38bdf8') : new THREE.Color('#fbbf24'),
      },
      uShockColor: {
        value: isKilonova ? new THREE.Color('#eab308') : new THREE.Color('#ef4444'),
      },
      uInstabilityScale: { value: 1.0 },
    }),
    [isKilonova]
  );

  useFrame(({ clock }) => {
    if (!rootRef.current || !rootRef.current.visible) return;
    const t = clock.getElapsedTime();
    if (ringMatRef.current) ringMatRef.current.uniforms.uTime.value = t;
    if (ejectaMatRef.current) ejectaMatRef.current.uniforms.uTime.value = t;

    if (rootRef.current) {
      rootRef.current.rotation.y = t * 0.015;
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
      {/* Central Blinding Explosion Light */}
      <pointLight
        color={body.emissiveColor || '#fbbf24'}
        intensity={6.0}
        distance={body.size * 8}
      />

      {/* Central Compact Object / Relativistic Radioactive Core */}
      <mesh>
        <sphereGeometry args={[body.size * (isSN1987A ? 0.06 : 0.12), 24, 24]} />
        <meshBasicMaterial
          color={isKilonova ? '#bae6fd' : '#ffffff'}
        />
      </mesh>

      {/* Turbulent Rayleigh-Taylor Ejecta Shockwave Shell */}
      <mesh>
        <sphereGeometry args={[body.size * 0.65, 48, 48]} />
        <shaderMaterial
          ref={ejectaMatRef}
          vertexShader={SupernovaEjectaVertexShader}
          fragmentShader={SupernovaEjectaFragmentShader}
          uniforms={ejectaUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* SN 1987A Iconic Triple-Ring System */}
      {isSN1987A && (
        <group rotation={[0.75, 0, 0]}>
          {/* 1. Main Equatorial Circumstellar Pearl Ring */}
          <mesh>
            <torusGeometry args={[body.size * 0.85, body.size * 0.045, 24, 128]} />
            <shaderMaterial
              ref={ringMatRef}
              vertexShader={CircumstellarRingVertexShader}
              fragmentShader={CircumstellarRingFragmentShader}
              uniforms={ringUniforms}
              transparent
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* 2. Upper Polar Hourglass Reflection Ring */}
          <mesh position={[0, body.size * 0.55, 0]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[body.size * 0.52, body.size * 0.02, 16, 64]} />
            <meshBasicMaterial
              color="#fb923c"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* 3. Lower Polar Hourglass Reflection Ring */}
          <mesh position={[0, -body.size * 0.55, 0]} rotation={[-0.2, 0, 0]}>
            <torusGeometry args={[body.size * 0.52, body.size * 0.02, 16, 64]} />
            <meshBasicMaterial
              color="#fb923c"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}

      {/* Kilonova Heavy-Element Relativistic Jets */}
      {isKilonova && (
        <group>
          {/* North Relativistic Jet */}
          <mesh position={[0, body.size * 0.65, 0]}>
            <cylinderGeometry args={[body.size * 0.02, body.size * 0.08, body.size * 1.3, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} blending={THREE.AdditiveBlending} />
          </mesh>
          {/* South Relativistic Jet */}
          <mesh position={[0, -body.size * 0.65, 0]}>
            <cylinderGeometry args={[body.size * 0.08, body.size * 0.02, body.size * 1.3, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.15, body.size * 1.25, 64]} />
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
        <Html position={[0, body.size * 1.15 + 30, 0]} center distanceFactor={body.size * 3.5}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
