'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';

// Andromeda Galaxy 3D Spiral Disc (Size 12,000)
const AndromedaGalaxyModel: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ body, isSelected, onSelect, language, glowTexture }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const [pointsPositions, pointsColors] = useMemo(() => {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const arms = 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.5) * body.size;
      const angle = (i % arms) * Math.PI + (r / body.size) * Math.PI * 2.8;
      const scatterX = (Math.random() - 0.5) * 0.28 * r;
      const scatterY = (Math.random() - 0.5) * 0.08 * r;
      const scatterZ = (Math.random() - 0.5) * 0.28 * r;

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
      groupRef.current.rotation.y += delta * 0.006;
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
      <pointLight color="#60a5fa" intensity={4.0} distance={body.size * 3} />

      {/* Central Galactic Bulge */}
      <mesh>
        <sphereGeometry args={[body.size * 0.18, 24, 24]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Particle Spiral Disc with circular glow */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointsPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[pointsColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={body.size * 0.015}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.45, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
            🌀 {language === 'ar' ? body.nameAr : body.nameEn} (1T Stars)
          </div>
        </Html>
      )}
    </group>
  );
};

// Triangulum Galaxy M33 (Size 6,500)
const TriangulumGalaxyModel: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ body, isSelected, onSelect, language, glowTexture }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const [pointsPositions, pointsColors] = useMemo(() => {
    const count = 4500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.4) * body.size;
      const angle = (i % 3) * ((Math.PI * 2) / 3) + (r / body.size) * Math.PI * 2.2;
      const scatterX = (Math.random() - 0.5) * 0.3 * r;
      const scatterY = (Math.random() - 0.5) * 0.1 * r;
      const scatterZ = (Math.random() - 0.5) * 0.3 * r;

      pos[i3] = Math.cos(angle) * r + scatterX;
      pos[i3 + 1] = scatterY;
      pos[i3 + 2] = Math.sin(angle) * r + scatterZ;

      const c = new THREE.Color();
      c.lerpColors(new THREE.Color('#e9d5ff'), new THREE.Color('#a855f7'), r / body.size);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <group
      ref={groupRef}
      position={body.position}
      rotation={[-Math.PI / 5, 0, Math.PI / 4]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointsPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[pointsColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={body.size * 0.015}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.45, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-purple-400 text-xs font-bold text-purple-200 whitespace-nowrap shadow-xl">
            🌀 {language === 'ar' ? body.nameAr : body.nameEn} (40B Stars)
          </div>
        </Html>
      )}
    </group>
  );
};

// Large Magellanic Cloud Satellite Dwarf Galaxy (Size 4,500)
const LMCGalaxyModel: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ body, isSelected, onSelect, language, glowTexture }) => {
  const [hovered, setHovered] = useState(false);

  const [pointsPositions, pointsColors] = useMemo(() => {
    const count = 3500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.random() * body.size;
      const theta = Math.random() * Math.PI * 2;

      pos[i3] = Math.cos(theta) * r + (Math.random() - 0.5) * 0.4 * r;
      pos[i3 + 1] = (Math.random() - 0.5) * 0.3 * r;
      pos[i3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * 0.4 * r;

      const c = new THREE.Color('#fb7185');
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

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
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointsPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[pointsColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={body.size * 0.016}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.5, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-rose-400 text-xs font-bold text-rose-200 whitespace-nowrap shadow-xl">
            ✨ {language === 'ar' ? body.nameAr : body.nameEn} (Dwarf Galaxy)
          </div>
        </Html>
      )}
    </group>
  );
};

// M87* Supermassive Black Hole with 5,000-ly Relativistic Plasma Jet (Size 5,000)
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
      jetRef.current.rotation.y += delta * 0.6;
    }
  });

  const jetHeight = body.size * 3.6;
  const jetRadius = body.size * 0.28;

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
      <pointLight color="#fb923c" intensity={5.0} distance={body.size * 6} />

      {/* Event Horizon Shadow */}
      <mesh>
        <sphereGeometry args={[body.size * 0.45, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Accretion Ring */}
      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[body.size * 0.48, body.size * 1.35, 48]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#f97316"
          emissiveIntensity={2.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Relativistic Plasma Jet (5,000 light-year synchroton blast) */}
      <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <mesh ref={jetRef} position={[0, jetHeight * 0.5, 0]}>
          <cylinderGeometry args={[jetRadius * 0.15, jetRadius, jetHeight, 20, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.6, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-orange-500 shadow-2xl text-xs font-bold text-orange-200 whitespace-nowrap">
            🕳️ {language === 'ar' ? body.nameAr : body.nameEn} (6.5B M☉ EHT First Image)
          </div>
        </Html>
      )}
    </group>
  );
};

export const ExtragalacticScene: React.FC = () => {
  const { camera } = useThree();
  const [visible, setVisible] = useState(false);
  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(undefined);

  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  useFrame(() => {
    const dist = camera.position.length();
    const shouldShow = dist > 3000;
    if (shouldShow !== visible) {
      setVisible(shouldShow);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Andromeda Galaxy */}
      <AndromedaGalaxyModel
        body={CELESTIAL_BODIES.andromeda_galaxy}
        isSelected={selectedCosmicBodyId === 'andromeda_galaxy'}
        onSelect={() => setSelectedCosmicBodyId('andromeda_galaxy')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* Triangulum Galaxy */}
      <TriangulumGalaxyModel
        body={CELESTIAL_BODIES.triangulum_galaxy}
        isSelected={selectedCosmicBodyId === 'triangulum_galaxy'}
        onSelect={() => setSelectedCosmicBodyId('triangulum_galaxy')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* Large Magellanic Cloud */}
      <LMCGalaxyModel
        body={CELESTIAL_BODIES.large_magellanic_cloud}
        isSelected={selectedCosmicBodyId === 'large_magellanic_cloud'}
        onSelect={() => setSelectedCosmicBodyId('large_magellanic_cloud')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* M87* Supermassive Black Hole */}
      <M87SupermassiveBlackHole
        body={CELESTIAL_BODIES.m87_black_hole}
        isSelected={selectedCosmicBodyId === 'm87_black_hole'}
        onSelect={() => setSelectedCosmicBodyId('m87_black_hole')}
        language={language}
      />
    </group>
  );
};
