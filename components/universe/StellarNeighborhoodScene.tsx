'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

// Betelgeuse Red Supergiant with pulsating convective envelope
const BetelgeuseStar: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const outerPuffRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('betelgeuse', rootRef.current);
    }
    return () => unregisterCelestialObject('betelgeuse');
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.04;
      // Pulsation of red supergiant
      const pulse = 1.0 + Math.sin(t * 1.5) * 0.05;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
    if (outerPuffRef.current) {
      outerPuffRef.current.rotation.z = -t * 0.02;
      const puff = 1.05 + Math.sin(t * 0.8) * 0.08;
      outerPuffRef.current.scale.set(puff, puff, puff);
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
      <pointLight color="#ef4444" intensity={4.5} distance={body.size * 10} />

      {/* Pulsating Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshStandardMaterial
          color="#dc2626"
          emissive="#b91c1c"
          emissiveIntensity={0.9}
          roughness={0.7}
        />
      </mesh>

      {/* Convective Outer Dust Shell */}
      <mesh ref={outerPuffRef}>
        <sphereGeometry args={[body.size * 1.18, 24, 24]} />
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
          <ringGeometry args={[body.size * 1.35, body.size * 1.5, 32]} />
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
        <Html position={[0, body.size + 12, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-red-950/90 border border-red-500 shadow-xl backdrop-blur-md text-xs font-bold text-red-200 whitespace-nowrap flex items-center gap-1.5">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>💥 {language === 'ar' ? body.nameAr : body.nameEn} (Dying Star)</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Sirius A & B Binary System
const SiriusBinarySystem: React.FC<{
  siriusA: CelestialBody;
  siriusB: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ siriusA, siriusB, selectedId, highlightedElement, onSelect, language }) => {
  const binaryGroupRef = useRef<THREE.Group>(null);
  const siriusARootRef = useRef<THREE.Group>(null);
  const siriusBRef = useRef<THREE.Group>(null);
  const [hoveredA, setHoveredA] = useState(false);
  const [hoveredB, setHoveredB] = useState(false);

  useEffect(() => {
    if (siriusARootRef.current) registerCelestialObject('sirius_a', siriusARootRef.current);
    if (siriusBRef.current) registerCelestialObject('sirius_b', siriusBRef.current);
    return () => {
      unregisterCelestialObject('sirius_a');
      unregisterCelestialObject('sirius_b');
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (binaryGroupRef.current) {
      binaryGroupRef.current.rotation.y = t * 0.05;
    }
    // Sirius B mutual orbit around A
    if (siriusBRef.current) {
      const orbitR = 45.0;
      const angle = t * 0.4;
      siriusBRef.current.position.set(Math.cos(angle) * orbitR, Math.sin(angle) * 8.0, Math.sin(angle) * orbitR);
    }
  });

  const isASelected = selectedId === siriusA.id;
  const isBSelected = selectedId === siriusB.id;

  return (
    <group ref={binaryGroupRef} position={siriusA.position}>
      {/* Sirius A: Luminous Blue-White Star */}
      <group
        ref={siriusARootRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(siriusA.id);
        }}
        onPointerOver={() => setHoveredA(true)}
        onPointerOut={() => setHoveredA(false)}
      >
        <pointLight color="#bae6fd" intensity={5.0} distance={siriusA.size * 12} />
        <mesh>
          <sphereGeometry args={[siriusA.size, 32, 32]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh>
          <sphereGeometry args={[siriusA.size * 1.25, 24, 24]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>
        {(hoveredA || isASelected) && (
          <Html position={[0, siriusA.size + 8, 0]} center distanceFactor={siriusA.size * 6}>
            <div className="px-2.5 py-0.5 rounded-full bg-blue-950/90 border border-blue-400 text-xs font-semibold text-blue-200 whitespace-nowrap shadow-lg">
              ✨ {language === 'ar' ? siriusA.nameAr : siriusA.nameEn} (A0V 8.6 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Sirius B: Orbiting White Dwarf ("The Pup") */}
      <group
        ref={siriusBRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(siriusB.id);
        }}
        onPointerOver={() => setHoveredB(true)}
        onPointerOut={() => setHoveredB(false)}
      >
        <pointLight color="#38bdf8" intensity={2.5} distance={siriusB.size * 8} />
        <mesh>
          <sphereGeometry args={[siriusB.size, 24, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh>
          <sphereGeometry args={[siriusB.size * 1.4, 16, 16]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.4} wireframe />
        </mesh>
        {(hoveredB || isBSelected) && (
          <Html position={[0, siriusB.size + 4, 0]} center distanceFactor={siriusB.size * 8}>
            <div className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-sky-400 text-[10px] font-bold text-sky-200 whitespace-nowrap shadow-md">
              💎 {language === 'ar' ? siriusB.nameAr : siriusB.nameEn} (White Dwarf)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// Crab Pulsar with 30 Hz spinning synchrotron relativistic lighthouse beams
const CrabPulsarRelic: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const beamGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject('crab_pulsar', rootRef.current);
    return () => unregisterCelestialObject('crab_pulsar');
  }, []);

  useFrame((_, delta) => {
    if (beamGroupRef.current) {
      beamGroupRef.current.rotation.y += delta * 14.0;
    }
  });

  const beamHeight = body.size * 5.0;
  const beamRadius = body.size * 0.7;

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
      <pointLight color="#38bdf8" intensity={4.0} distance={body.size * 12} />

      {/* Compact Neutron Star Core */}
      <mesh>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh>
        <sphereGeometry args={[body.size * 1.3, 20, 20]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.35} side={THREE.BackSide} />
      </mesh>

      {/* Relativistic Synchrotron Beams (Top and Bottom Cones) */}
      <group ref={beamGroupRef} rotation={[0, 0, Math.PI / 6]}>
        {/* North Jet */}
        <mesh position={[0, beamHeight * 0.5, 0]}>
          <coneGeometry args={[beamRadius, beamHeight, 24, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* South Jet */}
        <mesh position={[0, -beamHeight * 0.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[beamRadius, beamHeight, 24, 1, true]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 8, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
            ⚡ {language === 'ar' ? body.nameAr : body.nameEn} (30 Hz Neutron Star)
          </div>
        </Html>
      )}
    </group>
  );
};

// Cygnus X-1 Stellar Black Hole with Relativistic Accretion Disk
const CygnusX1BlackHole: React.FC<{
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
    if (rootRef.current) registerCelestialObject('cygnus_x1', rootRef.current);
    return () => unregisterCelestialObject('cygnus_x1');
  }, []);

  useFrame((_, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 2.0;
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
      <pointLight color="#3b82f6" intensity={4.0} distance={body.size * 10} />

      {/* Event Horizon Shadow (Pure Black) */}
      <mesh>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Swirling Relativistic Accretion Disk */}
      <mesh ref={diskRef} rotation={[-Math.PI / 3, 0, 0]}>
        <ringGeometry args={[body.size * 1.25, body.size * 3.6, 64]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#60a5fa"
          emissiveIntensity={1.4}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Photon Sphere Glow */}
      <mesh>
        <sphereGeometry args={[body.size * 1.08, 24, 24]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} wireframe />
      </mesh>

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 8, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-purple-500 shadow-2xl text-xs font-bold text-purple-200 whitespace-nowrap">
            🕳️ {language === 'ar' ? body.nameAr : body.nameEn} (Stellar Black Hole)
          </div>
        </Html>
      )}
    </group>
  );
};

// Proxima Centauri System with Habitable Planet b
const ProximaCentauriSystem: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, highlightedElement, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const planetOrbitRef = useRef<THREE.Group>(null);
  const starMeshRef = useRef<THREE.Mesh>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0);
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
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.1;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.04) * delta * 60;
      const r = planet.orbitalRadius || 14.0;
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
        <pointLight color="#f87171" intensity={3.0} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.25, 20, 20]} />
          <meshBasicMaterial color="#fca5a5" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 6, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-500 text-xs font-semibold text-rose-200 whitespace-nowrap shadow-md">
              🔴 {language === 'ar' ? star.nameAr : star.nameEn} (4.24 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 14) - 0.06, (planet.orbitalRadius || 14) + 0.06, 64]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Planet b (Habitable Zone Terrestrial World) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 14, 0, 0]}
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
          <meshStandardMaterial color="#d97706" roughness={0.7} metalness={0.2} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.4, planet.size * 1.6, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 2.5, 0]} center distanceFactor={18}>
            <div className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-400 text-[10px] font-bold text-amber-200 whitespace-nowrap shadow-lg">
              🪐 {language === 'ar' ? planet.nameAr : planet.nameEn} (Habitable Zone)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// 55 Cancri Binary & Diamond World System (55 Cancri e / Janssen)
