'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';

// Betelgeuse Red Supergiant with pulsating convective envelope
const BetelgeuseStar: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const outerPuffRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

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
      position={body.position}
      onClick={(e) => {
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
  const siriusBRef = useRef<THREE.Group>(null);
  const [hoveredA, setHoveredA] = useState(false);
  const [hoveredB, setHoveredB] = useState(false);

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
        onClick={(e) => {
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
        onClick={(e) => {
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
  const beamGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (beamGroupRef.current) {
      beamGroupRef.current.rotation.y += delta * 14.0;
    }
  });

  const beamHeight = body.size * 5.0;
  const beamRadius = body.size * 0.7;

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
  const diskRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 2.0;
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

// Proxima Centauri Red Dwarf
const ProximaCentauriStar: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHighlighted, onSelect, language }) => {
  const [hovered, setHovered] = useState(false);
  const starRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (starRef.current) starRef.current.rotation.y += delta * 0.1;
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
      <pointLight color="#f87171" intensity={3.0} distance={body.size * 10} />
      <mesh ref={starRef}>
        <sphereGeometry args={[body.size, 28, 28]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh>
        <sphereGeometry args={[body.size * 1.25, 20, 20]} />
        <meshBasicMaterial color="#fca5a5" transparent opacity={0.25} side={THREE.BackSide} />
      </mesh>

      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 6, 0]} center distanceFactor={body.size * 5}>
          <div className="px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-500 text-xs font-semibold text-rose-200 whitespace-nowrap shadow-md">
            🔴 {language === 'ar' ? body.nameAr : body.nameEn} (M-Dwarf 4.24 ly)
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

      {/* Proxima Centauri */}
      <ProximaCentauriStar
        body={CELESTIAL_BODIES.proxima_centauri}
        isSelected={selectedCosmicBodyId === 'proxima_centauri'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.proxima_centauri)}
        onSelect={() => setSelectedCosmicBodyId('proxima_centauri')}
        language={language}
      />
    </group>
  );
};
