'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { ScaleStandIn } from './rendering/ScaleStandIn';
import { RealisticBlackHole } from './blackhole/RealisticBlackHole';
import { RealisticPulsar } from './pulsar/RealisticPulsar';
import { RealisticDiamondPlanet } from './exoplanet/RealisticDiamondPlanet';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { StarBody } from './rendering/StarBody';
import { SupergiantStar, HotStar, GlowShell } from './rendering/StellarExtras';
import { ExoplanetSurface, getExoplanetLook } from './exoplanet/RealisticExoplanet';
import { systemOrbitAngle } from '@/lib/frames';
import { simClock } from '@/lib/simClock';

// Effective temperatures (K) of the stars drawn by the generic system node
const STAR_KELVIN: Record<string, number> = {
  barnard_star: 3134, // M4 V
  wolf_359: 2800, // M6 V flare star
  tau_ceti: 5344, // G8.5 V
  gliese_667c: 3350, // M1.5 V
  lhs_1140: 3096, // M4.5 V
};

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
  const coreRef = useRef<THREE.Group>(null);
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
      <PooledPointLight color="#ef4444" intensity={4.5} distance={body.size * 10} />

      {/* Pulsating M1-2 Ia photosphere (~3,600 K): a few giant convection cells, as in the ALMA / VLT images */}
      <group ref={coreRef}>
        <SupergiantStar radius={body.size} kelvin={3600} brightness={1.25} cellScale={1.5} glowScale={2.4} glowOpacity={0.45} />
      </group>

      {/* Clumpy, extended envelope of gas and dust it keeps shedding (cf. the 2019-20 Great Dimming) */}
      <GlowShell ref={outerPuffRef} radius={body.size * 1.35} color="#c2461d" strength={0.9} power={2.0} noise={0.7} noiseScale={2.2} />
      <GlowShell radius={body.size * 2.1} color="#7a2a12" strength={0.35} power={1.6} noise={0.8} noiseScale={1.6} />

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
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

  useFrame(() => {
    // Sirius A (2.06 M☉) and B (1.02 M☉) circle their common centre of mass every 50.1 years (shared clock, real
    // period, so almost still at ×1): B covers two thirds of the separation, A the remaining third
    const angle = systemOrbitAngle('sirius_b', simClock.time, 0.05);
    const orbitR = 45.0;
    const bx = Math.cos(angle) * orbitR;
    const by = Math.sin(angle) * 8.0;
    const bz = Math.sin(angle) * orbitR;
    if (siriusBRef.current) siriusBRef.current.position.set(bx * 0.67, by * 0.67, bz * 0.67);
    if (siriusARootRef.current) siriusARootRef.current.position.set(-bx * 0.33, -by * 0.33, -bz * 0.33);
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
        <PooledPointLight color="#bae6fd" intensity={5.0} distance={siriusA.size * 12} />
        {/* A1 V, 9,940 K: blue-white and nearly spotless */}
        <HotStar radius={siriusA.size} kelvin={9940} brightness={1.7} glowScale={3} glowOpacity={0.7} segments={64} />
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
        <PooledPointLight color="#38bdf8" intensity={2.5} distance={siriusB.size * 8} />
        {/* White dwarf, ~25,000 K: small, featureless and intensely bright blue-white */}
        <HotStar radius={siriusB.size} kelvin={25000} brightness={2.6} glowScale={4} glowOpacity={0.9} spin={0.3} />
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

// Crab Pulsar with 30 Hz spinning synchrotron relativistic lighthouse beams & dipolar field loops
const CrabPulsarRelic: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  return (
    <RealisticPulsar
      body={body}
      spinFrequency={10.0}
      magneticTilt={0.58}
      coreColor="#38bdf8"
      beamColor="#0ea5e9"
      magneticFieldColor="#7dd3fc"
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      onSelect={onSelect}
      language={language}
    />
  );
};

// Cygnus X-1 Stellar Black Hole with Relativistic Accretion Disk, Binary Donor Stream & Microquasar Jets
const CygnusX1BlackHole: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  return (
    <RealisticBlackHole
      body={body}
      colorCore="#ecfeff"
      colorMid="#06b6d4"
      colorOuter="#1e3a8a"
      accretionTilt={[-Math.PI / 3, Math.PI / 8, 0]}
      spinSpeed={1.8}
      dopplerStrength={1.2}
      hasLensingHalo={true}
      hasDonorStream={true}
      hasJet={true}
      jetProps={{
        length: body.size * 4.5,
        radius: body.size * 0.28,
        color: '#a5f3fc',
        knotColor: '#ffffff',
        speed: 2.0,
        knotFrequency: 4.0,
        bipolar: true,
      }}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      onSelect={onSelect}
      language={language}
    />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.04) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#f87171" intensity={3.0} distance={star.size * 10} />
        {/* M5.5 V flare star, 3,042 K */}
        <StarBody radius={star.size} kelvin={3042} spots={1} brightness={1.3} glowScale={2.8} glowOpacity={0.55} spin={0.1} />

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
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={3042} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.4, planet.size * 1.435, 128]} />
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
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(0.8);
  const [starHovered, setStarHovered] = useState(false);
  const [planetHovered, setPlanetHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useFrame(({ clock }, delta) => {
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.055) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#fde047" intensity={4.5} distance={star.size * 12} />
        {/* G8 V (K0 IV-V), 5,196 K: a slightly cooler, orange-tinged Sun */}
        <StarBody radius={star.size} kelvin={5196} spots={0.8} brightness={1.6} glowScale={3} glowOpacity={0.6} spin={0.05} />

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

      {/* 55 Cancri e (The Diamond Magma Planet) */}
      <group
        ref={planetMeshRef}
        position={[planet.orbitalRadius || 28, 0, 0]}
      >
        <RealisticDiamondPlanet
          body={planet}
          isMagmaWorld={true}
          hostRef={rootRef}
          isSelected={isPlanetSelected}
          isHighlighted={isPlanetHighlighted}
          onSelect={() => onSelect(planet.id)}
          language={language}
        />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.048) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#ef4444" intensity={3.2} distance={star.size * 10} />
        {/* M8 V ultra-cool dwarf, 2,566 K: deep orange-red */}
        <StarBody radius={star.size} kelvin={2566} spots={1} brightness={1.25} glowScale={3} glowOpacity={0.55} spin={0.08} />

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
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={2566} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.4, planet.size * 1.435, 128]} />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.042) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#ea580c" intensity={3.5} distance={star.size * 10} />
        {/* M2.5 V, ~3,457 K */}
        <StarBody radius={star.size} kelvin={3457} spots={1} brightness={1.3} glowScale={2.8} glowOpacity={0.55} spin={0.06} />

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
        {/* Hazy hydrogen / methane / CO2 envelope (JWST) over a possible water ocean */}
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={3457} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.5, planet.size * 1.535, 128]} />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.052) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#fb923c" intensity={4.0} distance={star.size * 10} />
        {/* K1.5 V, ~5,050 K, magnetically active (spotted) */}
        <StarBody radius={star.size} kelvin={5050} spots={1} brightness={1.5} glowScale={2.8} glowOpacity={0.55} spin={0.05} />

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
        {/* Cobalt-blue banded atmosphere with silicate haze (Hubble albedo spectrum) */}
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={5050} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.485, 128]} />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.058) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#fde047" intensity={4.5} distance={star.size * 10} />
        {/* G2 IV, 5,768 K: a near twin of the Sun */}
        <StarBody radius={star.size} kelvin={5768} spots={0.9} brightness={1.7} glowScale={3} glowOpacity={0.6} spin={0.04} />

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
        {/* Dark, hazy ~1,250 K hot Jupiter */}
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={5768} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.485, 128]} />
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
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.046) * 60); // real period (lib/frames.ts)
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
        <PooledPointLight color="#f97316" intensity={3.8} distance={star.size * 10} />
        {/* M2 V, ~3,480 K, unusually quiet */}
        <StarBody radius={star.size} kelvin={3480} spots={0.5} brightness={1.3} glowScale={2.8} glowOpacity={0.55} spin={0.05} />

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
        {/* Temperate Earth-sized world: oceans, clouds and a blue atmosphere rim */}
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={rootRef} hostKelvin={3480} />

        {(isPlanetSelected || isPlanetHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.485, 128]} />
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

