'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticBlackHole } from '../blackhole/RealisticBlackHole';
import { RealisticPulsar } from '../pulsar/RealisticPulsar';

// ----------------------------------------------------
// 1. M31* Core Black Hole with P1 & P2 Double Nucleus
// ----------------------------------------------------
export const M31CoreBlackHoleSystem: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const p1DiskRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (p1DiskRef.current) {
      p1DiskRef.current.rotation.z = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group position={body.position}>
      {/* Primary M31* Realistic Supermassive Black Hole */}
      <RealisticBlackHole
        body={body}
        shadowRadius={body.size * 0.42}
        innerDiskRadius={body.size * 0.48}
        outerDiskRadius={body.size * 1.45}
        colorCore="#ffedd5"
        colorMid="#f59e0b"
        colorOuter="#451a03"
        accretionTilt={[-Math.PI / 4, Math.PI / 5, 0]}
        spinSpeed={1.1}
        dopplerStrength={1.25}
        hasLensingHalo={true}
        hasJet={false}
        isSelected={isSelected}
        onSelect={onSelect}
        language={language}
      />

      {/* Hubble P1 Stellar Cluster: Eccentric Keplarian disk of old stars orbiting 5 ly away */}
      <group ref={p1DiskRef} position={[body.size * 0.55, body.size * 0.15, 0]}>
        <mesh>
          <sphereGeometry args={[body.size * 0.22, 16, 16]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.65} />
        </mesh>
        <points>
          <sphereGeometry args={[body.size * 0.35, 12, 12]} />
          <pointsMaterial size={body.size * 0.02} color="#fef08a" transparent opacity={0.5} />
        </points>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 2. Hubble's Variable V1 (M31-V1 Pulsating Cepheid Supergiant)
// ----------------------------------------------------
export const HubbleV1Cepheid: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Cepheid period-luminosity pulsation simulation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Simulate asymmetric 31.4-day Cepheid light curve (rapid rise, slow decline)
    const phase = (t * 0.8) % (Math.PI * 2);
    const pulsation = Math.sin(phase) + 0.3 * Math.sin(phase * 2.0);
    const scaleFactor = 1.0 + pulsation * 0.08;

    if (coreRef.current) {
      coreRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      coreRef.current.rotation.y = t * 0.04;
    }
    if (coronaRef.current) {
      const coronaScale = 1.25 + pulsation * 0.12;
      coronaRef.current.scale.set(coronaScale, coronaScale, coronaScale);
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
      <pointLight color="#fef08a" intensity={4.5} distance={body.size * 5} />

      {/* Pulsating F-Type Supergiant Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#eab308"
          emissiveIntensity={1.3}
          roughness={0.3}
        />
      </mesh>

      {/* Radiant Stellar Corona */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[body.size * 1.3, 24, 24]} />
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Interactive Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 1.55, 36]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.3, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-yellow-400 text-xs font-black text-yellow-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>✨</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
              31.4d Cepheid
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 3. Mayall II (G1 - Massive Globular Cluster & IMBH)
// ----------------------------------------------------
export const MayallIIGlobularCluster: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Generate 3,500 densely packed ancient stars according to King's profile
  const [positions, colors] = React.useMemo(() => {
    const count = 3500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // High central concentration King's profile
      const r = Math.pow(Math.random(), 3.2) * body.size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const c = new THREE.Color();
      if (Math.random() < 0.7) {
        c.set('#fef08a'); // Warm old Population II stars
      } else if (Math.random() < 0.9) {
        c.set('#f97316'); // Red giants
      } else {
        c.set('#60a5fa'); // Blue stragglers
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

  useFrame((_, delta) => {
    if (rootRef.current) {
      rootRef.current.rotation.y += delta * 0.004;
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
      <pointLight color="#fef08a" intensity={3.5} distance={body.size * 3} />

      {/* Central Intermediate-Mass Black Hole Accretion Core */}
      <mesh>
        <sphereGeometry args={[body.size * 0.12, 16, 16]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.9} />
      </mesh>

      {/* 300,000 Ancient Stars Point Cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={body.size * 0.025}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.1, body.size * 1.25, 36]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.2, 0]} center distanceFactor={body.size * 4.5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-amber-400 text-xs font-black text-amber-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>⭐</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              300k Stars (1.5M M☉)
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 4. PA-99-N2 Extragalactic Exoplanet System in Andromeda
// ----------------------------------------------------
export const PA99N2ExoplanetSystem: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, onSelect, language }) => {
  const systemRef = useRef<THREE.Group>(null);
  const planetOrbitRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (systemRef.current) registerCelestialObject(star.id, systemRef.current);
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => {
      unregisterCelestialObject(star.id);
      unregisterCelestialObject(planet.id);
    };
  }, [star.id, planet.id]);

  useFrame((_, delta) => {
    if (planetOrbitRef.current) {
      planetOrbitRef.current.rotation.y += delta * (planet.orbitalSpeed || 0.04);
    }
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += delta * (planet.rotationSpeed || 0.02);
    }
  });

  const isPlanetSelected = selectedId === planet.id;
  const isStarSelected = selectedId === star.id;

  return (
    <group ref={systemRef} position={star.position}>
      {/* Red Giant Host Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setHoveredId(star.id)}
        onPointerOut={() => setHoveredId(null)}
      >
        <pointLight color="#f87171" intensity={3.5} distance={star.size * 6} />
        <mesh>
          <sphereGeometry args={[star.size, 32, 32]} />
          <meshStandardMaterial
            color="#f87171"
            emissive="#ef4444"
            emissiveIntensity={1.2}
            roughness={0.4}
          />
        </mesh>
        {(hoveredId === star.id || isStarSelected) && (
          <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-red-400 text-xs font-bold text-red-200 whitespace-nowrap shadow-xl">
              ☀️ {language === 'ar' ? star.nameAr : star.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Orbital Ring Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitalRadius! - 0.5, planet.orbitalRadius! + 0.5, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting Planet Container */}
      <group ref={planetOrbitRef}>
        <group position={[planet.orbitalRadius!, 0, 0]}>
          <mesh
            ref={planetMeshRef}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta && e.delta > 5) return;
              e.stopPropagation();
              onSelect(planet.id);
            }}
            onPointerOver={() => setHoveredId(planet.id)}
            onPointerOut={() => setHoveredId(null)}
          >
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>

          {/* Gravitational Microlensing Light Ring Indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.3, planet.size * 1.45, 32]} />
            <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>

          {(hoveredId === planet.id || isPlanetSelected) && (
            <Html position={[0, planet.size * 1.5, 0]} center distanceFactor={planet.size * 6}>
              <div className="px-3.5 py-1.5 rounded-full bg-blue-950/95 border-2 border-cyan-400 text-xs font-black text-cyan-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <span>🪐</span>
                <span>{language === 'ar' ? planet.nameAr : planet.nameEn}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  6.34 M_Jup
                </span>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 5. M33 X-7 Black Hole & O-Supergiant Binary System
// ----------------------------------------------------
export const M33X7BinarySystem: React.FC<{
  star: CelestialBody;
  blackHole: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, blackHole, selectedId, onSelect, language }) => {
  const binaryRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (binaryRef.current) {
      registerCelestialObject(star.id, binaryRef.current);
      registerCelestialObject(blackHole.id, binaryRef.current);
    }
    return () => {
      unregisterCelestialObject(star.id);
      unregisterCelestialObject(blackHole.id);
    };
  }, [star.id, blackHole.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (binaryRef.current) {
      binaryRef.current.rotation.y = t * 0.15;
    }
    if (streamRef.current) {
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.1;
      streamRef.current.scale.set(pulse, 1.0, pulse);
    }
  });

  return (
    <group position={star.position}>
      <group ref={binaryRef}>
        {/* Roche-Lobe Distorted 70 M_Sun Blue O-Supergiant */}
        <group
          position={[-blackHole.orbitalRadius! * 0.35, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(star.id);
          }}
          onPointerOver={() => setHoveredId(star.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <pointLight color="#60a5fa" intensity={6.0} distance={star.size * 5} />
          {/* Egg/Teardrop distorted geometry */}
          <mesh scale={[1.35, 1.0, 1.0]}>
            <sphereGeometry args={[star.size, 32, 32]} />
            <meshStandardMaterial
              color="#93c5fd"
              emissive="#3b82f6"
              emissiveIntensity={1.4}
              roughness={0.25}
            />
          </mesh>
          {(hoveredId === star.id || selectedId === star.id) && (
            <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
              <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
                ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (70 M☉)
              </div>
            </Html>
          )}
        </group>

        {/* Mass-Transfer Accretion Stream */}
        <mesh ref={streamRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[star.size * 0.12, star.size * 0.25, blackHole.orbitalRadius!, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>

        {/* 15.65 M_Sun Black Hole with Energetic Accretion Disk */}
        <group
          position={[blackHole.orbitalRadius! * 0.65, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(blackHole.id);
          }}
          onPointerOver={() => setHoveredId(blackHole.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          {/* Singularity Shadow */}
          <mesh>
            <sphereGeometry args={[blackHole.size * 0.35, 24, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Accretion Disk */}
          <mesh rotation={[-Math.PI / 3, 0, 0]}>
            <ringGeometry args={[blackHole.size * 0.45, blackHole.size * 1.25, 36]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
          {(hoveredId === blackHole.id || selectedId === blackHole.id) && (
            <Html position={[0, blackHole.size * 1.2, 0]} center distanceFactor={blackHole.size * 5}>
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-xs font-black text-cyan-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <span>🕳️</span>
                <span>{language === 'ar' ? blackHole.nameAr : blackHole.nameEn}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  15.65 M☉
                </span>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 6. S Doradus (Prototype LBV Hypergiant with Eruption Shells)
// ----------------------------------------------------
export const SDoradusHypergiant: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const shellRef1 = useRef<THREE.Mesh>(null);
  const shellRef2 = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shellRef1.current) {
      shellRef1.current.rotation.y = t * 0.05;
      const s1 = 1.35 + Math.sin(t * 1.5) * 0.05;
      shellRef1.current.scale.set(s1, s1, s1);
    }
    if (shellRef2.current) {
      shellRef2.current.rotation.z = -t * 0.03;
      const s2 = 1.8 + Math.cos(t * 1.2) * 0.08;
      shellRef2.current.scale.set(s2, s2, s2);
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
      <pointLight color="#93c5fd" intensity={5.0} distance={body.size * 6} />

      {/* Pulsating Hypergiant Core */}
      <mesh>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color="#93c5fd"
          emissive="#3b82f6"
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Circumstellar Eruption Shell */}
      <mesh ref={shellRef1}>
        <sphereGeometry args={[body.size * 1.35, 24, 24]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} side={THREE.BackSide} wireframe />
      </mesh>

      {/* Outer Historic Great Eruption Dust Envelope */}
      <mesh ref={shellRef2}>
        <sphereGeometry args={[body.size * 1.8, 20, 20]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.18} side={THREE.BackSide} />
      </mesh>

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 1.55, 36]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.4, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-blue-400 text-xs font-black text-blue-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>🌟</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
              1M L☉ LBV
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 7. SMC X-1 High-Mass X-Ray Pulsar Binary
// ----------------------------------------------------
export const SMCX1PulsarSystem: React.FC<{
  star: CelestialBody;
  pulsar: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, pulsar, selectedId, onSelect, language }) => {
  const binaryRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (binaryRef.current) {
      registerCelestialObject(star.id, binaryRef.current);
      registerCelestialObject(pulsar.id, binaryRef.current);
    }
    return () => {
      unregisterCelestialObject(star.id);
      unregisterCelestialObject(pulsar.id);
    };
  }, [star.id, pulsar.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (binaryRef.current) {
      binaryRef.current.rotation.y = t * 0.18;
    }
  });

  return (
    <group position={star.position}>
      <group ref={binaryRef}>
        {/* Sk 160 B0 Ib Supergiant Donor */}
        <group
          position={[-pulsar.orbitalRadius! * 0.4, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(star.id);
          }}
          onPointerOver={() => setHoveredId(star.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <pointLight color="#93c5fd" intensity={5.0} distance={star.size * 5} />
          <mesh>
            <sphereGeometry args={[star.size, 32, 32]} />
            <meshStandardMaterial
              color="#93c5fd"
              emissive="#3b82f6"
              emissiveIntensity={1.2}
              roughness={0.3}
            />
          </mesh>
          {(hoveredId === star.id || selectedId === star.id) && (
            <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
              <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
                ⭐ {language === 'ar' ? star.nameAr : star.nameEn}
              </div>
            </Html>
          )}
        </group>

        {/* Mass transfer stream */}
        <mesh ref={streamRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[star.size * 0.08, star.size * 0.2, pulsar.orbitalRadius!, 12]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
        </mesh>

        {/* 0.71-second Pulsar */}
        <group position={[pulsar.orbitalRadius! * 0.6, 0, 0]}>
          <RealisticPulsar
            body={pulsar}
            beamColor="#22d3ee"
            beamLength={pulsar.size * 4.5}
            beamRadius={pulsar.size * 0.35}
            spinFrequency={3.5}
            magneticTilt={0.45}
            isSelected={selectedId === pulsar.id}
            onSelect={() => onSelect(pulsar.id)}
            language={language}
          />
        </group>
      </group>
    </group>
  );
};
