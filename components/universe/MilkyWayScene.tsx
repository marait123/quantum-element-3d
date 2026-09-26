'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';

// 3D Barred Spiral Galaxy Particle Generator
const SpiralGalaxyArms: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 9000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const arms = 4;
    const armSeparation = (Math.PI * 2) / arms;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Radial distribution with exponential decay
      const radius = Math.pow(Math.random(), 1.5) * 45;
      const spinAngle = radius * 0.28;
      const armAngle = (i % arms) * armSeparation;

      // Random scatter
      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * radius;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.15 * radius;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.3 * radius;

      pos[i3] = Math.cos(armAngle + spinAngle) * radius + randomX;
      pos[i3 + 1] = randomY;
      pos[i3 + 2] = Math.sin(armAngle + spinAngle) * radius + randomZ;

      // Color: Core is warm golden/amber, arms are cool blue/cyan
      const mixedColor = new THREE.Color();
      const coreColor = new THREE.Color('#fbbf24');
      const armColor = new THREE.Color('#38bdf8');
      mixedColor.lerpColors(coreColor, armColor, radius / 40);

      col[i3] = mixedColor.r;
      col[i3 + 1] = mixedColor.g;
      col[i3 + 2] = mixedColor.b;
    }

    return [pos, col];
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Supermassive Black Hole Sagittarius A*
const SagittariusABlackHole: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const diskRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Event Horizon Shadow */}
      <mesh>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Relativistic Accretion Ring (EHT Photon Ring) */}
      <mesh ref={diskRef} rotation={[-Math.PI / 3, 0, 0]}>
        <ringGeometry args={[body.size * 1.08, body.size * 2.8, 64]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#f97316"
          emissiveIntensity={1.8}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Outer Glow Halo */}
      <mesh>
        <sphereGeometry args={[body.size * 1.35, 24, 24]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} wireframe />
      </mesh>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 1.8, 0]} center distanceFactor={45}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-orange-500 shadow-2xl text-xs font-bold text-orange-200 whitespace-nowrap">
            🕳️ {language === 'ar' ? body.nameAr : body.nameEn} (4.15M M☉)
          </div>
        </Html>
      )}
    </group>
  );
};

// Generic Volumetric Cloud Proxy for Nebulae
const NebulaCloudNode: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}> = ({ body, isSelected, isHighlighted, onSelect, language, icon }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <pointLight color={body.color} intensity={2.0} distance={45} />

      {/* Outer Whispy Gas Shell */}
      <mesh>
        <dodecahedronGeometry args={[body.size, 1]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || body.color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.45}
          wireframe
        />
      </mesh>

      {/* Inner Dense Core */}
      <mesh>
        <sphereGeometry args={[body.size * 0.6, 16, 16]} />
        <meshBasicMaterial
          color={body.emissiveColor || '#facc15'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 1.2, 0]} center distanceFactor={45}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

export const MilkyWayScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const isHighlighted = (body: CelestialBody) =>
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  return (
    <group>
      {/* Dynamic Spiral Arms */}
      <SpiralGalaxyArms />

      {/* Sagittarius A* at Galactic Nucleus */}
      <SagittariusABlackHole
        body={CELESTIAL_BODIES.sagittarius_a}
        isSelected={selectedCosmicBodyId === 'sagittarius_a'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.sagittarius_a)}
        onSelect={() => setSelectedCosmicBodyId('sagittarius_a')}
        language={language}
      />

      {/* Crab Nebula Supernova Remnant */}
      <NebulaCloudNode
        body={CELESTIAL_BODIES.crab_nebula}
        isSelected={selectedCosmicBodyId === 'crab_nebula'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.crab_nebula)}
        onSelect={() => setSelectedCosmicBodyId('crab_nebula')}
        language={language}
        icon="🌌"
      />

      {/* Pillars of Creation Interstellar Nursery */}
      <NebulaCloudNode
        body={CELESTIAL_BODIES.pillars_of_creation}
        isSelected={selectedCosmicBodyId === 'pillars_of_creation'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.pillars_of_creation)}
        onSelect={() => setSelectedCosmicBodyId('pillars_of_creation')}
        language={language}
        icon="🦅"
      />

      {/* Kilonova Heavy Metal Forge */}
      <NebulaCloudNode
        body={CELESTIAL_BODIES.kilonova_factory}
        isSelected={selectedCosmicBodyId === 'kilonova_factory'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.kilonova_factory)}
        onSelect={() => setSelectedCosmicBodyId('kilonova_factory')}
        language={language}
        icon="💥"
      />
    </group>
  );
};