// Scalable Generic Exoplanet System Node
const ExoplanetSystemNode: React.FC<{
  star: CelestialBody;
  planets: CelestialBody[];
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
  icon?: string;
}> = ({ star, planets, selectedId, highlightedElement, onSelect, language, icon = '🪐' }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [starHovered, setStarHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(star.id, rootRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  const isStarSelected = selectedId === star.id;
  const isStarHighlighted =
    highlightedElement !== null &&
    star.primaryElements.some((e) => e.atomicNumber === highlightedElement);

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
        <PooledPointLight color={star.color} intensity={3.8} distance={star.size * 10} />
        {STAR_KELVIN[star.id] ? (
          <StarBody
            radius={star.size}
            kelvin={STAR_KELVIN[star.id]}
            spots={1}
            brightness={STAR_KELVIN[star.id] < 4000 ? 1.3 : 1.6}
            glowScale={2.8}
            glowOpacity={0.55}
            spin={0.05}
          />
        ) : (
          <StarBody radius={star.size} color={star.color} glowScale={2.8} glowOpacity={0.55} spin={0.05} />
        )}

        {(starHovered || isStarSelected || isStarHighlighted) && (
          <Html position={[0, star.size + 4, 0]} center distanceFactor={star.size * 5}>
            <div className="px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-amber-400 text-xs font-semibold text-amber-200 whitespace-nowrap shadow-md">
              ⭐ {language === 'ar' ? star.nameAr : star.nameEn} ({star.distanceFromEarth})
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Planets */}
      {planets.map((planet, idx) => (
        <OrbitingPlanetSubNode
          key={planet.id}
          planet={planet}
          orbitIndex={idx}
          selectedId={selectedId}
          highlightedElement={highlightedElement}
          onSelect={onSelect}
          language={language}
          icon={icon}
          hostRef={rootRef}
          hostKelvin={STAR_KELVIN[star.id] ?? 5772}
        />
      ))}
    </group>
  );
};

const OrbitingPlanetSubNode: React.FC<{
  planet: CelestialBody;
  orbitIndex: number;
  selectedId: string | null;
  highlightedElement: number | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
  icon: string;
  hostRef: React.RefObject<THREE.Object3D>;
  hostKelvin: number;
}> = ({ planet, orbitIndex, selectedId, highlightedElement, onSelect, language, icon, hostRef, hostKelvin }) => {
  const planetMeshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(orbitIndex * 1.8 + 0.5);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => unregisterCelestialObject(planet.id);
  }, [planet.id]);

  useFrame((_, delta) => {
    if (planetMeshRef.current) {
      orbitAngleRef.current = systemOrbitAngle(planet.id, simClock.time, (planet.orbitalSpeed || 0.04) * 60); // real period (lib/frames.ts)
      const r = planet.orbitalRadius || 18.0;
      planetMeshRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      planetMeshRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
      planetMeshRef.current.rotation.y += delta * 0.5;
    }
  });

  const isSelected = selectedId === planet.id;
  const isHighlighted =
    highlightedElement !== null &&
    planet.primaryElements.some((e) => e.atomicNumber === highlightedElement);

  const radius = planet.orbitalRadius || 18.0;

  return (
    <>
      {/* Orbit Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.08, radius + 0.08, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Planet Mesh */}
      <group
        ref={planetMeshRef}
        position={[radius, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id, planet.color)} host={hostRef} hostKelvin={hostKelvin} />

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.45, planet.size * 1.485, 128]} />
            <meshBasicMaterial color={isHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} />
          </mesh>
        )}

        {(hovered || isSelected || isHighlighted) && (
          <Html position={[0, planet.size + 2.4, 0]} center distanceFactor={18}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl">
              {icon} {language === 'ar' ? planet.nameAr : planet.nameEn}
            </div>
          </Html>
        )}
      </group>
    </>
  );
};