const Cancri55System: React.FC<{
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
  const orbitAngleRef = useRef(0.8);
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

  useFrame(({ clock }, delta) => {
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.05;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.055) * delta * 60;
      const r = planet.orbitalRadius || 28.0;
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
      {/* 55 Cancri A (Yellow Dwarf Host) */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#fde047" intensity={4.5} distance={star.size * 12} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 32, 32]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.2, 24, 24]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.3} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 8, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (41 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 28) - 0.1, (planet.orbitalRadius || 28) + 0.1, 80]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 55 Cancri e (The Diamond Planet) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 28, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Diamond Crystalline Surface with Glowing Magma Crevasses */}
        <mesh>
          <icosahedronGeometry args={[planet.size, 3]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.35}
            roughness={0.15}
            metalness={0.9}
            flatShading
          />
        </mesh>

        {/* Diamond Refraction Aura */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.15, 16, 16]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.3} wireframe />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.5, planet.size * 1.8, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 3.5, 0]} center distanceFactor={25}>
            <div className="px-3 py-1 rounded-full bg-sky-950/95 border border-sky-400 text-xs font-bold text-sky-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5">
              💎 {language === 'ar' ? planet.nameAr : planet.nameEn}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// TRAPPIST-1 Multi-Planet System (TRAPPIST-1e Habitable Earth Analog)
