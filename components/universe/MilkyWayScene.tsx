'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticBlackHole } from './blackhole/RealisticBlackHole';
import { RealisticPulsar } from './pulsar/RealisticPulsar';
import { RealisticDiamondPlanet } from './exoplanet/RealisticDiamondPlanet';
import { RealisticNebula } from './nebula/RealisticNebula';
import { RealisticSupernova } from './supernova/RealisticSupernova';

// 3D Barred Spiral Galaxy Particle Generator (Milky Way spanning 18,000 units)
const MilkyWaySpiralArms: React.FC<{ center: [number, number, number]; glowTexture?: THREE.CanvasTexture }> = ({
  center,
  glowTexture,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

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
      // Only show dense galactic spiral arms when zooming out past local solar neighborhood
      const dist = camera.position.length();
      pointsRef.current.visible = dist > 250;
    }
  });

  return (
    <points ref={pointsRef} visible={false}>
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
  return (
    <RealisticBlackHole
      body={body}
      colorCore="#fff7ed"
      colorMid="#f97316"
      colorOuter="#7c2d12"
      accretionTilt={[-Math.PI / 3.2, Math.PI / 8, 0]}
      spinSpeed={1.2}
      dopplerStrength={1.25}
      hasLensingHalo={true}
      hasHotspots={true}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      onSelect={onSelect}
      language={language}
    />
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

// Kepler-22 System (Habitable Super-Earth Ocean World)
const Kepler22System: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(1.2);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.04;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.034) * delta * 60;
      const r = planet.orbitalRadius || 52.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.4;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#fef08a" intensity={4.0} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.2, 20, 20]} />
          <meshBasicMaterial color="#fef9c3" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 15, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-yellow-950/90 border border-yellow-400 text-xs font-bold text-yellow-200 whitespace-nowrap shadow-xl">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (638 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 52) - 0.2, (planet.orbitalRadius || 52) + 0.2, 80]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Kepler-22b (Lush Ocean World) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 52, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#10b981" roughness={0.4} metalness={0.2} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 5.0, 0]} center distanceFactor={30}>
            <div className="px-3 py-1 rounded-full bg-emerald-950/95 border border-emerald-400 text-xs font-bold text-emerald-200 whitespace-nowrap shadow-xl">
              🌊 {language === 'ar' ? planet.nameAr : planet.nameEn} (Habitable Super-Earth)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// WASP-12 System (The Doomed Carbon-Rich Egg Planet)
const WASP12System: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(2.4);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.05;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.065) * delta * 60;
      const r = planet.orbitalRadius || 48.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      // Tidally lock and point elongated axis toward star
      planetMeshRef.current.rotation.y = -orbitAngleRef.current;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#f8fafc" intensity={4.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.18, 20, 20]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 18, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-slate-900/95 border border-slate-400 text-xs font-bold text-slate-200 whitespace-nowrap shadow-xl">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (1,410 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 48) - 0.2, (planet.orbitalRadius || 48) + 0.2, 80]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* WASP-12b (Tidally Stretched Pitch-Black Egg Planet) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 48, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Egg-shaped mesh scaled along X axis */}
        <mesh scale={[1.4, 0.95, 0.95]}>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* Glowing tidal heat rim */}
        <mesh scale={[1.42, 0.97, 0.97]}>
          <sphereGeometry args={[planet.size, 20, 20]} />
          <meshBasicMaterial color="#ea580c" transparent opacity={0.25} wireframe />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.6, planet.size * 1.85, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 6.0, 0]} center distanceFactor={32}>
            <div className="px-3 py-1 rounded-full bg-orange-950/95 border border-orange-500 text-xs font-bold text-orange-200 whitespace-nowrap shadow-xl">
              🥚 {language === 'ar' ? planet.nameAr : planet.nameEn} (Doomed Egg Planet)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Stephenson 2-18 (The Largest Known Star in the Universe)
