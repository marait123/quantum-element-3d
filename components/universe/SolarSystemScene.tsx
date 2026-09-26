'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';

interface PlanetProps {
  body: CelestialBody;
  isHovered: boolean;
  isSelected: boolean;
  isElementHighlighted: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
  language: 'en' | 'ar';
}

const PlanetMesh: React.FC<PlanetProps> = ({
  body,
  isHovered,
  isSelected,
  isElementHighlighted,
  onPointerOver,
  onPointerOut,
  onClick,
  language,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const orbitAngleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Self-rotation
    if (body.rotationSpeed) {
      meshRef.current.rotation.y += body.rotationSpeed * delta * 60;
    }

    // Orbital revolution
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
      {/* Planet Sphere */}
      <mesh>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color={body.color}
          emissive={body.emissiveColor || (isSelected ? '#38bdf8' : '#000000')}
          emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.4 : 0.05}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Saturn's Rings */}
      {body.id === 'saturn' && (
        <mesh rotation={[-Math.PI / 3, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 2.5, 48]} />
          <meshStandardMaterial
            color="#fed7aa"
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
            roughness={0.4}
          />
        </mesh>
      )}

      {/* Selection / Highlight Pulse Ring */}
      {(isSelected || isElementHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.3, body.size * 1.45, 32]} />
          <meshBasicMaterial
            color={isElementHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Label billboard */}
      {(isHovered || isSelected || isElementHighlighted) && (
        <Html position={[0, body.size + 0.8, 0]} center distanceFactor={28}>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-500/60 shadow-lg backdrop-blur-md text-[11px] font-semibold text-sky-200 whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5 animate-fadeIn">
            {isElementHighlighted && <span className="text-amber-400">⚡</span>}
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

// Voyager 1 3D Representation
const VoyagerProbe: React.FC<{
  language: 'en' | 'ar';
  isSelected: boolean;
  onSelect: () => void;
}> = ({ language, isSelected, onSelect }) => {
  const probeRef = useRef<THREE.Group>(null);
  const body = CELESTIAL_BODIES.voyager_1;

  useFrame((_, delta) => {
    if (!probeRef.current) return;
    probeRef.current.rotation.y += delta * 0.1;
    probeRef.current.rotation.x += delta * 0.05;
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
      {/* High-Gain White Dish */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 0.2, 0.4, 32, 1, true]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Golden Record on underside */}
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.1} emissive="#ca8a04" emissiveIntensity={0.3} />
      </mesh>
      {/* RTG Cylinder */}
      <mesh position={[0.8, -0.6, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.2, 0.2, 0.9, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Magnetometer Boom */}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.8, 0]} center distanceFactor={28}>
        <div className={`px-2 py-0.5 rounded-full bg-amber-950/80 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-amber-500/50'} text-[11px] font-bold text-amber-300 whitespace-nowrap shadow-md`}>
          🛰️ {language === 'ar' ? body.nameAr : body.nameEn}
        </div>
      </Html>
    </group>
  );
};

// James Webb Space Telescope 3D Representation
const JWSTProbe: React.FC<{
  language: 'en' | 'ar';
  isSelected: boolean;
  onSelect: () => void;
}> = ({ language, isSelected, onSelect }) => {
  const jwstRef = useRef<THREE.Group>(null);
  const body = CELESTIAL_BODIES.jwst;

  useFrame((_, delta) => {
    if (!jwstRef.current) return;
    jwstRef.current.rotation.y += delta * 0.15;
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
      {/* Diamond Sunshield layers */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[2.0, 1.3]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* 18 Gold Hexagonal Mirror Proxy */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.7, 6]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.05} emissive="#d97706" emissiveIntensity={0.4} />
      </mesh>
      {/* Secondary mirror support struts */}
      <mesh position={[0, 0.9, 0.6]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.6, 0]} center distanceFactor={28}>
        <div className={`px-2 py-0.5 rounded-full bg-indigo-950/80 border ${isSelected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-indigo-500/50'} text-[11px] font-bold text-indigo-300 whitespace-nowrap shadow-md`}>
          🔭 {language === 'ar' ? body.nameAr : body.nameEn}
        </div>
      </Html>
    </group>
  );
};