const Trappist1System: React.FC<{
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
  const orbitAngleRef = useRef(1.4);
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
      orbitAngleRef.current += (planet.orbitalSpeed || 0.048) * delta * 60;
      const r = planet.orbitalRadius || 16.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.6;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* Crimson Ultra-Cool Dwarf */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#ef4444" intensity={3.2} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.25, 20, 20]} />
          <meshBasicMaterial color="#f87171" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 6, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-500 text-xs font-semibold text-red-200 whitespace-nowrap shadow-md">
              🔴 {language === 'ar' ? star.nameAr : star.nameEn} (39.5 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 16) - 0.08, (planet.orbitalRadius || 16) + 0.08, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* TRAPPIST-1e (Habitable Ocean & Rust Terrestrial World) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 16, 0, 0]}
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
          <meshStandardMaterial color="#0284c7" roughness={0.5} metalness={0.3} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.4, planet.size * 1.6, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 2.5, 0]} center distanceFactor={18}>
            <div className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-sky-400 text-[10px] font-bold text-sky-200 whitespace-nowrap shadow-lg">
              🌊 {language === 'ar' ? planet.nameAr : planet.nameEn} (Ocean Habitable)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// K2-18 System (K2-18b Hycean Ocean Candidate)
const K218System: React.FC<{
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
  const orbitAngleRef = useRef(2.1);
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
    if (starMeshRef.current) starMeshRef.current.rotation.y += delta * 0.06;
    if (planetMeshRef.current) {
      orbitAngleRef.current += (planet.orbitalSpeed || 0.042) * delta * 60;
      const r = planet.orbitalRadius || 26.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.35;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* K2-18 Red Dwarf */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#ea580c" intensity={3.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#ea580c" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.22, 20, 20]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 7, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-orange-950/90 border border-orange-500 text-xs font-semibold text-orange-200 whitespace-nowrap shadow-md">
              🔴 {language === 'ar' ? star.nameAr : star.nameEn} (124 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 26) - 0.08, (planet.orbitalRadius || 26) + 0.08, 72]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* K2-18b (Hycean Ocean Candidate with Hydrogen/CH4 Atmosphere) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 26, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Ocean Core */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Thick Hydrogen & Methane Atmosphere Layer */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.12, 24, 24]} />
          <meshStandardMaterial color="#a5f3fc" transparent opacity={0.4} roughness={0.9} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.5, planet.size * 1.7, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 3.0, 0]} center distanceFactor={22}>
            <div className="px-3 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
              🌊 {language === 'ar' ? planet.nameAr : planet.nameEn} (Hycean Candidate)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// HD 189733 System (Cobalt Blue Glass-Rain Hot Jupiter)