const Stephenson218Star: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.02;
      const pulse = 1.0 + Math.sin(t * 0.8) * 0.04;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (shellRef.current) {
      shellRef.current.rotation.z = -t * 0.015;
      const shellPulse = 1.06 + Math.sin(t * 0.5) * 0.06;
      shellRef.current.scale.set(shellPulse, shellPulse, shellPulse);
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
      <pointLight color="#dc2626" intensity={8.0} distance={body.size * 6} />

      {/* Gargantuan Convective Red Hypergiant Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#b91c1c"
          emissiveIntensity={0.9}
          roughness={0.8}
        />
      </mesh>

      {/* Massive Convective Gas Shockwave Halo */}
      <mesh ref={shellRef}>
        <sphereGeometry args={[body.size * 1.14, 24, 24]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          wireframe
        />
      </mesh>

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.25, body.size * 1.35, 48]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 45, 0]} center distanceFactor={body.size * 5}>
          <div className="px-4 py-1.5 rounded-full bg-red-950/95 border-2 border-red-500 shadow-2xl text-sm font-black text-red-100 whitespace-nowrap flex items-center gap-2">
            👑 {language === 'ar' ? body.nameAr : body.nameEn} (2,150 R☉)
          </div>
        </Html>
      )}
    </group>
  );
};

// PSR J1719-1438 Diamond Pulsar System
const PSRJ1719DiamondSystem: React.FC<{
  pulsar: CelestialBody;
  diamondPlanet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ pulsar, diamondPlanet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const diamondMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(1.8);

  useFrame((_, delta) => {
    if (diamondMeshRef.current) {
      orbitAngleRef.current += (diamondPlanet.orbitalSpeed || 0.075) * delta * 60;
      const r = diamondPlanet.orbitalRadius || 36.0;
      diamondMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      diamondMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
    }
  });

  const isPulsarSelected = selectedId === pulsar.id;
  const isDiamondSelected = selectedId === diamondPlanet.id;
  const isPulsarHighlighted = highlightedElement !== null && pulsar.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isDiamondHighlighted = highlightedElement !== null && diamondPlanet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={pulsar.position}>
      {/* Millisecond Radio Pulsar with Dipolar Field Loops & Sweeping Beams */}
      <RealisticPulsar
        body={pulsar}
        spinFrequency={14.0}
        magneticTilt={0.52}
        isSelected={isPulsarSelected}
        isHighlighted={isPulsarHighlighted}
        onSelect={() => onSelect(pulsar.id)}
        language={language}
      />

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(diamondPlanet.orbitalRadius || 36) - 0.15, (diamondPlanet.orbitalRadius || 36) + 0.15, 72]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Pure Crystalline Diamond Planet (PSR J1719-1438 b) */}
      <group
        ref={diamondMeshRef}
        position={[diamondPlanet.orbitalRadius || 36, 0, 0]}
      >
        <RealisticDiamondPlanet
          body={diamondPlanet}
          isMagmaWorld={false}
          isSelected={isDiamondSelected}
          isHighlighted={isDiamondHighlighted}
          onSelect={() => onSelect(diamondPlanet.id)}
          language={language}
        />
      </group>
    </group>
  );
};

// Kepler-452 System ("Earth 2.0" & Sun-Twin Star)
const Kepler452System: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0.4);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.04;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.038) * delta * 60;
      const r = planet.orbitalRadius || 44.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.4;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* Sun Twin Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#fef08a" intensity={4.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 32, 32]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.15, 20, 20]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 14, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-amber-950/95 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl">
              ☀️ {language === 'ar' ? star.nameAr : star.nameEn} (1,402 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Habitable Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 44) - 0.15, (planet.orbitalRadius || 44) + 0.15, 80]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Kepler-452b ("Earth 2.0" Super-Earth) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 44, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Oceans & Continents */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} metalness={0.15} />
        </mesh>

        {/* Dynamic Atmosphere & Clouds */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.03, 24, 24]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.4} roughness={0.8} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#22c55e'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 4.0, 0]} center distanceFactor={26}>
            <div className="px-3 py-1 rounded-full bg-emerald-950/95 border border-emerald-400 text-xs font-bold text-emerald-200 whitespace-nowrap shadow-xl flex items-center gap-1.5">
              🌍 {language === 'ar' ? planet.nameAr : planet.nameEn} (Earth 2.0)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Kepler-186 System (First Earth-Sized Habitable World)
