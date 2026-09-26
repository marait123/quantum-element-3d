'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENT_MAP } from '@/data/elementsData';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { generateNucleonPositions } from '@/lib/mathUtils';

interface ElectronOrbitProps {
  shellIndex: number;
  electronCount: number;
  baseRadius: number;
  tiltAngle: [number, number, number];
  isExcited: boolean;
  dimmed: boolean;
}

const ElectronOrbit: React.FC<ElectronOrbitProps> = ({
  shellIndex,
  electronCount,
  baseRadius,
  tiltAngle,
  isExcited,
  dimmed,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const electronsRef = useRef<THREE.Group>(null);
  const photonRef = useRef<THREE.Mesh>(null);

  // Orbit ring points
  const ringPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * baseRadius;
      const z = Math.sin(theta) * (baseRadius * 0.94); // slight ellipse
      points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
  }, [baseRadius]);

  const orbitLineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(ringPoints);
  }, [ringPoints]);

  useFrame((state, delta) => {
    if (electronsRef.current) {
      // Rotation speed is higher for inner shells according to Kepler/Bohr orbital velocity v ~ 1/sqrt(r)
      const speed = (2.2 / Math.sqrt(shellIndex + 1)) * (isExcited ? 1.6 : 1.0);
      electronsRef.current.rotation.y += delta * speed;
    }

    // Photon packet animation during quantum leap
    if (photonRef.current && isExcited) {
      const t = (state.clock.elapsedTime * 4) % 3;
      photonRef.current.position.set(
        Math.cos(t * 3) * (baseRadius + 4 - t * 2),
        Math.sin(t * 8) * 0.4,
        Math.sin(t * 3) * (baseRadius + 4 - t * 2)
      );
      photonRef.current.visible = true;
    } else if (photonRef.current) {
      photonRef.current.visible = false;
    }
  });

  const orbitLineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: isExcited ? '#38bdf8' : '#06b6d4',
      opacity: dimmed ? 0.08 : isExcited ? 0.6 : 0.25,
      transparent: true,
    });
    return new THREE.Line(orbitLineGeo, mat);
  }, [orbitLineGeo, isExcited, dimmed]);

  return (
    <group ref={groupRef} rotation={tiltAngle}>
      {/* Orbital Path Ring */}
      <primitive object={orbitLineObj} />

      {/* Orbiting electrons */}
      <group ref={electronsRef}>
        {Array.from({ length: electronCount }).map((_, i) => {
          const angle = (i / electronCount) * Math.PI * 2;
          const currentRadius = isExcited && shellIndex === 0 ? baseRadius * 1.4 : baseRadius;
          const ex = Math.cos(angle) * currentRadius;
          const ez = Math.sin(angle) * (currentRadius * 0.94);

          return (
            <group key={i} position={[ex, 0, ez]}>
              {/* Electron Core */}
              <mesh>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial
                  color={isExcited ? '#38bdf8' : '#facc15'}
                  emissive={isExcited ? '#0284c7' : '#eab308'}
                  emissiveIntensity={dimmed ? 0.2 : 1.4}
                  transparent
                  opacity={dimmed ? 0.15 : 1}
                />
              </mesh>

              {/* Glowing halo shell */}
              <mesh scale={[1.8, 1.8, 1.8]}>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshBasicMaterial
                  color={isExcited ? '#7dd3fc' : '#fef08a'}
                  wireframe
                  transparent
                  opacity={dimmed ? 0.05 : 0.45}
                />
              </mesh>

              {/* Point light to illuminate nearby orbital field */}
              <pointLight
                color={isExcited ? '#38bdf8' : '#facc15'}
                intensity={dimmed ? 0.1 : 0.8}
                distance={2.5}
              />
            </group>
          );
        })}
      </group>

      {/* Incoming / outgoing photon packet for quantum leap */}
      <mesh ref={photonRef} visible={false}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial color="#ffffff" wireframe />
      </mesh>
    </group>
  );
};

export const AtomScene: React.FC = () => {
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const isExcited = useQuantumStore((s) => s.isExcitedState);
  const particleFilter = useQuantumStore((s) => s.particleFilter);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);

  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  // Nucleus mini-cluster in the center
  const nucleusPositions = useMemo(() => {
    return generateNucleonPositions(element.p, element.n, 1.2);
  }, [element]);

  // Shell orbital configurations
  const shells = useMemo(() => {
    const arr = element.shells || [1];
    return arr.map((count, idx) => {
      const radius = 3.6 + idx * 2.2;
      // Pre-calculated orthogonal/elliptical orbital plane tilts
      const tilts: [number, number, number][] = [
        [0.2, 0.1, 0.0],
        [0.7, 0.4, 0.3],
        [-0.5, 0.8, -0.4],
        [0.9, -0.6, 0.6],
        [-0.8, -0.7, 0.2],
        [1.1, 0.2, -0.8],
        [-0.3, 1.2, 0.5],
      ];
      return {
        index: idx,
        count,
        radius,
        tilt: tilts[idx % tilts.length],
      };
    });
  }, [element]);

  const nucleusGroupRef = useRef<THREE.Group>(null);
  const [nucleusHovered, setNucleusHovered] = React.useState(false);

  useFrame((_, delta) => {
    if (nucleusGroupRef.current) {
      nucleusGroupRef.current.rotation.y += delta * 0.5;
      nucleusGroupRef.current.rotation.x += delta * 0.2;
    }
  });

  const electronsDimmed = particleFilter === 'protons' || particleFilter === 'neutrons';
  const nucleusDimmed = particleFilter === 'electrons';

  return (
    <group position={[0, 0, 0]}>
      {/* Central Nucleus (Clickable proxy to zoom into Scale 3) */}
      <group
        ref={nucleusGroupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setNucleusHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setNucleusHovered(false);
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Directly plunge into packed nucleus
          setScaleLevel(3);
        }}
      >
        {/* Hover / Selection Reticle around Nucleus */}
        {nucleusHovered && (
          <mesh>
            <ringGeometry args={[1.8, 1.95, 32]} />
            <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
          </mesh>
        )}

        {nucleusPositions.map((nuc) => (
          <mesh key={nuc.index} position={nuc.position}>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshStandardMaterial
              color={nuc.type === 'proton' ? '#ef4444' : '#38bdf8'}
              emissive={nuc.type === 'proton' ? '#7f1d1d' : '#0369a1'}
              emissiveIntensity={nucleusDimmed ? 0.1 : 0.6}
              transparent
              opacity={nucleusDimmed ? 0.1 : 1.0}
            />
          </mesh>
        ))}

        {/* Ambient nucleus glow */}
        <pointLight
          color="#38bdf8"
          intensity={nucleusDimmed ? 0.2 : 2.5}
          distance={6}
        />
      </group>

      {/* Bohr Orbital Shells */}
      {shells.map((shell) => (
        <ElectronOrbit
          key={shell.index}
          shellIndex={shell.index}
          electronCount={shell.count}
          baseRadius={shell.radius}
          tiltAngle={shell.tilt}
          isExcited={isExcited}
          dimmed={electronsDimmed}
        />
      ))}
    </group>
  );
};