export const SolarSystemScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const [hoveredBodyId, setHoveredBodyId] = React.useState<string | null>(null);

  const sunRef = useRef<THREE.Mesh>(null);
  const sunCoronaRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (sunRef.current) sunRef.current.rotation.y += delta * 0.05;
    if (sunCoronaRef.current) {
      sunCoronaRef.current.rotation.z -= delta * 0.08;
      const s = 1.0 + Math.sin(Date.now() * 0.003) * 0.04;
      sunCoronaRef.current.scale.set(s, s, s);
    }
  });

  const sunBody = CELESTIAL_BODIES.sun;

  // List of orbital planets & moons to render
  const solarBodies: CelestialBody[] = [
    CELESTIAL_BODIES.mercury,
    CELESTIAL_BODIES.venus,
    CELESTIAL_BODIES.earth,
    CELESTIAL_BODIES.moon,
    CELESTIAL_BODIES.mars,
    CELESTIAL_BODIES.phobos,
    CELESTIAL_BODIES.ceres,
    CELESTIAL_BODIES.jupiter,
    CELESTIAL_BODIES.europa,
    CELESTIAL_BODIES.saturn,
    CELESTIAL_BODIES.titan,
    CELESTIAL_BODIES.uranus,
    CELESTIAL_BODIES.neptune,
  ];

  return (
    <group>
      {/* Central Omnidirectional Solar Illuminator */}
      <pointLight position={[0, 0, 0]} intensity={4.5} distance={150} decay={1.2} color="#fffbeb" />

      {/* The Sun */}
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
          <meshBasicMaterial color="#fbbf24" />
        </mesh>

        {/* Pulsating Solar Corona */}
        <mesh ref={sunCoronaRef}>
          <sphereGeometry args={[sunBody.size * 1.15, 32, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} side={THREE.BackSide} />
        </mesh>

        {/* Sun Tag */}
        {(hoveredBodyId === 'sun' || selectedCosmicBodyId === 'sun') && (
          <Html position={[0, sunBody.size + 1.2, 0]} center distanceFactor={30}>
            <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 shadow-xl text-xs font-bold text-amber-200 whitespace-nowrap">
              ☀️ {language === 'ar' ? sunBody.nameAr : sunBody.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Orbital Circles for Planets */}
      <OrbitLine radius={7.5} />
      <OrbitLine radius={11.0} />
      <OrbitLine radius={15.5} color="#0284c7" />
      <OrbitLine radius={21.0} color="#b91c1c" />
      <OrbitLine radius={26.5} color="#78716c" />
      <OrbitLine radius={33.0} color="#b45309" />
      <OrbitLine radius={42.0} color="#ca8a04" />
      <OrbitLine radius={51.0} color="#0891b2" />
      <OrbitLine radius={58.0} color="#2563eb" />

      {/* Main Asteroid Belt Particles */}
      <AsteroidBelt />

      {/* Planets and Moons */}
      {solarBodies.map((body) => {
        const isElementHighlighted =
          highlightedCosmicElementNum !== null &&
          body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

        return (
          <PlanetMesh
            key={body.id}
            body={body}
            isHovered={hoveredBodyId === body.id}
            isSelected={selectedCosmicBodyId === body.id}
            isElementHighlighted={Boolean(isElementHighlighted)}
            onPointerOver={() => setHoveredBodyId(body.id)}
            onPointerOut={() => setHoveredBodyId(null)}
            onClick={() => setSelectedCosmicBodyId(body.id)}
            language={language}
          />
        );
      })}

      {/* Humanity's Space Explorers */}
      <VoyagerProbe
        language={language}
        isSelected={selectedCosmicBodyId === 'voyager_1'}
        onSelect={() => setSelectedCosmicBodyId('voyager_1')}
      />

      <JWSTProbe
        language={language}
        isSelected={selectedCosmicBodyId === 'jwst'}
        onSelect={() => setSelectedCosmicBodyId('jwst')}
      />
    </group>
  );
};