const Kepler186System: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(1.7);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.04;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.042) * delta * 60;
      const r = planet.orbitalRadius || 32.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.5;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* Red Dwarf Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#f97316" intensity={4.0} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#ea580c" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.18, 20, 20]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 10, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-500 text-xs font-semibold text-red-200 whitespace-nowrap shadow-md">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (582 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 32) - 0.1, (planet.orbitalRadius || 32) + 0.1, 72]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Kepler-186f (First Earth-Sized Habitable World) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 32, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} metalness={0.2} />
        </mesh>

        {/* Ice & Cloud Veil */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.04, 20, 20]} />
          <meshBasicMaterial color="#f0f9ff" transparent opacity={0.3} wireframe />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 3.2, 0]} center distanceFactor={22}>
            <div className="px-3 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
              🌱 {language === 'ar' ? planet.nameAr : planet.nameEn} (First Earth-Sized)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Kepler-16 Circumbinary System ("Tatooine" Dual Sun Planet)
const Kepler16CircumbinarySystem: React.FC<{
  binarySuns: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ binarySuns, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const sunAPosRef = useRef<THREE.Mesh>(null);
  const sunBPosRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const binaryOrbitAngleRef = useRef(0);
  const planetOrbitAngleRef = useRef(2.5);
  const [sunsHovered, setSunsHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(binarySuns.id, rootRef.current);
    return () => unregisterCelestialObject(binarySuns.id);
  }, [binarySuns.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    binaryOrbitAngleRef.current += delta * 0.8;
    if (sunAPosRef.current) {
      sunAPosRef.current.position.x = Math.cos(binaryOrbitAngleRef.current) * 4.2;
      sunAPosRef.current.position.z = Math.sin(binaryOrbitAngleRef.current) * 4.2;
      sunAPosRef.current.rotation.y += delta * 0.05;
    }
    if (sunBPosRef.current) {
      sunBPosRef.current.position.x = -Math.cos(binaryOrbitAngleRef.current) * 7.5;
      sunBPosRef.current.position.z = -Math.sin(binaryOrbitAngleRef.current) * 7.5;
      sunBPosRef.current.rotation.y += delta * 0.04;
    }

    if (planetMeshRef.current) {
      planetOrbitAngleRef.current += (planet.orbitalSpeed || 0.035) * delta * 60;
      const r = planet.orbitalRadius || 40.0;
      planetMeshRef.current.position.x = Math.cos(planetOrbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(planetOrbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.4;
    }
  });

  const isSunsSelected = selectedId === binarySuns.id;
  const isPlanetSelected = selectedId === planet.id;
  const isSunsHighlighted = highlightedElement !== null && binarySuns.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={binarySuns.position}>
      {/* Dual Binary Suns (Kepler-16 A & B) */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(binarySuns.id);
        }}
        onPointerOver={() => setSunsHovered(true)}
        onPointerOut={() => setSunsHovered(false)}
      >
        <pointLight color="#f97316" intensity={4.5} distance={binarySuns.size * 10} />

        {/* Primary K-Dwarf Sun */}
        <mesh ref={sunAPosRef} position={[4.2, 0, 0]}>
          <sphereGeometry args={[binarySuns.size * 0.65, 28, 28]} />
          <meshBasicMaterial color="#fb923c" />
        </mesh>

        {/* Secondary M-Dwarf Sun */}
        <mesh ref={sunBPosRef} position={[-7.5, 0, 0]}>
          <sphereGeometry args={[binarySuns.size * 0.38, 24, 24]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {(sunsHovered || isSunsSelected || isSunsHighlighted) && (
          <Html position={[0, binarySuns.size + 12, 0]} center distanceFactor={binarySuns.size * 5}>
            <div className="px-3 py-1 rounded-full bg-amber-950/95 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl">
              ☀️☀️ {language === 'ar' ? binarySuns.nameAr : binarySuns.nameEn} (245 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Circumbinary Wide Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 40) - 0.15, (planet.orbitalRadius || 40) + 0.15, 80]} />
        <meshBasicMaterial color="#eab308" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Kepler-16b ("Tatooine" Circumbinary Gas Giant) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 40, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Saturn-like Golden Atmosphere */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.5} metalness={0.2} />
        </mesh>

        {/* Delicate Gas Giant Ring */}
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <ringGeometry args={[planet.size * 1.35, planet.size * 2.1, 48]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 2.2, planet.size * 2.4, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#ca8a04'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 4.5, 0]} center distanceFactor={26}>
            <div className="px-3 py-1 rounded-full bg-amber-950/95 border border-yellow-400 text-xs font-bold text-yellow-200 whitespace-nowrap shadow-2xl flex items-center gap-1.5">
              🌅 {language === 'ar' ? planet.nameAr : planet.nameEn} (Tatooine Dual Suns)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Kepler-1649c System (Earth-Twin Habitable Planet)
const Kepler1649cSystem: React.FC<{
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(planet.id, rootRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += (planet.rotationSpeed || 0.014) * delta * 60;
    }
  });

  const isSelected = selectedId === planet.id;
  const isHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={planet.position}>
      {/* Dim host red-dwarf illumination */}
      <pointLight color="#f97316" intensity={2.5} distance={60} />

      <group
        ref={planetMeshRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Terrestrial Blue-Green Sphere */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.45} metalness={0.2} />
        </mesh>

        {/* Thin Cloud Shell */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.04, 20, 20]} />
          <meshStandardMaterial color="#f8fafc" transparent opacity={0.35} />
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(hovered || isSelected || isHighlighted) && (
          <Html position={[0, planet.size + 3.2, 0]} center distanceFactor={22}>
            <div className="px-3 py-1 rounded-full bg-sky-950/95 border border-sky-400 text-xs font-bold text-sky-200 whitespace-nowrap shadow-xl">
              🌐 {language === 'ar' ? planet.nameAr : planet.nameEn} (Earth Twin)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// KELT-9 System (Hottest Known Exoplanet 4,600 K)
const KELT9System: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(1.0);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.08;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.07) * delta * 60;
      const r = planet.orbitalRadius || 46.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.8;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* Blazing A0 Blue-White Giant Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#93c5fd" intensity={5.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 32, 32]} />
          <meshBasicMaterial color="#bfdbfe" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.18, 24, 24]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 18, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (10,170 K)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 46) - 0.2, (planet.orbitalRadius || 46) + 0.2, 80]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* KELT-9b (Hottest Exoplanet 4,600 K with Vaporized Metal Envelope) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 46, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Incandescent Core */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#f97316"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>

        {/* Vaporized Iron & Titanium Comet-like Evaporating Envelope */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.25, 20, 20]} />
          <meshBasicMaterial color="#ea580c" transparent opacity={0.4} wireframe />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.5, planet.size * 1.75, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#f97316'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 5.0, 0]} center distanceFactor={28}>
            <div className="px-3 py-1 rounded-full bg-amber-950/95 border-2 border-yellow-400 text-xs font-black text-amber-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 animate-pulse">
              🔥 {language === 'ar' ? planet.nameAr : planet.nameEn} (4,600 K - Hottest World)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Generic Galactic Exoplanet System for Scale 3