const HD189733System: React.FC<{
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
  const orbitAngleRef = useRef(3.0);
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
      orbitAngleRef.current += (planet.orbitalSpeed || 0.052) * delta * 60;
      const r = planet.orbitalRadius || 24.0;
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
      {/* K-type Orange Dwarf */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#fb923c" intensity={4.0} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#fb923c" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.2, 20, 20]} />
          <meshBasicMaterial color="#fdba74" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 7, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-orange-950/90 border border-orange-400 text-xs font-semibold text-orange-200 whitespace-nowrap shadow-md">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (64.5 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 24) - 0.08, (planet.orbitalRadius || 24) + 0.08, 64]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* HD 189733 b (Cobalt Blue Glass Rain Giant) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 24, 0, 0]}
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
          <meshStandardMaterial color="#1d4ed8" roughness={0.35} metalness={0.4} />
        </mesh>

        {/* Silicate Wind Band Streak */}
        <mesh rotation={[0.4, 0, 0]}>
          <torusGeometry args={[planet.size * 1.05, 0.08, 12, 32]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.6} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 3.2, 0]} center distanceFactor={22}>
            <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
              🌧️ {language === 'ar' ? planet.nameAr : planet.nameEn} (Glass Rain)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// 51 Pegasi System (Nobel Prize First Exoplanet "Dimidium")
const Pegasi51System: React.FC<{
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
      orbitAngleRef.current += (planet.orbitalSpeed || 0.058) * delta * 60;
      const r = planet.orbitalRadius || 22.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.6;
    }
  });

  const isStarSelected = selectedId === star.id;
  const isPlanetSelected = selectedId === planet.id;
  const isStarHighlighted = highlightedElement !== null && star.primaryElements.some(e => e.atomicNumber === highlightedElement);
  const isPlanetHighlighted = highlightedElement !== null && planet.primaryElements.some(e => e.atomicNumber === highlightedElement);

  return (
    <group ref={rootRef} position={star.position}>
      {/* 51 Pegasi Sun-Twin Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#fde047" intensity={4.5} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 32, 32]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.16, 20, 20]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 8, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-xs font-semibold text-amber-200 whitespace-nowrap shadow-md">
              ☀️ {language === 'ar' ? star.nameAr : star.nameEn} (50.5 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 22) - 0.08, (planet.orbitalRadius || 22) + 0.08, 64]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 51 Pegasi b (Hot Jupiter "Dimidium") */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 22, 0, 0]}
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
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={0.35}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>

        {/* Torrid Atmosphere Glow Halo */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.15, 20, 20]} />
          <meshBasicMaterial color="#fb923c" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#f59e0b'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 3.2, 0]} center distanceFactor={22}>
            <div className="px-3 py-1 rounded-full bg-orange-950/95 border border-orange-400 text-xs font-bold text-orange-200 whitespace-nowrap shadow-xl">
              🔥 {language === 'ar' ? planet.nameAr : planet.nameEn} (First Exoplanet)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

