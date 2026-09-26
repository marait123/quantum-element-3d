'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';

// Andromeda Galaxy 3D Spiral Disc
const AndromedaGalaxyModel: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const [pointsPositions, pointsColors] = useMemo(() => {
    const count = 6000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const arms = 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.6) * body.size;
      const angle = (i % arms) * Math.PI + r * 0.45;
      const scatterX = (Math.random() - 0.5) * 0.25 * r;
      const scatterY = (Math.random() - 0.5) * 0.08 * r;
      const scatterZ = (Math.random() - 0.5) * 0.25 * r;

      pos[i3] = Math.cos(angle) * r + scatterX;
      pos[i3 + 1] = scatterY;
      pos[i3 + 2] = Math.sin(angle) * r + scatterZ;

      const c = new THREE.Color();
      c.lerpColors(new THREE.Color('#fef08a'), new THREE.Color('#60a5fa'), r / body.size);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group
      ref={groupRef}
      position={body.position}
      rotation={[Math.PI / 4, 0, Math.PI / 6]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central Galactic Bulge */}
      <mesh>
        <sphereGeometry args={[body.size * 0.22, 24, 24]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Particle Spiral Disc */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointsPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[pointsColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.6, 0]} center distanceFactor={50}>
          <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
            🌀 {language === 'ar' ? body.nameAr : body.nameEn} (1T Stars)
          </div>
        </Html>
      )}
    </group>
  );
};

// M87* Supermassive Black Hole with 5000-ly Relativistic Plasma Jet
const M87SupermassiveBlackHole: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const [hovered, setHovered] = useState(false);
  const jetRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (jetRef.current) {
      jetRef.current.rotation.y += delta * 0.5;
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
      <pointLight color="#fb923c" intensity={3.0} distance={60} />

      {/* Event Horizon Shadow */}
      <mesh>
        <sphereGeometry args={[body.size * 0.45, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Accretion Ring */}
      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[body.size * 0.48, body.size * 1.2, 48]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#f97316"
          emissiveIntensity={2.0}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Relativistic Plasma Jet (Blasting 5000 ly) */}
      <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <mesh ref={jetRef} position={[0, 9.0, 0]}>
          <cylinderGeometry args={[0.2, 1.4, 18.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size + 1.2, 0]} center distanceFactor={50}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-orange-500 text-xs font-bold text-orange-200 whitespace-nowrap shadow-2xl">
            ⚡ {language === 'ar' ? body.nameAr : body.nameEn} (6.5B M☉ + Jet)
          </div>
        </Html>
      )}
    </group>
  );
};

// Dwarf / Satellite Galaxy Proxy
const DwarfGalaxyModel: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group
      ref={meshRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh>
        <dodecahedronGeometry args={[body.size * 0.5, 2]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || body.color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.55}
          wireframe
        />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.6, 0]} center distanceFactor={50}>
          <div className="px-2.5 py-0.5 rounded-full bg-purple-950/90 border border-purple-400 text-xs font-semibold text-purple-200 whitespace-nowrap shadow-lg">
            🌌 {language === 'ar' ? body.nameAr : body.nameEn}
          </div>
        </Html>
      )}
    </group>
  );
};

export const ExtragalacticScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  return (
    <group>
      <ambientLight intensity={0.5} />

      {/* Andromeda Galaxy M31 */}
      <AndromedaGalaxyModel
        body={CELESTIAL_BODIES.andromeda_galaxy}
        isSelected={selectedCosmicBodyId === 'andromeda_galaxy'}
        onSelect={() => setSelectedCosmicBodyId('andromeda_galaxy')}
        language={language}
      />

      {/* Triangulum Galaxy M33 */}
      <DwarfGalaxyModel
        body={CELESTIAL_BODIES.triangulum_galaxy}
        isSelected={selectedCosmicBodyId === 'triangulum_galaxy'}
        onSelect={() => setSelectedCosmicBodyId('triangulum_galaxy')}
        language={language}
      />

      {/* Large Magellanic Cloud */}
      <DwarfGalaxyModel
        body={CELESTIAL_BODIES.large_magellanic_cloud}
        isSelected={selectedCosmicBodyId === 'large_magellanic_cloud'}
        onSelect={() => setSelectedCosmicBodyId('large_magellanic_cloud')}
        language={language}
      />

      {/* M87* Supermassive Black Hole & Jet */}
      <M87SupermassiveBlackHole
        body={CELESTIAL_BODIES.m87_black_hole}
        isSelected={selectedCosmicBodyId === 'm87_black_hole'}
        onSelect={() => setSelectedCosmicBodyId('m87_black_hole')}
        language={language}
      />
    </group>
  );
};
