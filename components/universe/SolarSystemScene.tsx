'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import {
  getSunTexture,
  getEarthTexture,
  getEarthCloudsTexture,
  getMoonTexture,
  getMarsTexture,
  getJupiterTexture,
  getSaturnRingTexture,
} from '@/lib/planetTextures';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticVoyagerProbe } from './models/RealisticVoyager1';
import { RealisticJWST } from './models/RealisticJWST';
import { RealisticHubble } from './models/RealisticHubble';
import { RealisticComet } from './smallbodies/RealisticComet';
import { RealisticAsteroid } from './smallbodies/RealisticAsteroid';
import { MeteorShowerEffect } from './smallbodies/MeteorShowerEffect';
import { InterstellarTrajectories } from './trajectories/InterstellarTrajectories';

// ==========================================
// REALISTIC EARTH WITH ROTATING CLOUD SHIFT
// ==========================================
const RealisticEarth: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (earthGroupRef.current) {
      registerCelestialObject('earth', earthGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('earth');
    };
  }, []);

  useEffect(() => {
    if (moonGroupRef.current) {
      registerCelestialObject('moon', moonGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('moon');
    };
  }, []);

  const [textures, setTextures] = useState<{
    earth?: THREE.CanvasTexture;
    clouds?: THREE.CanvasTexture;
    moon?: THREE.CanvasTexture;
  }>({});

  useEffect(() => {
    setTextures({
      earth: getEarthTexture(),
      clouds: getEarthCloudsTexture(),
      moon: getMoonTexture(),
    });
  }, []);

  useFrame((_, delta) => {
    // 1. Earth orbits the Sun
    if (earthGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      earthGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      earthGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }

    // 2. Earth surface rotates on its 23.4° tilted axis
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += (body.rotationSpeed || 0.015) * delta * 60;
    }

    // 3. Independent cloud rotation (faster atmospheric jet streams)
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += (body.rotationSpeed || 0.015) * 1.35 * delta * 60;
    }

    // 4. Moon orbits Earth
    if (moonOrbitRef.current) {
      moonOrbitRef.current.rotation.y += delta * 0.45;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const moonBody = CELESTIAL_BODIES.moon;

  return (
    <group ref={earthGroupRef} position={body.position}>
      {/* Earth System Root */}
      <group
        rotation={[0.41, 0, 0]} // 23.4° axial tilt
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Photorealistic Continents & Oceans Surface */}
        <mesh ref={surfaceRef}>
          <sphereGeometry args={[body.size, 48, 48]} />
          {textures.earth ? (
            <meshStandardMaterial
              map={textures.earth}
              roughness={0.55}
              metalness={0.15}
              emissive={isSelected ? '#0284c7' : '#000000'}
              emissiveIntensity={isSelected ? 0.35 : 0}
            />
          ) : (
            <meshStandardMaterial color="#0284c7" />
          )}
        </mesh>

        {/* Dynamic Transparent Cumulus Clouds Layer */}
        {textures.clouds && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[body.size * 1.02, 40, 40]} />
            <meshStandardMaterial
              map={textures.clouds}
              transparent
              opacity={0.88}
              blending={THREE.NormalBlending}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Soft Blue Rayleigh Atmosphere Glow */}
        <mesh>
          <sphereGeometry args={[body.size * 1.06, 32, 32]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.22}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Selection / Highlight Pulse Ring */}
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

        {/* Label */}
        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.2, 0]} center distanceFactor={28}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-400 shadow-xl backdrop-blur-md text-[11px] font-bold text-sky-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🌍 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Moon Orbiting Earth */}
      <group ref={moonOrbitRef}>
        <group ref={moonGroupRef} position={[3.2, 0.4, 0]}>
          <mesh>
            <sphereGeometry args={[moonBody.size, 24, 24]} />
            {textures.moon ? (
              <meshStandardMaterial map={textures.moon} roughness={0.85} metalness={0.05} />
            ) : (
              <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
            )}
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ==========================================
// REALISTIC MARS WITH CRATERS & ICE CAPS
// ==========================================
const RealisticMars: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const marsGroupRef = useRef<THREE.Group>(null);
  const marsMeshRef = useRef<THREE.Mesh>(null);
  const phobosOrbitRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  const [marsTexture, setMarsTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setMarsTexture(getMarsTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (marsGroupRef.current) {
      registerCelestialObject('mars', marsGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('mars');
    };
  }, []);

  useFrame((_, delta) => {
    if (marsGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      marsGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      marsGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }
    if (marsMeshRef.current) {
      marsMeshRef.current.rotation.y += (body.rotationSpeed || 0.014) * delta * 60;
    }
    if (phobosOrbitRef.current) {
      phobosOrbitRef.current.rotation.y += delta * 1.2;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group ref={marsGroupRef} position={body.position}>
      <group
        rotation={[0.44, 0, 0]} // 25.2° axial tilt
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        <mesh ref={marsMeshRef}>
          <sphereGeometry args={[body.size, 40, 40]} />
          {marsTexture ? (
            <meshStandardMaterial
              map={marsTexture}
              roughness={0.8}
              metalness={0.1}
              emissive={isSelected ? '#b91c1c' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          ) : (
            <meshStandardMaterial color="#dc2626" roughness={0.8} />
          )}
        </mesh>

        {/* Subtle Rust Atmosphere Rim */}
        <mesh>
          <sphereGeometry args={[body.size * 1.035, 24, 24]} />
          <meshBasicMaterial color="#f87171" transparent opacity={0.18} side={THREE.BackSide} />
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.35, body.size * 1.5, 32]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#ef4444'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.0, 0]} center distanceFactor={28}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-red-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-red-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🔴 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Phobos */}
      <group ref={phobosOrbitRef}>
        <mesh position={[1.8, 0.2, 0]}>
          <dodecahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// REALISTIC JUPITER WITH GREAT RED SPOT
// ==========================================
const RealisticJupiter: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const jupiterGroupRef = useRef<THREE.Group>(null);
  const jupiterMeshRef = useRef<THREE.Mesh>(null);
  const europaOrbitRef = useRef<THREE.Group>(null);
  const europaGroupRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  const [jupTexture, setJupTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setJupTexture(getJupiterTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (jupiterGroupRef.current) {
      registerCelestialObject('jupiter', jupiterGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('jupiter');
    };
  }, []);

  useEffect(() => {
    if (europaGroupRef.current) {
      registerCelestialObject('europa', europaGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('europa');
    };
  }, []);

  useFrame((_, delta) => {
    if (jupiterGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      jupiterGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      jupiterGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }
    if (jupiterMeshRef.current) {
      jupiterMeshRef.current.rotation.y += (body.rotationSpeed || 0.035) * delta * 60;
    }
    if (europaOrbitRef.current) {
      europaOrbitRef.current.rotation.y += delta * 0.7;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const europaBody = CELESTIAL_BODIES.europa;

  return (
    <group ref={jupiterGroupRef} position={body.position}>
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        <mesh ref={jupiterMeshRef}>
          <sphereGeometry args={[body.size, 48, 48]} />
          {jupTexture ? (
            <meshStandardMaterial
              map={jupTexture}
              roughness={0.65}
              metalness={0.1}
              emissive={isSelected ? '#b45309' : '#000000'}
              emissiveIntensity={isSelected ? 0.3 : 0}
            />
          ) : (
            <meshStandardMaterial color="#d97706" roughness={0.65} />
          )}
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.35, body.size * 1.5, 32]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#f59e0b'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.4, 0]} center distanceFactor={30}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-amber-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🪐 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Europa */}
      <group ref={europaOrbitRef}>
        <group ref={europaGroupRef} position={[5.2, 0.4, 0]}>
          <mesh>
            <sphereGeometry args={[europaBody.size, 20, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ==========================================
// REALISTIC SATURN WITH CASSINI DIVISION RINGS
// ==========================================
const RealisticSaturn: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const saturnGroupRef = useRef<THREE.Group>(null);
  const saturnMeshRef = useRef<THREE.Mesh>(null);
  const titanOrbitRef = useRef<THREE.Group>(null);
  const titanGroupRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  const [ringTexture, setRingTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setRingTexture(getSaturnRingTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (saturnGroupRef.current) {
      registerCelestialObject('saturn', saturnGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('saturn');
    };
  }, []);

  useEffect(() => {
    if (titanGroupRef.current) {
      registerCelestialObject('titan', titanGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('titan');
    };
  }, []);

  useFrame((_, delta) => {
    if (saturnGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      saturnGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      saturnGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }
    if (saturnMeshRef.current) {
      saturnMeshRef.current.rotation.y += (body.rotationSpeed || 0.03) * delta * 60;
    }
    if (titanOrbitRef.current) {
      titanOrbitRef.current.rotation.y += delta * 0.5;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const titanBody = CELESTIAL_BODIES.titan;

  return (
    <group ref={saturnGroupRef} position={body.position}>
      <group
        rotation={[0.47, 0, 0.1]} // 26.7° axial tilt
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Saturn Body */}
        <mesh ref={saturnMeshRef}>
          <sphereGeometry args={[body.size, 40, 40]} />
          <meshStandardMaterial
            color="#fde047"
            roughness={0.6}
            metalness={0.1}
            emissive={isSelected ? '#ca8a04' : '#000000'}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
        </mesh>

        {/* Majestic Cassini Ring System */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.35, body.size * 2.7, 64]} />
          {ringTexture ? (
            <meshStandardMaterial
              map={ringTexture}
              side={THREE.DoubleSide}
              transparent
              opacity={0.92}
              roughness={0.3}
              metalness={0.1}
            />
          ) : (
            <meshStandardMaterial
              color="#fed7aa"
              side={THREE.DoubleSide}
              transparent
              opacity={0.8}
            />
          )}
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 2.85, body.size * 3.0, 32]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#eab308'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.4, 0]} center distanceFactor={30}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-yellow-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-yellow-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🪐 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Titan */}
      <group ref={titanOrbitRef}>
        <group ref={titanGroupRef} position={[6.8, -0.6, 0]}>
          <mesh>
            <sphereGeometry args={[titanBody.size, 20, 20]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ==========================================
// REALISTIC PLUTO WITH NITROGEN HEART & CHARON
// ==========================================
const RealisticPluto: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const plutoGroupRef = useRef<THREE.Group>(null);
  const plutoMeshRef = useRef<THREE.Mesh>(null);
  const charonOrbitRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  useEffect(() => {
    if (plutoGroupRef.current) {
      registerCelestialObject('pluto', plutoGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('pluto');
    };
  }, []);

  useFrame((_, delta) => {
    if (plutoGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      const r = body.orbitalRadius;
      plutoGroupRef.current.position.x = Math.cos(orbitAngleRef.current) * r;
      // 17-degree orbital inclination
      plutoGroupRef.current.position.y = Math.sin(orbitAngleRef.current) * (r * 0.28);
      plutoGroupRef.current.position.z = Math.sin(orbitAngleRef.current) * r;
    }
    if (plutoMeshRef.current) {
      plutoMeshRef.current.rotation.y += (body.rotationSpeed || 0.008) * delta * 60;
    }
    if (charonOrbitRef.current) {
      charonOrbitRef.current.rotation.y += delta * 0.35;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group ref={plutoGroupRef} position={body.position}>
      <group
        rotation={[2.08, 0, 0]} // 119.5° extreme retrograde axial tilt
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Pluto Body with Tan/Terracotta Crust */}
        <mesh ref={plutoMeshRef}>
          <sphereGeometry args={[body.size, 36, 36]} />
          <meshStandardMaterial
            color="#d4a373"
            roughness={0.85}
            metalness={0.05}
            emissive={isSelected ? '#a16207' : '#000000'}
            emissiveIntensity={isSelected ? 0.35 : 0}
          />
        </mesh>

        {/* Sputnik Planitia "Heart of Pluto" Nitrogen Ice Feature */}
        <mesh position={[body.size * 0.55, -body.size * 0.1, body.size * 0.75]} rotation={[0.2, 0.4, 0]}>
          <circleGeometry args={[body.size * 0.42, 24]} />
          <meshStandardMaterial
            color="#fef3c7"
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Thin Atmospheric Blue Haze Rim */}
        <mesh>
          <sphereGeometry args={[body.size * 1.05, 24, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.4, body.size * 1.6, 32]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#f59e0b'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 0.9, 0]} center distanceFactor={26}>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-amber-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🤎 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Charon */}
      <group ref={charonOrbitRef}>
        <mesh position={[1.4, 0.15, 0]}>
          <sphereGeometry args={[0.21, 20, 20]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// ==========================================
// GENERIC ORBITING PLANET
// ==========================================
const StandardPlanet: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const meshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.atan2(body.position[2] || 0, body.position[0] || 1));

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (meshRef.current) {
      registerCelestialObject(body.id, meshRef.current);
    }
    return () => {
      unregisterCelestialObject(body.id);
    };
  }, [body.id]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (body.rotationSpeed) {
      meshRef.current.rotation.y += body.rotationSpeed * delta * 60;
    }
    if (body.orbitalRadius && body.orbitalSpeed) {
      orbitAngleRef.current += body.orbitalSpeed * delta * 1.5;
      meshRef.current.position.x = Math.cos(orbitAngleRef.current) * body.orbitalRadius;
      meshRef.current.position.z = Math.sin(orbitAngleRef.current) * body.orbitalRadius;
    }
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group
      ref={meshRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver();
      }}
      onPointerOut={() => onPointerOut()}
    >
      <mesh>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || (isSelected ? '#38bdf8' : '#000000')}
          emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.05}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.35, body.size * 1.5, 32]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {(isHovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 1.0, 0]} center distanceFactor={28}>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-500/60 shadow-lg backdrop-blur-md text-[11px] font-semibold text-sky-200 whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5 animate-fadeIn">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{displayName}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Orbital Path Visualizer
const OrbitLine: React.FC<{ radius: number; color?: string }> = ({ radius, color = '#334155' }) => {
  const points = useMemo(() => {
    const pts = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 }))} />
  );
};

// Asteroid Belt Particles
const AsteroidBelt: React.FC = () => {
  const count = 450;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const asteroidData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = 24.5 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.8;
      const scale = 0.08 + Math.random() * 0.16;
      const speed = 0.01 + Math.random() * 0.005;
      data.push({ radius, angle, y, scale, speed });
    }
    return data;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Performance LOD: freeze asteroid updates when in deep space
    if (state.camera.position.length() > 2500) return;

    for (let i = 0; i < count; i++) {
      const a = asteroidData[i];
      a.angle += a.speed * delta * 1.2;
      dummy.position.set(Math.cos(a.angle) * a.radius, a.y, Math.sin(a.angle) * a.radius);
      dummy.rotation.x += delta * 0.5;
      dummy.rotation.y += delta * 0.8;
      dummy.scale.set(a.scale, a.scale, a.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#78716c" roughness={0.9} />
    </instancedMesh>
  );
};

// ==========================================
// MAIN SOLAR SYSTEM SCENE
// ==========================================
export const SolarSystemScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const [hoveredBodyId, setHoveredBodyId] = React.useState<string | null>(null);

  const sunRef = useRef<THREE.Mesh>(null);
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const [sunTexture, setSunTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setSunTexture(getSunTexture());
  }, []);

  // Register Sun with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (sunGroupRef.current) {
      registerCelestialObject('sun', sunGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('sun');
    };
  }, []);

  useFrame((_, delta) => {
    if (sunRef.current) sunRef.current.rotation.y += delta * 0.04;
    if (sunCoronaRef.current) {
      sunCoronaRef.current.rotation.z -= delta * 0.07;
      const s = 1.0 + Math.sin(Date.now() * 0.003) * 0.05;
      sunCoronaRef.current.scale.set(s, s, s);
    }
  });

  const sunBody = CELESTIAL_BODIES.sun;

  const isHighlighted = (body: CelestialBody) =>
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  return (
    <group>
      {/* Central Solar Illuminator */}
      <pointLight position={[0, 0, 0]} intensity={5.0} distance={180} decay={1.1} color="#fffbeb" />

      {/* Sun Photosphere & Animated Corona */}
      <group
        ref={sunGroupRef}
        position={[0, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          setSelectedCosmicBodyId('sun');
        }}
        onPointerOver={() => setHoveredBodyId('sun')}
        onPointerOut={() => setHoveredBodyId(null)}
      >
        <mesh ref={sunRef}>
          <sphereGeometry args={[sunBody.size, 48, 48]} />
          {sunTexture ? (
            <meshBasicMaterial map={sunTexture} />
          ) : (
            <meshBasicMaterial color="#fbbf24" />
          )}
        </mesh>

        {/* Pulsating Corona */}
        <mesh ref={sunCoronaRef}>
          <sphereGeometry args={[sunBody.size * 1.18, 32, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} side={THREE.BackSide} />
        </mesh>

        {(hoveredBodyId === 'sun' || selectedCosmicBodyId === 'sun') && (
          <Html position={[0, sunBody.size + 1.4, 0]} center distanceFactor={30}>
            <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 shadow-xl text-xs font-bold text-amber-200 whitespace-nowrap">
              ☀️ {language === 'ar' ? sunBody.nameAr : sunBody.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Planetary Orbit Guide Rings */}
      <OrbitLine radius={7.5} />
      <OrbitLine radius={11.0} />
      <OrbitLine radius={15.5} color="#0284c7" />
      <OrbitLine radius={21.0} color="#b91c1c" />
      <OrbitLine radius={26.5} color="#78716c" />
      <OrbitLine radius={33.0} color="#b45309" />
      <OrbitLine radius={42.0} color="#ca8a04" />
      <OrbitLine radius={51.0} color="#0891b2" />
      <OrbitLine radius={58.0} color="#2563eb" />
      <OrbitLine radius={64.0} color="#a16207" />

      {/* Main Asteroid Belt & Meteor Showers */}
      <AsteroidBelt />
      <MeteorShowerEffect active={true} />

      {/* Realistic Asteroids with Authentic Topologies */}
      {CELESTIAL_BODIES.ceres && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.ceres}
          isSelected={selectedCosmicBodyId === 'ceres'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.ceres)}
          onSelect={() => setSelectedCosmicBodyId('ceres')}
          language={language}
          icon="☄️"
        />
      )}
      {CELESTIAL_BODIES.bennu_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.bennu_asteroid}
          isSelected={selectedCosmicBodyId === 'bennu_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.bennu_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('bennu_asteroid')}
          language={language}
          icon="🪨"
        />
      )}
      {CELESTIAL_BODIES.psyche_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.psyche_asteroid}
          isSelected={selectedCosmicBodyId === 'psyche_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.psyche_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('psyche_asteroid')}
          language={language}
          icon="🪙"
        />
      )}
      {CELESTIAL_BODIES.apophis_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.apophis_asteroid}
          isSelected={selectedCosmicBodyId === 'apophis_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.apophis_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('apophis_asteroid')}
          language={language}
          icon="⚠️"
        />
      )}

      {/* Realistic Comets with Sublimating Coma & Dual Tails */}
      {CELESTIAL_BODIES.halley_comet && (
        <RealisticComet
          body={CELESTIAL_BODIES.halley_comet}
          isSelected={selectedCosmicBodyId === 'halley_comet'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.halley_comet)}
          onSelect={() => setSelectedCosmicBodyId('halley_comet')}
          language={language}
          icon="☄️"
        />
      )}
      {CELESTIAL_BODIES.oumuamua && (
        <RealisticComet
          body={CELESTIAL_BODIES.oumuamua}
          isSelected={selectedCosmicBodyId === 'oumuamua'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.oumuamua)}
          onSelect={() => setSelectedCosmicBodyId('oumuamua')}
          language={language}
          icon="🛸"
        />
      )}


      {/* Mercury & Venus */}
      <StandardPlanet
        body={CELESTIAL_BODIES.mercury}
        isSelected={selectedCosmicBodyId === 'mercury'}
        isHovered={hoveredBodyId === 'mercury'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.mercury)}
        onClick={() => setSelectedCosmicBodyId('mercury')}
        onPointerOver={() => setHoveredBodyId('mercury')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />
      <StandardPlanet
        body={CELESTIAL_BODIES.venus}
        isSelected={selectedCosmicBodyId === 'venus'}
        isHovered={hoveredBodyId === 'venus'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.venus)}
        onClick={() => setSelectedCosmicBodyId('venus')}
        onPointerOver={() => setHoveredBodyId('venus')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Photorealistic Earth with Rotating Clouds & Moon */}
      <RealisticEarth
        body={CELESTIAL_BODIES.earth}
        isSelected={selectedCosmicBodyId === 'earth'}
        isHovered={hoveredBodyId === 'earth'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.earth)}
        onClick={() => setSelectedCosmicBodyId('earth')}
        onPointerOver={() => setHoveredBodyId('earth')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Mars with Syrtis Major & Phobos */}
      <RealisticMars
        body={CELESTIAL_BODIES.mars}
        isSelected={selectedCosmicBodyId === 'mars'}
        isHovered={hoveredBodyId === 'mars'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.mars)}
        onClick={() => setSelectedCosmicBodyId('mars')}
        onPointerOver={() => setHoveredBodyId('mars')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Ceres Dwarf Planet */}
      <StandardPlanet
        body={CELESTIAL_BODIES.ceres}
        isSelected={selectedCosmicBodyId === 'ceres'}
        isHovered={hoveredBodyId === 'ceres'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.ceres)}
        onClick={() => setSelectedCosmicBodyId('ceres')}
        onPointerOver={() => setHoveredBodyId('ceres')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Jupiter with Great Red Spot & Europa */}
      <RealisticJupiter
        body={CELESTIAL_BODIES.jupiter}
        isSelected={selectedCosmicBodyId === 'jupiter'}
        isHovered={hoveredBodyId === 'jupiter'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.jupiter)}
        onClick={() => setSelectedCosmicBodyId('jupiter')}
        onPointerOver={() => setHoveredBodyId('jupiter')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Saturn with Cassini Division Rings & Titan */}
      <RealisticSaturn
        body={CELESTIAL_BODIES.saturn}
        isSelected={selectedCosmicBodyId === 'saturn'}
        isHovered={hoveredBodyId === 'saturn'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.saturn)}
        onClick={() => setSelectedCosmicBodyId('saturn')}
        onPointerOver={() => setHoveredBodyId('saturn')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Uranus & Neptune Ice Giants */}
      <StandardPlanet
        body={CELESTIAL_BODIES.uranus}
        isSelected={selectedCosmicBodyId === 'uranus'}
        isHovered={hoveredBodyId === 'uranus'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.uranus)}
        onClick={() => setSelectedCosmicBodyId('uranus')}
        onPointerOver={() => setHoveredBodyId('uranus')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />
      <StandardPlanet
        body={CELESTIAL_BODIES.neptune}
        isSelected={selectedCosmicBodyId === 'neptune'}
        isHovered={hoveredBodyId === 'neptune'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.neptune)}
        onClick={() => setSelectedCosmicBodyId('neptune')}
        onPointerOver={() => setHoveredBodyId('neptune')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Pluto Dwarf Planet & Charon */}
      {CELESTIAL_BODIES.pluto && (
        <RealisticPluto
          body={CELESTIAL_BODIES.pluto}
          isSelected={selectedCosmicBodyId === 'pluto'}
          isHovered={hoveredBodyId === 'pluto'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.pluto)}
          onClick={() => setSelectedCosmicBodyId('pluto')}
          onPointerOver={() => setHoveredBodyId('pluto')}
          onPointerOut={() => setHoveredBodyId(null)}
          language={language}
        />
      )}

      {/* Interstellar Trajectories, Gliese 445 / Ross 248 Encounter Beacons & Proxima Pointer */}
      <InterstellarTrajectories
        language={language}
        onSelectBody={setSelectedCosmicBodyId}
      />

      {/* Ultra-Realistic Deep Space Probes & Satellites */}
      {CELESTIAL_BODIES.voyager_1 && (
        <RealisticVoyagerProbe
          body={CELESTIAL_BODIES.voyager_1}
          language={language}
          isSelected={selectedCosmicBodyId === 'voyager_1'}
          onSelect={() => setSelectedCosmicBodyId('voyager_1')}
        />
      )}

      {CELESTIAL_BODIES.voyager_2 && (
        <RealisticVoyagerProbe
          body={CELESTIAL_BODIES.voyager_2}
          language={language}
          isSelected={selectedCosmicBodyId === 'voyager_2'}
          onSelect={() => setSelectedCosmicBodyId('voyager_2')}
        />
      )}

      <RealisticJWST
        body={CELESTIAL_BODIES.jwst}
        language={language}
        isSelected={selectedCosmicBodyId === 'jwst'}
        onSelect={() => setSelectedCosmicBodyId('jwst')}
      />

      {CELESTIAL_BODIES.hubble && (
        <RealisticHubble
          body={CELESTIAL_BODIES.hubble}
          language={language}
          isSelected={selectedCosmicBodyId === 'hubble'}
          onSelect={() => setSelectedCosmicBodyId('hubble')}
        />
      )}
    </group>
  );
};
