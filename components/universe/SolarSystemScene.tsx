'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

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
        onClick={(e) => {
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
        <group position={[3.2, 0.4, 0]}>
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
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

  const [marsTexture, setMarsTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setMarsTexture(getMarsTexture());
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
        onClick={(e) => {
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
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

  const [jupTexture, setJupTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setJupTexture(getJupiterTexture());
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
        onClick={(e) => {
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
        <mesh position={[5.2, 0.4, 0]}>
          <sphereGeometry args={[europaBody.size, 20, 20]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
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
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

  const [ringTexture, setRingTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setRingTexture(getSaturnRingTexture());
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
        onClick={(e) => {
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
        <mesh position={[6.8, -0.6, 0]}>
          <sphereGeometry args={[titanBody.size, 20, 20]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.7} />
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
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

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
      onClick={(e) => {
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

  useFrame((_, delta) => {
    if (!meshRef.current) return;
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
// HIGH-DETAIL VOYAGER 1 MODEL
// ==========================================
const DetailedVoyager1: React.FC<{
  language: 'en' | 'ar';
  isSelected: boolean;
  onSelect: () => void;
}> = ({ language, isSelected, onSelect }) => {
  const probeRef = useRef<THREE.Group>(null);
  const body = CELESTIAL_BODIES.voyager_1;

  useFrame((_, delta) => {
    if (!probeRef.current) return;
    probeRef.current.rotation.y += delta * 0.08;
    probeRef.current.rotation.x += delta * 0.04;
  });

  return (
    <group
      ref={probeRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* 3.7m Parabolic High-Gain Dish */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 0.25, 0.45, 32, 1, true]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Feed Horn at Subreflector Focus */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Golden Record on probe flank */}
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.08} emissive="#ca8a04" emissiveIntensity={0.35} />
      </mesh>
      {/* RTG Nuclear Power Unit */}
      <mesh position={[1.1, -0.7, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.22, 0.22, 1.1, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.4} />
      </mesh>
      {/* Magnetometer Boom extending 13m into interstellar void */}
      <mesh position={[-1.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.035, 0.035, 2.8, 8]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Label */}
      <Html position={[0, 2.0, 0]} center distanceFactor={28}>
        <div className={`px-2.5 py-1 rounded-full bg-amber-950/90 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-amber-500/50'} text-[11px] font-bold text-amber-300 whitespace-nowrap shadow-xl flex items-center gap-1.5`}>
          <span>🛰️</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn} (Interstellar)</span>
        </div>
      </Html>
    </group>
  );
};

// ==========================================
// HIGH-DETAIL JWST MODEL
// ==========================================
const DetailedJWST: React.FC<{
  language: 'en' | 'ar';
  isSelected: boolean;
  onSelect: () => void;
}> = ({ language, isSelected, onSelect }) => {
  const jwstRef = useRef<THREE.Group>(null);
  const body = CELESTIAL_BODIES.jwst;

  useFrame((_, delta) => {
    if (!jwstRef.current) return;
    jwstRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group
      ref={jwstRef}
      position={body.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* 5-Layer Silver Sunshield Diamond Kite */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* 18 Beryllium-Gold Hexagonal Primary Mirror Array */}
      <mesh position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.85, 6]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.98} roughness={0.03} emissive="#d97706" emissiveIntensity={0.45} />
      </mesh>
      {/* Secondary Mirror Assembly Tripod */}
      <mesh position={[0, 1.1, 0.7]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#334155" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, 0.35]} rotation={[Math.PI / 5, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.9, 0]} center distanceFactor={28}>
        <div className={`px-2.5 py-1 rounded-full bg-indigo-950/90 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-indigo-500/50'} text-[11px] font-bold text-indigo-300 whitespace-nowrap shadow-xl flex items-center gap-1.5`}>
          <span>🔭</span>
          <span>{language === 'ar' ? body.nameAr : body.nameEn} (L2 Orbit)</span>
        </div>
      </Html>
    </group>
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
  const [sunTexture, setSunTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setSunTexture(getSunTexture());
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
        position={[0, 0, 0]}
        onClick={(e) => {
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

      {/* Main Asteroid Belt */}
      <AsteroidBelt />

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

      {/* High-Detail Probes */}
      <DetailedVoyager1
        language={language}
        isSelected={selectedCosmicBodyId === 'voyager_1'}
        onSelect={() => setSelectedCosmicBodyId('voyager_1')}
      />

      <DetailedJWST
        language={language}
        isSelected={selectedCosmicBodyId === 'jwst'}
        onSelect={() => setSelectedCosmicBodyId('jwst')}
      />
    </group>
  );
};