// Standalone Landmark Exoplanet Node (NASA Kepler, TRAPPIST, JWST Discoveries)
const StandaloneExoplanetNode: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon?: string;
}> = ({ body, isSelected, isHighlighted, onSelect, language, icon = '🪐' }) => {
  const rootRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
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
      <mesh ref={meshRef}>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || body.color}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.35 : 0.15}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.35, body.size * 1.385, 128]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 2.5, 0]} center distanceFactor={28}>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/95 border border-sky-400 text-xs font-bold text-sky-200 whitespace-nowrap shadow-xl">
            {icon} {language === 'ar' ? body.nameAr : body.nameEn}
          </div>
        </Html>
      )}
    </group>
  );
};

// Persistent Sol (Our Sun / Solar System Anchor at [0, 0, 0])
const SolAnchor: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject('sun', rootRef.current);
    }
    return () => unregisterCelestialObject('sun');
  }, []);

  return (
    <group
      ref={rootRef}
      position={[0, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <PooledPointLight color="#fde047" intensity={5.0} distance={400} decay={1.5} />

      {/* The Sun: real photosphere map (G2 V, 5,772 K) with its corona glow */}
      <StarBody radius={5.2} kelvin={5772} spots={1} brightness={2.0} glowScale={3.2} glowOpacity={0.7} />

      {/* Selection / Focus Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.5, 11.0, 36]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, 15, 0]} center distanceFactor={45}>
          <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5 cursor-pointer">
            <span>☀️ {language === 'ar' ? 'شمسنا (المجموعة الشمسية)' : 'Sol (Our Sun / Solar System)'}</span>
          </div>
        </Html>
      )}
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
      {/* ==================================================== */}
      {/* 0. SOL / OUR SUN (Persistent Solar System Anchor)    */}
      {/* ==================================================== */}
      {/* Stand-in for the detailed Solar System Sun: shown only while scale 1 is hidden */}
      <ScaleStandIn replacesScale={1}>
        <SolAnchor
          isSelected={selectedCosmicBodyId === 'sun'}
          onSelect={() => setSelectedCosmicBodyId('sun')}
          language={language}
        />
      </ScaleStandIn>

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

      {/* Barnard's Star System (2nd Closest System with sub-Earth Barnard b) */}
      {CELESTIAL_BODIES.barnard_star && CELESTIAL_BODIES.barnard_b && (
        <ExoplanetSystemNode
          star={CELESTIAL_BODIES.barnard_star}
          planets={[CELESTIAL_BODIES.barnard_b]}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="🪨"
        />
      )}

      {/* Wolf 359 Flare Star System */}
      {CELESTIAL_BODIES.wolf_359 && (
        <ExoplanetSystemNode
          star={CELESTIAL_BODIES.wolf_359}
          planets={[]}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
        />
      )}

      {/* Tau Ceti System with Habitable Zone Super-Earth Candidate */}
      {CELESTIAL_BODIES.tau_ceti && CELESTIAL_BODIES.tau_ceti_e && (
        <ExoplanetSystemNode
          star={CELESTIAL_BODIES.tau_ceti}
          planets={[CELESTIAL_BODIES.tau_ceti_e]}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="🌍"
        />
      )}

      {/* Gliese 667 C System with Habitable Super-Earth in Triple System */}
      {CELESTIAL_BODIES.gliese_667c && CELESTIAL_BODIES.gliese_667c_e && (
        <ExoplanetSystemNode
          star={CELESTIAL_BODIES.gliese_667c}
          planets={[CELESTIAL_BODIES.gliese_667c_e]}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="🌊"
        />
      )}

      {/* LHS 1140 System with JWST-Confirmed Temperate Ocean World Candidate */}
      {CELESTIAL_BODIES.lhs_1140 && CELESTIAL_BODIES.lhs_1140_b && (
        <ExoplanetSystemNode
          star={CELESTIAL_BODIES.lhs_1140}
          planets={[CELESTIAL_BODIES.lhs_1140_b]}
          selectedId={selectedCosmicBodyId}
          highlightedElement={highlightedCosmicElementNum}
          onSelect={(id) => setSelectedCosmicBodyId(id)}
          language={language}
          icon="💧"
        />
      )}



      {/* V404 Cygni Stellar Black Hole with Relativistic Jets */}
      {CELESTIAL_BODIES.v404_cygni && (
        <RealisticBlackHole
          body={CELESTIAL_BODIES.v404_cygni}
          shadowRadius={CELESTIAL_BODIES.v404_cygni.size * 0.42}
          innerDiskRadius={CELESTIAL_BODIES.v404_cygni.size * 0.5}
          outerDiskRadius={CELESTIAL_BODIES.v404_cygni.size * 1.65}
          colorCore="#e0e7ff"
          colorMid="#6366f1"
          colorOuter="#312e81"
          accretionTilt={[-Math.PI / 3, Math.PI / 5, 0]}
          spinSpeed={1.8}
          dopplerStrength={1.25}
          hasLensingHalo={true}
          hasJet={true}
          jetProps={{
            length: CELESTIAL_BODIES.v404_cygni.size * 4.2,
            radius: CELESTIAL_BODIES.v404_cygni.size * 0.32,
            color: '#818cf8',
            knotColor: '#ffffff',
            speed: 2.2,
            knotFrequency: 3.5,
          }}
          isSelected={selectedCosmicBodyId === 'v404_cygni'}
          onSelect={() => setSelectedCosmicBodyId('v404_cygni')}
          language={language}
        />
      )}

      {/* GRO J1655-40 Superluminal Jet Black Hole */}
      {CELESTIAL_BODIES.gro_j1655_40 && (
        <RealisticBlackHole
          body={CELESTIAL_BODIES.gro_j1655_40}
          shadowRadius={CELESTIAL_BODIES.gro_j1655_40.size * 0.44}
          innerDiskRadius={CELESTIAL_BODIES.gro_j1655_40.size * 0.52}
          outerDiskRadius={CELESTIAL_BODIES.gro_j1655_40.size * 1.55}
          colorCore="#f3e8ff"
          colorMid="#a855f7"
          colorOuter="#581c87"
          accretionTilt={[-Math.PI / 4, Math.PI / 4, 0]}
          spinSpeed={1.6}
          dopplerStrength={1.4}
          hasLensingHalo={true}
          hasJet={true}
          jetProps={{
            length: CELESTIAL_BODIES.gro_j1655_40.size * 4.8,
            radius: CELESTIAL_BODIES.gro_j1655_40.size * 0.3,
            color: '#c084fc',
            knotColor: '#faf5ff',
            speed: 2.5,
            knotFrequency: 4.0,
          }}
          isSelected={selectedCosmicBodyId === 'gro_j1655_40'}
          onSelect={() => setSelectedCosmicBodyId('gro_j1655_40')}
          language={language}
        />
      )}
    </group>
  );
};
