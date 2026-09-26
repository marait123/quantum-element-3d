'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';

// Large Scale Cosmic Web Filaments (Dark matter & galaxy scaffolding spanning 100,000 -> 600,000 units)
const FilamentaryWeb: React.FC<{ glowTexture?: THREE.CanvasTexture }> = ({ glowTexture }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const nodesRef = useRef<THREE.Points>(null);

  const [linePositions, nodePositions, nodeColors] = useMemo(() => {
    const numNodes = 450;
    const nodeCoords: THREE.Vector3[] = [];

    // Distribute nodes randomly in the cosmos, excluding the Boötes void
    const voidCenter = new THREE.Vector3(420000, 250000, -360000);
    const voidRadius = 140000;

    for (let i = 0; i < numNodes; i++) {
      const radius = 80000 + Math.random() * 480000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const v = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Exclude nodes inside Boötes void
      if (v.distanceTo(voidCenter) > voidRadius) {
        nodeCoords.push(v);
      }
    }

    // Connect close neighbors with filament lines
    const linePts: number[] = [];
    for (let i = 0; i < nodeCoords.length; i++) {
      for (let j = i + 1; j < nodeCoords.length; j++) {
        const dist = nodeCoords[i].distanceTo(nodeCoords[j]);
        if (dist < 110000) {
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
    if (linesRef.current) linesRef.current.rotation.y += delta * 0.001;
    if (nodesRef.current) nodesRef.current.rotation.y += delta * 0.001;
  });

  return (
    <group>
      {/* Filament Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#0284c7" transparent opacity={0.3} />
      </lineSegments>

      {/* Cluster Nodes with soft circular glow */}
      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={240}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// Cosmic Microwave Background Outer Boundary (Radius 750,000)
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
      sphereRef.current.rotation.y -= delta * 0.0005;
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
          opacity={0.15}
          side={THREE.BackSide}
          wireframe
        />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.7, 0]} center distanceFactor={body.size * 3}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-amber-500 text-xs font-bold text-amber-200 whitespace-nowrap shadow-2xl">
            📡 {language === 'ar' ? body.nameAr : body.nameEn} (z ≈ 1,100 Horizon)
          </div>
        </Html>
      )}
    </group>
  );
};

// Boötes Void Sphere (Size 160,000)
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
      {/* Void Bubble */}
      <mesh>
        <sphereGeometry args={[body.size * 0.5, 32, 32]} />
        <meshBasicMaterial
          color="#030712"
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[body.size * 0.51, 24, 24]} />
        <meshBasicMaterial
          color="#312e81"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.55, 0]} center distanceFactor={body.size * 4}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-indigo-500 text-xs font-bold text-indigo-300 whitespace-nowrap shadow-2xl">
            🌌 {language === 'ar' ? body.nameAr : body.nameEn} (330M ly Supervoid)
          </div>
        </Html>
      )}
    </group>
  );
};

// Laniakea Supercluster Flow (Size 180,000)
const LaniakeaFlowModel: React.FC<{
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  glowTexture?: THREE.CanvasTexture;
}> = ({ isSelected, onSelect, language, glowTexture }) => {
  const [hovered, setHovered] = useState(false);
  const body = CELESTIAL_BODIES.laniakea_supercluster;
  const flowRef = useRef<THREE.Points>(null);

  const [streamPositions, streamColors] = useMemo(() => {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const greatAttractor = new THREE.Vector3(0, 0, -6500);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 10000 + Math.random() * (body.size * 0.5);

      pos[i3] = greatAttractor.x + Math.cos(angle) * dist + (Math.random() - 0.5) * 5000;
      pos[i3 + 1] = (Math.random() - 0.5) * 15000;
      pos[i3 + 2] = greatAttractor.z + Math.sin(angle) * dist + (Math.random() - 0.5) * 5000;

      const c = new THREE.Color('#38bdf8');
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

  useFrame((_, delta) => {
    if (flowRef.current) {
      flowRef.current.rotation.y += delta * 0.002;
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
      <points ref={flowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[streamPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[streamColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={180}
          map={glowTexture}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.35, 0]} center distanceFactor={body.size * 4}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-sky-400 text-xs font-bold text-sky-200 whitespace-nowrap shadow-2xl">
            ✨ {language === 'ar' ? body.nameAr : body.nameEn} (100K Galaxies)
          </div>
        </Html>
      )}
    </group>
  );
};

export const CosmicWebScene: React.FC = () => {
  const { camera } = useThree();
  const [visible, setVisible] = useState(false);
  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(undefined);

  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  // Distance-based Level of Detail (LOD): Only render the macro filaments when zoomed out far enough!
  useFrame(() => {
    const dist = camera.position.length();
    const shouldBeVisible = dist > 25000;
    if (shouldBeVisible !== visible) {
      setVisible(shouldBeVisible);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* 3D Dark Matter & Galaxy Filaments */}
      <FilamentaryWeb glowTexture={glowTexture} />

      {/* Laniakea Supercluster Flow */}
      <LaniakeaFlowModel
        isSelected={selectedCosmicBodyId === 'laniakea_supercluster'}
        onSelect={() => setSelectedCosmicBodyId('laniakea_supercluster')}
        language={language}
        glowTexture={glowTexture}
      />

      {/* Boötes Great Void */}
      <BootesVoidStructure
        isSelected={selectedCosmicBodyId === 'bootes_void'}
        onSelect={() => setSelectedCosmicBodyId('bootes_void')}
        language={language}
      />

      {/* Cosmic Microwave Background 380,000-year Shell */}
      <CMBSphereBoundary
        isSelected={selectedCosmicBodyId === 'cmb_sphere'}
        onSelect={() => setSelectedCosmicBodyId('cmb_sphere')}
        language={language}
      />
    </group>
  );
};
