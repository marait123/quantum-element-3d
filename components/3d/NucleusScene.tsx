'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ELEMENT_MAP } from '@/data/elementsData';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { generateNucleonPositions, NucleonPosition } from '@/lib/mathUtils';
import { createProtonTexture, createNeutronTexture } from '@/lib/textureGenerator';

interface MesonFilament {
  from: [number, number, number];
  to: [number, number, number];
  key: string;
}

export const NucleusScene: React.FC = () => {
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const particleFilter = useQuantumStore((s) => s.particleFilter);
  const language = useQuantumStore((s) => s.language);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);
  const selectNucleon = useQuantumStore((s) => s.selectNucleon);

  const [hoveredNucleon, setHoveredNucleon] = useState<NucleonPosition | null>(null);
  // Touch has no hover: the first tap on a nucleon shows its info, a second tap on it dives into its quarks
  const tappedNucleonRef = useRef<number | null>(null);

  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  // Procedural textures
  const protonTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createProtonTexture();
  }, []);

  const neutronTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createNeutronTexture();
  }, []);

  // Fibonacci distributed nucleon positions
  const nucleons = useMemo(() => {
    return generateNucleonPositions(element.p, element.n, 3.2);
  }, [element]);

  // Yukawa pion exchange filaments between close neighbors
  const filaments: MesonFilament[] = useMemo(() => {
    const list: MesonFilament[] = [];
    const maxDistance = 2.4;
    const maxConnectionsPerNucleon = 3;

    nucleons.forEach((n1, i) => {
      let connections = 0;
      for (let j = i + 1; j < nucleons.length; j++) {
        const n2 = nucleons[j];
        const v1 = new THREE.Vector3(...n1.position);
        const v2 = new THREE.Vector3(...n2.position);
        const dist = v1.distanceTo(v2);

        if (dist <= maxDistance && connections < maxConnectionsPerNucleon) {
          list.push({
            from: n1.position,
            to: n2.position,
            key: `fil_${i}_${j}`,
          });
          connections++;
        }
      }
    });

    return list;
  }, [nucleons]);

  const clusterGroupRef = useRef<THREE.Group>(null);
  const pionMeshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (clusterGroupRef.current) {
      clusterGroupRef.current.rotation.y += delta * 0.15;
      clusterGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }

    // Animate glowing Yukawa pion packet hopping along a filament
    if (pionMeshRef.current && filaments.length > 0) {
      const t = (state.clock.elapsedTime * 1.5) % filaments.length;
      const index = Math.floor(t);
      const frac = t - index;
      const fil = filaments[index % filaments.length];

      const pA = new THREE.Vector3(...fil.from);
      const pB = new THREE.Vector3(...fil.to);
      const currentPos = new THREE.Vector3().lerpVectors(pA, pB, frac);
      pionMeshRef.current.position.copy(currentPos);
    }
  });

  // Merged line segments for all Yukawa filaments
  const filamentsSegments = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    filaments.forEach((fil) => {
      pts.push(new THREE.Vector3(...fil.from));
      pts.push(new THREE.Vector3(...fil.to));
    });
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: '#f59e0b',
      transparent: true,
      opacity: 0.35,
    });
    return new THREE.LineSegments(geo, mat);
  }, [filaments]);

  return (
    <group position={[0, 0, 0]}>
      <group ref={clusterGroupRef}>
        {/* Yukawa Meson Exchange Filaments */}
        <primitive object={filamentsSegments} />

        {/* Traveling Yukawa Pion Packet (π-meson) */}
        {filaments.length > 0 && (
          <mesh ref={pionMeshRef}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshBasicMaterial color="#fef08a" wireframe />
            <pointLight color="#f59e0b" intensity={2} distance={3} />
          </mesh>
        )}

        {/* Nucleon Spheres (Protons and Neutrons) */}
        {nucleons.map((nuc) => {
          const isProton = nuc.type === 'proton';
          const isHovered = hoveredNucleon?.index === nuc.index;

          let isDimmed = false;
          if (particleFilter === 'protons' && !isProton) isDimmed = true;
          if (particleFilter === 'neutrons' && isProton) isDimmed = true;
          if (particleFilter === 'electrons') isDimmed = true;

          return (
            <group key={nuc.index} position={nuc.position}>
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredNucleon(nuc);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  // A touch lifting off fires pointer-out: keep a tapped nucleon's info up
                  if (hoveredNucleon?.index === nuc.index && tappedNucleonRef.current !== nuc.index) {
                    setHoveredNucleon(null);
                  }
                  document.body.style.cursor = 'default';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.delta > 5) return; // a drag to orbit, not a tap
                  const pointerType = (e.nativeEvent as PointerEvent).pointerType;
                  if (pointerType === 'touch' && tappedNucleonRef.current !== nuc.index) {
                    tappedNucleonRef.current = nuc.index;
                    setHoveredNucleon(nuc);
                    return;
                  }
                  tappedNucleonRef.current = null;
                  selectNucleon(nuc.index, nuc.type);
                  // Zoom right into Scale 4 (Quarks)
                  setScaleLevel(4);
                }}
              >
                <sphereGeometry args={[0.62, 24, 24]} />
                <meshStandardMaterial
                  map={isProton ? (protonTexture || undefined) : (neutronTexture || undefined)}
                  color={isProton ? '#ef4444' : '#38bdf8'}
                  emissive={isHovered ? '#facc15' : isProton ? '#991b1b' : '#0369a1'}
                  emissiveIntensity={isDimmed ? 0.1 : isHovered ? 1.5 : 0.6}
                  transparent
                  opacity={isDimmed ? 0.15 : 1}
                  roughness={0.3}
                  metalness={0.2}
                />
              </mesh>

              {/* Selection Halo */}
              {isHovered && (
                <mesh scale={[1.25, 1.25, 1.25]}>
                  <sphereGeometry args={[0.62, 16, 16]} />
                  <meshBasicMaterial
                    color="#facc15"
                    wireframe
                    transparent
                    opacity={0.6}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* 3D Nucleon Inspector Tooltip */}
      {hoveredNucleon && (
        <Html
          position={hoveredNucleon.position}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div id="nucleon-tooltip" className="glass-panel-deep px-3.5 py-2.5 rounded-xl text-xs whitespace-nowrap shadow-2xl border border-sky-400/40 text-slate-100 flex flex-col gap-1 backdrop-blur-md animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span
                className={`w-3 h-3 rounded-full ${
                  hoveredNucleon.type === 'proton'
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                    : 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                }`}
              />
              <span>
                {language === 'ar'
                  ? hoveredNucleon.type === 'proton'
                    ? 'بروتون (Proton)'
                    : 'نيوترون (Neutron)'
                  : hoveredNucleon.type === 'proton'
                  ? 'Proton (p⁺)'
                  : 'Neutron (n⁰)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between gap-4">
              <span>{language === 'ar' ? 'الشحنة الكهربية:' : 'Charge:'}</span>
              <span className="font-bold text-amber-400">
                {hoveredNucleon.type === 'proton' ? '+1 e' : '0 e'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between gap-4">
              <span>{language === 'ar' ? 'نكهات الكواركات:' : 'Valence Quarks:'}</span>
              <span className="font-bold text-cyan-300">
                {hoveredNucleon.type === 'proton' ? 'uud (2 Up, 1 Down)' : 'udd (1 Up, 2 Down)'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between gap-4">
              <span>{language === 'ar' ? 'الكتلة الساكنة:' : 'Rest Mass:'}</span>
              <span className="text-slate-200">
                {hoveredNucleon.type === 'proton' ? '938.27 MeV/c²' : '939.57 MeV/c²'}
              </span>
            </div>
            <div className="mt-1 pt-1 border-t border-slate-700/60 text-[10px] text-sky-400 font-semibold text-center">
              {language === 'ar'
                ? 'انقر للغوص داخل كواركات هذا الجسيم 🔍'
                : 'Click to plunge inside its 3 quarks 🔍'}
            </div>
          </div>
        </Html>
      )}

      {/* Cluster ambient lighting */}
      <pointLight color="#ffffff" intensity={2} distance={15} />
      <pointLight color="#ef4444" intensity={1.5} distance={10} position={[-4, 2, 3]} />
      <pointLight color="#38bdf8" intensity={1.5} distance={10} position={[4, -2, -3]} />
    </group>
  );
};
