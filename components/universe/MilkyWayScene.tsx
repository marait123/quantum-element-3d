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
  const pulsarMeshRef = useRef<THREE.Mesh>(null);
  const diamondMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(1.8);
  const [pulsarHovered, setPulsarHovered] = useState(false);
  const [diamondHovered, setDiamondHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(pulsar.id, rootRef.current);
    return () => unregisterCelestialObject(pulsar.id);
  }, [pulsar.id]);

  useEffect(() => {
    if (diamondMeshRef.current) registerCelestialObject(diamondPlanet.id, diamondMeshRef.current);
    return () => unregisterCelestialObject(diamondPlanet.id);
  }, [diamondPlanet.id]);

  useFrame((_, delta) => {
    if (pulsarMeshRef.current) pulsarMeshRef.current.rotation.y += delta * 12.0; // Rapid millisecond spin
    if (diamondMeshRef.current) {
      orbitAngleRef.current += (diamondPlanet.orbitalSpeed || 0.075) * delta * 60;
      const r = diamondPlanet.orbitalRadius || 36.0;
      diamondMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      diamondMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      diamondMeshRef.current.rotation.y += delta * 0.8;
    }
  });

  const isPulsarSelected = selectedId === pulsar.id;
  const isDiamondSelected = selectedId === diamondPlanet.id;
  const isPulsarHighlighted = highlightedElement !== null && pulsar.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isDiamondHighlighted = highlightedElement !== null && diamondPlanet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={pulsar.position}>
      {/* Millisecond Radio Pulsar */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(pulsar.id);
        }}
        onPointerOver={() => setPulsarHovered(true)}
        onPointerOut={() => setPulsarHovered(false)}
      >
        <pointLight color="#38bdf8" intensity={5.0} distance={pulsar.size * 10} />
        <mesh ref={pulsarMeshRef}>
          <sphereGeometry args={[pulsar.size, 24, 24]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>

        {/* Polar Relativistic Radiation Beams */}
        <mesh position={[0, pulsar.size * 2.2, 0]}>
          <coneGeometry args={[pulsar.size * 0.4, pulsar.size * 4, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0, -pulsar.size * 2.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[pulsar.size * 0.4, pulsar.size * 4, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>

        {(pulsarHovered || isPulsarSelected || isPulsarHighlighted) && (
          <Html position={[0, pulsar.size + 15, 0]} center distanceFactor={pulsar.size * 5}>
            <div className="px-3 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
              ⚡ {language === 'ar' ? pulsar.nameAr : pulsar.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(diamondPlanet.orbitalRadius || 36) - 0.15, (diamondPlanet.orbitalRadius || 36) + 0.15, 72]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Pure Crystalline Diamond Planet (PSR J1719-1438 b) */}
      <group
        ref={diamondMeshRef}
        position={[diamondPlanet.orbitalRadius || 36, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(diamondPlanet.id);
        }}
        onPointerOver={() => setDiamondHovered(true)}
        onPointerOut={() => setDiamondHovered(false)}
      >
        {/* Faceted Crystallized Pure Diamond Sphere */}
        <mesh>
          <icosahedronGeometry args={[diamondPlanet.size, 2]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#bae6fd"
            emissiveIntensity={0.5}
            roughness={0.08}
            metalness={0.95}
            flatShading
          />
        </mesh>

        {/* Refraction Aura */}
        <mesh>
          <sphereGeometry args={[diamondPlanet.size * 1.2, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} wireframe />
        </mesh>

        {(isDiamondSelected || isDiamondHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[diamondPlanet.size * 1.5, diamondPlanet.size * 1.75, 24]} />
            <meshBasicMaterial color={isDiamondHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(diamondHovered || isDiamondSelected || isDiamondHighlighted) && (
          <Html position={[0, diamondPlanet.size + 4.5, 0]} center distanceFactor={25}>
            <div className="px-3 py-1 rounded-full bg-sky-950/95 border border-sky-300 text-xs font-bold text-white whitespace-nowrap shadow-2xl flex items-center gap-1.5">
              💎 {language === 'ar' ? diamondPlanet.nameAr : diamondPlanet.nameEn} (Pure Diamond)
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
    </group>
  );
};
