'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { NebulaCloudVertexShader, NebulaCloudFragmentShader } from './shaders/nebulaShaders';

interface RealisticNebulaProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

export const RealisticNebula: React.FC<RealisticNebulaProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const outerMatRef = useRef<THREE.ShaderMaterial>(null);
  const innerMatRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Determine morphology code based on celestial ID
  const morphology = useMemo(() => {
    if (body.id === 'pillars_of_creation') return 0.0;
    if (body.id === 'crab_nebula') return 1.0;
    if (body.id === 'ring_nebula') return 2.0;
    return 3.0; // Orion, Carina, Tarantula nurseries
  }, [body.id]);

  // Calibrate SHO filter palette based on nebula type
  const { colorSulfur, colorHydrogen, colorOxygen } = useMemo(() => {
    if (body.id === 'pillars_of_creation') {
      return {
        colorSulfur: new THREE.Color('#d97706'),   // [S II] Amber-copper rims
        colorHydrogen: new THREE.Color('#84cc16'), // H-alpha Olive-emerald
        colorOxygen: new THREE.Color('#06b6d4'),   // [O III] Deep turquoise
      };
    } else if (body.id === 'crab_nebula') {
      return {
        colorSulfur: new THREE.Color('#f97316'),   // Filamentary sulfur orange
        colorHydrogen: new THREE.Color('#ef4444'), // Outer hydrogen threads
        colorOxygen: new THREE.Color('#38bdf8'),   // Synchrotron PWN cyan
      };
    } else if (body.id === 'ring_nebula') {
      return {
        colorSulfur: new THREE.Color('#f59e0b'),   // Nitrogen-sulfur outer ring
        colorHydrogen: new THREE.Color('#dc2626'), // Outer red fringe
        colorOxygen: new THREE.Color('#10b981'),   // Brilliant [O III] emerald core
      };
    } else {
      // Orion / Carina nursery
      return {
        colorSulfur: new THREE.Color('#fb923c'),   // Shock boundary copper
        colorHydrogen: new THREE.Color('#ec4899'), // H-alpha brilliant magenta/crimson
        colorOxygen: new THREE.Color('#38bdf8'),   // Ionized cavity cyan
      };
    }
  }, [body.id]);

  const outerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorSulfur: { value: colorSulfur },
      uColorHydrogen: { value: colorHydrogen },
      uColorOxygen: { value: colorOxygen },
      uMorphology: { value: morphology },
      uDensity: { value: 0.65 },
      uDustExtinction: { value: 0.8 },
    }),
    [colorSulfur, colorHydrogen, colorOxygen, morphology]
  );

  const innerUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorSulfur: { value: colorSulfur },
      uColorHydrogen: { value: colorHydrogen },
      uColorOxygen: { value: colorOxygen },
      uMorphology: { value: morphology },
      uDensity: { value: 0.85 },
      uDustExtinction: { value: 0.5 },
    }),
    [colorSulfur, colorHydrogen, colorOxygen, morphology]
  );

  useFrame(({ clock }) => {
    if (!rootRef.current || !rootRef.current.visible) return;
    const t = clock.getElapsedTime();
    if (outerMatRef.current) outerMatRef.current.uniforms.uTime.value = t;
    if (innerMatRef.current) innerMatRef.current.uniforms.uTime.value = t;

    if (rootRef.current) {
      rootRef.current.rotation.y = t * 0.005;
      rootRef.current.rotation.z = Math.sin(t * 0.003) * 0.03;
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
      {/* Central Ionizing Light */}
      <pointLight
        color={colorOxygen}
        intensity={5.0}
        distance={body.size * 6}
      />

      {/* Embedded Stars / Remnant Core */}
      {morphology === 2.0 && (
        // Central White Dwarf for Ring Nebula
        <mesh>
          <sphereGeometry args={[body.size * 0.035, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}

      {morphology === 3.0 && (
        // Trapezium Cluster for Orion Nebula
        <group>
          <mesh position={[body.size * 0.05, body.size * 0.02, 0]}>
            <sphereGeometry args={[body.size * 0.03, 12, 12]} />
            <meshBasicMaterial color="#bfdbfe" />
          </mesh>
          <mesh position={[-body.size * 0.04, -body.size * 0.03, body.size * 0.02]}>
            <sphereGeometry args={[body.size * 0.025, 12, 12]} />
            <meshBasicMaterial color="#93c5fd" />
          </mesh>
          <mesh position={[body.size * 0.02, -body.size * 0.05, -body.size * 0.03]}>
            <sphereGeometry args={[body.size * 0.02, 12, 12]} />
            <meshBasicMaterial color="#60a5fa" />
          </mesh>
        </group>
      )}

      {/* Layer 1: Inner High-Density Ionized Cloud Shell */}
      <mesh>
        <sphereGeometry args={[body.size * 0.72, 48, 48]} />
        <shaderMaterial
          ref={innerMatRef}
          vertexShader={NebulaCloudVertexShader}
          fragmentShader={NebulaCloudFragmentShader}
          uniforms={innerUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Layer 2: Outer Whispy Gas & Shockfront Shell */}
      <mesh>
        <sphereGeometry args={[body.size, 56, 56]} />
        <shaderMaterial
          ref={outerMatRef}
          vertexShader={NebulaCloudVertexShader}
          fragmentShader={NebulaCloudFragmentShader}
          uniforms={outerUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
        />
      </mesh>

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
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