// TOI-700 System (NASA TESS Habitable World TOI-700 d)
const TOI700System: React.FC<{
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
  const orbitAngleRef = useRef(0.8);
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
      orbitAngleRef.current += (planet.orbitalSpeed || 0.046) * delta * 60;
      const r = planet.orbitalRadius || 19.0;
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
      {/* Calm M-dwarf Red Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setStarHovered(true)}
        onPointerOut={() => setStarHovered(false)}
      >
        <pointLight color="#f97316" intensity={3.8} distance={star.size * 10} />
        <mesh ref={starMeshRef}>
          <sphereGeometry args={[star.size, 28, 28]} />
          <meshBasicMaterial color="#ea580c" />
        </mesh>
        <mesh>
          <sphereGeometry args={[star.size * 1.18, 20, 20]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.25} side={THREE.BackSide} />
        </mesh>

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 5, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-400 text-xs font-semibold text-red-200 whitespace-nowrap shadow-md">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (101.4 ly)
            </div>
          </Html>
        )}
      </group>

      {/* Habitable Zone Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(planet.orbitalRadius || 19) - 0.08, (planet.orbitalRadius || 19) + 0.08, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* TOI-700 d (Earth-Sized Habitable World) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 19, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setPlanetHovered(true)}
        onPointerOut={() => setPlanetHovered(false)}
      >
        {/* Ocean & Continental Surface */}
        <mesh>
          <sphereGeometry args={[planet.size, 28, 28]} />
          <meshStandardMaterial color="#0284c7" roughness={0.45} metalness={0.2} />
        </mesh>

        {/* Atmosphere Cloud Layer */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.04, 24, 24]} />
          <meshStandardMaterial color="#f0fdf4" transparent opacity={0.35} roughness={0.9} />
        </mesh>

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.65, 24]} />
            <meshBasicMaterial color={isPlanetHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(planetHovered || isPlanetSelected || isPlanetHighlighted) && (
          <Html position={[0, planet.size + 2.6, 0]} center distanceFactor={18}>
            <div className="px-2.5 py-1 rounded-full bg-teal-950/95 border border-teal-400 text-xs font-bold text-teal-200 whitespace-nowrap shadow-xl">
              🌿 {language === 'ar' ? planet.nameAr : planet.nameEn} (TESS Earth-Sized)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

export const StellarNeighborhoodScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const isHighlighted = (body: CelestialBody) =>
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  return (
    <group>
      {/* Betelgeuse Dying Red Supergiant */}
      <BetelgeuseStar
        body={CELESTIAL_BODIES.betelgeuse}
        isSelected={selectedCosmicBodyId === 'betelgeuse'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.betelgeuse)}
        onSelect={() => setSelectedCosmicBodyId('betelgeuse')}
        language={language}
      />

      {/* Sirius A & B Binary */}
      <SiriusBinarySystem
        siriusA={CELESTIAL_BODIES.sirius_a}
        siriusB={CELESTIAL_BODIES.sirius_b}
        selectedId={selectedCosmicBodyId}
        highlightedElement={highlightedCosmicElementNum}
        onSelect={(id) => setSelectedCosmicBodyId(id)}
        language={language}
      />

      {/* Crab Pulsar */}
      <CrabPulsarRelic
        body={CELESTIAL_BODIES.crab_pulsar}
        isSelected={selectedCosmicBodyId === 'crab_pulsar'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.crab_pulsar)}
        onSelect={() => setSelectedCosmicBodyId('crab_pulsar')}
        language={language}
      />

      {/* Cygnus X-1 Stellar Black Hole */}
      <CygnusX1BlackHole
        body={CELESTIAL_BODIES.cygnus_x1}
        isSelected={selectedCosmicBodyId === 'cygnus_x1'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.cygnus_x1)}
        onSelect={() => setSelectedCosmicBodyId('cygnus_x1')}
        language={language}
      />

      {/* Proxima Centauri System with Habitable Planet b */}
      {CELESTIAL_BODIES.proxima_centauri && CELESTIAL_BODIES.proxima_centauri_b && (
        <ProximaCentauriSystem
          star={CELESTIAL_BODIES.proxima_centauri}
          planet={CELESTIAL_BODIES.proxima_centauri_b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* 55 Cancri System with The Diamond Planet (Janssen) */}
      {CELESTIAL_BODIES.cancri_55_a && CELESTIAL_BODIES.cancri_55_e && (
        <Cancri55System
          star={CELESTIAL_BODIES.cancri_55_a}
          planet={CELESTIAL_BODIES.cancri_55_e}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* TRAPPIST-1 System with Earth-analog Planet 1e */}
      {CELESTIAL_BODIES.trappist_1 && CELESTIAL_BODIES.trappist_1e && (
        <Trappist1System
          star={CELESTIAL_BODIES.trappist_1}
          planet={CELESTIAL_BODIES.trappist_1e}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* K2-18 System with Hycean Ocean Candidate K2-18b */}
      {CELESTIAL_BODIES.k2_18 && CELESTIAL_BODIES.k2_18b && (
        <K218System
          star={CELESTIAL_BODIES.k2_18}
          planet={CELESTIAL_BODIES.k2_18b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* HD 189733 System with Glass-Rain Cobalt Blue Planet */}
      {CELESTIAL_BODIES.hd_189733 && CELESTIAL_BODIES.hd_189733_b && (
        <HD189733System
          star={CELESTIAL_BODIES.hd_189733}
          planet={CELESTIAL_BODIES.hd_189733_b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* 51 Pegasi System with Nobel Prize Hot Jupiter Dimidium */}
      {CELESTIAL_BODIES.pegasi_51 && CELESTIAL_BODIES.pegasi_51_b && (
        <Pegasi51System
          star={CELESTIAL_BODIES.pegasi_51}
          planet={CELESTIAL_BODIES.pegasi_51_b}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* TOI-700 System with TESS Earth-Sized Habitable World TOI-700 d */}
      {CELESTIAL_BODIES.toi_700 && CELESTIAL_BODIES.toi_700_d && (
        <TOI700System
          star={CELESTIAL_BODIES.toi_700}
          planet={CELESTIAL_BODIES.toi_700_d}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}
    </group>
  );
};
