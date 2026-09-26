'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES } from '@/data/universeData';

// Large Scale Cosmic Web Filaments (Dark matter & galaxy scaffolding)
const FilamentaryWeb: React.FC = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);

  const [linePositions, nodePositions, nodeColors] = useMemo(() => {
    const numNodes = 350;
    const nodeCoords: THREE.Vector3[] = [];

    // Distribute nodes randomly inside a sphere, excluding the Boötes void region
    for (let i = 0; i < numNodes; i++) {
      const radius = 5 + Math.random() * 32;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const v = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Check void exclusion
      const voidCenter = new THREE.Vector3(35, 25, -30);
      if (v.distanceTo(voidCenter) > 12) {
        nodeCoords.push(v);
      }
    }

    // Connect close neighbors with filament lines
    const linePts: number[] = [];
    for (let i = 0; i < nodeCoords.length; i++) {
      for (let j = i + 1; j < nodeCoords.length; j++) {
        const dist = nodeCoords[i].distanceTo(nodeCoords[j]);
        if (dist < 8.5) {
          linePts.push(nodeCoords[i].x, nodeCoords[i].y, nodeCoords[i].z);
          linePts.push(nodeCoords[j].x, nodeCoords[j].y, nodeCoords[j].z);
        }
      }
    }

    // Node point arrays
    const nPos = new Float32Array(nodeCoords.length * 3);
    const nCol = new Float32Array(nodeCoords.length * 3);
    const brightCyan = new THREE.Color('#38bdf8');
    const amberCore = new THREE.Color('#fbbf24');

    for (let i = 0; i < nodeCoords.length; i++) {
      const i3 = i * 3;
      nPos[i3] = nodeCoords[i].x;
      nPos[i3 + 1] = nodeCoords[i].y;
      nPos[i3 + 2] = nodeCoords[i].z;

      const c = new THREE.Color();
      c.lerpColors(amberCore, brightCyan, Math.random());
      nCol[i3] = c.r;
      nCol[i3 + 1] = c.g;
      nCol[i3 + 2] = c.b;
    }

    return [new Float32Array(linePts), nPos, nCol];
  }, []);

  useFrame((_, delta) => {
    if (linesRef.current) linesRef.current.rotation.y += delta * 0.005;
    if (nodesRef.current) nodesRef.current.rotation.y += delta * 0.005;
  });

  return (
    <group>
      {/* Filament Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0284c7" transparent opacity={0.35} />
      </lineSegments>

      {/* Cluster Nodes */}
      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// Cosmic Microwave Background Outer Boundary
const CMBSphereBoundary: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ isSelected, onSelect, language }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.cmb_sphere;

  useFrame((_, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y -= delta * 0.002;
    }
  });

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Giant Enclosing CMB Shell */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[body.size, 36, 36]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          wireframe
        />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.7, 0]} center distanceFactor={60}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-amber-500 text-xs font-bold text-amber-200 whitespace-nowrap shadow-2xl">
            📡 {language === 'ar' ? body.nameAr : body.nameEn} (z ≈ 1,100 Horizon)
          </div>
        </Html>
      )}
    </group>
  );
};

// Boötes Void Sphere
const BootesVoidStructure: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ isSelected, onSelect, language }) => {
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.bootes_void;

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
      {/* Dark Void Sphere */}
      <mesh>
        <sphereGeometry args={[body.size * 0.65, 24, 24]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.7} />
      </mesh>
      <mesh>
        <sphereGeometry args={[body.size * 0.7, 16, 16]} />
        <meshBasicMaterial color="#312e81" transparent opacity={0.25} wireframe />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.5, 0]} center distanceFactor={60}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-indigo-500 text-xs font-bold text-indigo-200 whitespace-nowrap shadow-xl">
            🌌 {language === 'ar' ? body.nameAr : body.nameEn} (330M ly Void)
          </div>
        </Html>
      )}
    </group>
  );
};

// Laniakea Supercluster Node
const LaniakeaSuperclusterNode: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ isSelected, onSelect, language }) => {
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.laniakea_supercluster;

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
      <mesh>
        <sphereGeometry args={[4.5, 20, 20]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} wireframe />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, 6.0, 0]} center distanceFactor={60}>
          <div className="px-3 py-1 rounded-full bg-sky-950/95 border border-sky-400 text-xs font-bold text-sky-200 whitespace-nowrap shadow-2xl">
            ✨ {language === 'ar' ? body.nameAr : body.nameEn} (100K Galaxies)
          </div>
        </Html>
      )}
    </group>
  );
};

export const CosmicWebScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  return (
    <group>
      <ambientLight intensity={0.4} />

      {/* Large Scale Filaments & Superclusters */}
      <FilamentaryWeb />

      {/* Laniakea Supercluster Center */}
      <LaniakeaSuperclusterNode
        isSelected={selectedCosmicBodyId === 'laniakea_supercluster'}
        onSelect={() => setSelectedCosmicBodyId('laniakea_supercluster')}
        language={language}
      />

      {/* Boötes Great Void */}
      <BootesVoidStructure
        isSelected={selectedCosmicBodyId === 'bootes_void'}
        onSelect={() => setSelectedCosmicBodyId('bootes_void')}
        language={language}
      />

      {/* Outer CMB Observable Horizon */}
      <CMBSphereBoundary
        isSelected={selectedCosmicBodyId === 'cmb_sphere'}
        onSelect={() => setSelectedCosmicBodyId('cmb_sphere')}
        language={language}
      />
    </group>
  );
};