const GalacticExoplanetSystem: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
  icon: string;
  badgeSuffix?: string;
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language, icon, badgeSuffix }) => {
  const rootRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.05;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.03) * delta * 60;
      const r = planet.orbitalRadius || 40.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.5;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  const radius = planet.orbitalRadius || 40.0;

  return (
    <group ref={rootRef} position={star.position}>
      {/* Central Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color={star.color} intensity={4.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color={star.color} />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.18, 20, 20]} />
          <meshBasicMaterial color={star.emissiveColor || star.color} transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 10, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-slate-900/95 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.2, radius + 0.2, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting Planet */}
      <group
        ref={planetMeshRef}
        position={[radius, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        <mesh>
          <sphereGeometry args={[planet.size, 24, 24]} />
          <meshStandardMaterial
            color={planet.color}
            emissive={planet.emissiveColor || planet.color}
            emissiveIntensity={0.3}
            roughness={0.7}
          />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 4.5, 0]} center distanceFactor={24}>
            <div className="px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
              {icon} {language === 'ar' ? planet.nameAr : planet.nameEn} {badgeSuffix ? `(${badgeSuffix})` : ''}
            </div>
          </Html>
        )}
      </group>
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

      {/* Crab Nebula Supernova Remnant with Synchrotron Filament Web */}
      <RealisticNebula
        body={CELESTIAL_BODIES.crab_nebula}
        isSelected={selectedCosmicBodyId === 'crab_nebula'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.crab_nebula)}
        onSelect={() => setSelectedCosmicBodyId('crab_nebula')}
        language={language}
        icon="🌌"
      />

      {/* Pillars of Creation Interstellar Nursery (Elephant Trunks & EGGs) */}
      <RealisticNebula
        body={CELESTIAL_BODIES.pillars_of_creation}
        isSelected={selectedCosmicBodyId === 'pillars_of_creation'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.pillars_of_creation)}
        onSelect={() => setSelectedCosmicBodyId('pillars_of_creation')}
        language={language}
        icon="🦅"
      />

      {/* Orion Nebula (M42) Massive Starburst Nursery */}
      {CELESTIAL_BODIES.orion_nebula && (
        <RealisticNebula
          body={CELESTIAL_BODIES.orion_nebula}
          isSelected={selectedCosmicBodyId === 'orion_nebula'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.orion_nebula)}
          onSelect={() => setSelectedCosmicBodyId('orion_nebula')}
          language={language}
          icon="✨"
        />
      )}

      {/* Ring Nebula (M57) Planetary Nebula with Central White Dwarf */}
      {CELESTIAL_BODIES.ring_nebula && (
        <RealisticNebula
          body={CELESTIAL_BODIES.ring_nebula}
          isSelected={selectedCosmicBodyId === 'ring_nebula'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.ring_nebula)}
          onSelect={() => setSelectedCosmicBodyId('ring_nebula')}
          language={language}
          icon="💍"
        />
      )}

      {/* Carina Nebula (NGC 3372) Cosmic Cliffs */}
      {CELESTIAL_BODIES.carina_nebula && (
        <RealisticNebula
          body={CELESTIAL_BODIES.carina_nebula}
          isSelected={selectedCosmicBodyId === 'carina_nebula'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.carina_nebula)}
          onSelect={() => setSelectedCosmicBodyId('carina_nebula')}
          language={language}
          icon="🏔️"
        />
      )}


      {/* Kilonova Heavy-Element Radioactive Forge (GW170817) */}
      <RealisticSupernova
        body={CELESTIAL_BODIES.kilonova_factory}
        isSelected={selectedCosmicBodyId === 'kilonova_factory'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.kilonova_factory)}
        onSelect={() => setSelectedCosmicBodyId('kilonova_factory')}
        language={language}
        icon="🥇"
      />

      {/* Cassiopeia A Supernova Remnant & Reverse Shock */}
      {CELESTIAL_BODIES.cas_a_supernova && (
        <RealisticSupernova
          body={CELESTIAL_BODIES.cas_a_supernova}
          isSelected={selectedCosmicBodyId === 'cas_a_supernova'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.cas_a_supernova)}
          onSelect={() => setSelectedCosmicBodyId('cas_a_supernova')}
          language={language}
          icon="💥"
        />
      )}

      {/* Kepler-22 System (Habitable Zone Ocean World) */}
      {CELESTIAL_BODIES.kepler_22 && CELESTIAL_BODIES.kepler_22b && (
        <Kepler22System
          star={CELESTIAL_BODIES.kepler_22}
          planet={CELESTIAL_BODIES.kepler_22b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* WASP-12 System (The Doomed Egg Planet) */}
      {CELESTIAL_BODIES.wasp_12 && CELESTIAL_BODIES.wasp_12b && (
        <WASP12System
          star={CELESTIAL_BODIES.wasp_12}
          planet={CELESTIAL_BODIES.wasp_12b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Stephenson 2-18 (Largest Known Star in the Universe) */}
      {CELESTIAL_BODIES.stephenson_2_18 && (
        <Stephenson218Star
          body={CELESTIAL_BODIES.stephenson_2_18}
          isSelected={selectedCosmicBodyId === 'stephenson_2_18'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.stephenson_2_18)}
          onSelect={() => setSelectedCosmicBodyId('stephenson_2_18')}
          language={language}
        />
      )}

      {/* PSR J1719-1438 Diamond Pulsar System */}
      {CELESTIAL_BODIES.psr_j1719_1438 && CELESTIAL_BODIES.psr_j1719_1438_b && (
        <PSRJ1719DiamondSystem
          pulsar={CELESTIAL_BODIES.psr_j1719_1438}
          diamondPlanet={CELESTIAL_BODIES.psr_j1719_1438_b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Kepler-452 System ("Earth 2.0" & Sun-Twin Star) */}
      {CELESTIAL_BODIES.kepler_452 && CELESTIAL_BODIES.kepler_452b && (
        <Kepler452System
          star={CELESTIAL_BODIES.kepler_452}
          planet={CELESTIAL_BODIES.kepler_452b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Kepler-186 System (First Earth-Sized Habitable World) */}
      {CELESTIAL_BODIES.kepler_186 && CELESTIAL_BODIES.kepler_186f && (
        <Kepler186System
          star={CELESTIAL_BODIES.kepler_186}
          planet={CELESTIAL_BODIES.kepler_186f}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Kepler-16 Circumbinary System ("Tatooine" Dual Sun Planet) */}
      {CELESTIAL_BODIES.kepler_16_ab && CELESTIAL_BODIES.kepler_16b && (
        <Kepler16CircumbinarySystem
          binarySuns={CELESTIAL_BODIES.kepler_16_ab}
          planet={CELESTIAL_BODIES.kepler_16b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Kepler-1649c System (Earth-Twin Habitable Planet) */}
      {CELESTIAL_BODIES.kepler_1649c && (
        <Kepler1649cSystem
          planet={CELESTIAL_BODIES.kepler_1649c}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* KELT-9 System (Hottest Known Exoplanet 4,600 K) */}
      {CELESTIAL_BODIES.kelt_9 && CELESTIAL_BODIES.kelt_9b && (
        <KELT9System
          star={CELESTIAL_BODIES.kelt_9}
          planet={CELESTIAL_BODIES.kelt_9b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Kepler-90 System (8-Planet Solar System Analog) */}
      {CELESTIAL_BODIES.kepler_90 && CELESTIAL_BODIES.kepler_90_h && (
        <GalacticExoplanetSystem
          star={CELESTIAL_BODIES.kepler_90}
          planet={CELESTIAL_BODIES.kepler_90_h}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="🪐"
          badgeSuffix="8 Planets"
        />
      )}

      {/* WASP-76 System (Ultra-Hot Jupiter Where It Rains Iron) */}
      {CELESTIAL_BODIES.wasp_76 && CELESTIAL_BODIES.wasp_76_b && (
        <GalacticExoplanetSystem
          star={CELESTIAL_BODIES.wasp_76}
          planet={CELESTIAL_BODIES.wasp_76_b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="🌧️"
          badgeSuffix="Iron Rain"
        />
      )}
    </group>
  );
};
