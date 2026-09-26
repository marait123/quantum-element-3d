'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

// 3D Barred Spiral Galaxy Particle Generator (Milky Way spanning 18,000 units)
const MilkyWaySpiralArms: React.FC<{ center: [number, number, number]; glowTexture?: THREE.CanvasTexture }> = ({
  center,
  glowTexture,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const [visible, setVisible] = useState(false);

  const [positions, colors] = useMemo(() => {
    const count = 12000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const arms = 4;
    const armSeparation = (Math.PI * 2) / arms;
    const maxRadius = 18000;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Exponential radial distribution
      const radius = Math.pow(Math.random(), 1.4) * maxRadius;
      const spinAngle = (radius / maxRadius) * Math.PI * 3.2;
      const armAngle = (i % arms) * armSeparation;

      // Vertical Gaussian thickness tapering at the edges
      const thickness = Math.max(120, (1 - radius / maxRadius) * 1600);
      const randomY = (Math.random() - 0.5) * thickness;

      // Arm width scatter
      const armWidth = 400 + (radius / maxRadius) * 1800;
      const scatterX = (Math.random() - 0.5) * armWidth;
      const scatterZ = (Math.random() - 0.5) * armWidth;

      pos[i3] = center[0] + Math.cos(armAngle + spinAngle) * radius + scatterX;
      pos[i3 + 1] = center[1] + randomY;
      pos[i3 + 2] = center[2] + Math.sin(armAngle + spinAngle) * radius + scatterZ;

      // Color gradation: warm gold galactic core, bright azure/cyan young OB stars in spiral arms
      const c = new THREE.Color();
      const coreCol = new THREE.Color('#fef08a');
      const armCol = new THREE.Color('#38bdf8');
      const h2RegionCol = new THREE.Color('#ec4899'); // Pink H II star-forming regions

      const normDist = radius / maxRadius;
      if (Math.random() < 0.08 && normDist > 0.25) {
        c.copy(h2RegionCol);
      } else {
        c.lerpColors(coreCol, armCol, normDist);
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }

    return [pos, col];
  }, [center]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008;
    }
    // Only show dense galactic spiral arms when zooming out past local solar neighborhood
    const dist = camera.position.length();
    const shouldShow = dist > 250;
    if (shouldShow !== visible) {
      setVisible(shouldShow);
    }
  });

  if (!visible) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={24}
        map={glowTexture}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Supermassive Black Hole Sagittarius A* (Size 160)
const SagittariusABlackHole: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('sagittarius_a', rootRef.current);
    }
    return () => unregisterCelestialObject('sagittarius_a');
  }, []);

  useFrame((_, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 1.2;
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
      <pointLight color="#ea580c" intensity={6.0} distance={body.size * 12} />

      {/* Event Horizon Shadow (Pure Black) */}
      <mesh>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Relativistic Accretion Ring (EHT Photon Ring) */}
      <mesh ref={diskRef} rotation={[-Math.PI / 3, 0, 0]}>
        <ringGeometry args={[body.size * 1.12, body.size * 3.2, 64]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#f97316"
          emissiveIntensity={2.2}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Synchrotron Outer Plasma Halo */}
      <mesh>
        <sphereGeometry args={[body.size * 1.35, 24, 24]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} wireframe />
      </mesh>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 40, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-orange-500 shadow-2xl text-xs font-bold text-orange-200 whitespace-nowrap">
            🕳️ {language === 'ar' ? body.nameAr : body.nameEn} (4.15M M☉)
          </div>
        </Html>
      )}
    </group>
  );
};

// Volumetric Nebula Cloud Node (Crab Nebula, Pillars of Creation, Kilonova Forge)
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

  useEffect(() => {
    if (groupRef.current) {
      registerCelestialObject(body.id, groupRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <pointLight color={body.color} intensity={3.5} distance={body.size * 8} />

      {/* Outer Whispy Gas Shell */}
      <mesh>
        <dodecahedronGeometry args={[body.size, 1]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || body.color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.45}
          wireframe
        />
      </mesh>

      {/* Inner Dense Ionized Core */}
      <mesh>
        <sphereGeometry args={[body.size * 0.65, 20, 20]} />
        <meshBasicMaterial
          color={body.emissiveColor || '#facc15'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 40, 0]} center distanceFactor={body.size * 5}>
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

  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(undefined);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  const isHighlighted = (body: CelestialBody) =>
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  const sgrACenter: [number, number, number] = [0, 0, -6500];

  return (
    <group>
      {/* Dynamic 18,000-unit Milky Way Spiral Arms centered at Sgr A* */}
      <MilkyWaySpiralArms center={sgrACenter} glowTexture={glowTexture} />

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
