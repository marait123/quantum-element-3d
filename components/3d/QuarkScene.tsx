'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { createQuarkTexture } from '@/lib/textureGenerator';

interface QuarkData {
  id: number;
  initialFlavor: 'u' | 'd';
  position: [number, number, number];
  colorCharge: string;
}

export const QuarkScene: React.FC = () => {
  const selectedNucleonType = useQuantumStore((s) => s.selectedNucleonType) || 'proton';
  const isBetaDecaying = useQuantumStore((s) => s.isBetaDecaying);
  const isSeaQuarksActive = useQuantumStore((s) => s.isSeaQuarksActive);
  const language = useQuantumStore((s) => s.language);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);

  const [hoveredQuark, setHoveredQuark] = useState<number | null>(null);

  // Bag mesh ref for MIT bag breathing animation
  const bagRef = useRef<THREE.Mesh>(null);
  const wBosonRef = useRef<THREE.Mesh>(null);
  const fluxTubesRef = useRef<THREE.Group>(null);

  // In Beta Decay (n -> p), a down quark transmutes to up quark
  const effectiveType = isBetaDecaying ? 'proton' : selectedNucleonType;

  // Triangle equilateral quark positions in 3D
  const quarks: QuarkData[] = useMemo(() => {
    const isProton = effectiveType === 'proton';
    const r = 2.2;
    return [
      {
        id: 0,
        initialFlavor: 'u', // always Up
        position: [0, r, 0],
        colorCharge: '#ef4444', // Red
      },
      {
        id: 1,
        initialFlavor: isProton ? 'u' : 'd', // Up for proton, Down for neutron
        position: [-r * 0.866, -r * 0.5, 0.4],
        colorCharge: '#22c55e', // Green
      },
      {
        id: 2,
        initialFlavor: 'd', // Down (transmutes if beta decaying)
        position: [r * 0.866, -r * 0.5, -0.4],
        colorCharge: '#3b82f6', // Blue
      },
    ];
  }, [effectiveType]);

  // Procedural textures for Up and Down quarks
  const upTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createQuarkTexture('u', '#ef4444');
  }, []);

  const downTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createQuarkTexture('d', '#3b82f6');
  }, []);

  // Sea quarks (virtual quark-antiquark pairs)
  const virtualPairs = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      posA: [
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 3.5,
      ] as [number, number, number],
      speed: 1.5 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Energy beads traveling along flux tubes
  const beadsRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // MIT Bag breathing / pulsation (asymptotic freedom vs confinement)
    if (bagRef.current) {
      const breath = 1 + 0.06 * Math.sin(time * 3);
      bagRef.current.scale.set(breath, breath, breath);
    }

    // W- Boson animation during beta decay
    if (wBosonRef.current && isBetaDecaying) {
      const progress = (time * 1.5) % 3;
      wBosonRef.current.position.set(
        1.9 + progress * 1.8,
        -1.0 - progress * 1.2,
        progress * 1.5
      );
      wBosonRef.current.scale.setScalar(Math.max(0.01, 1 - progress * 0.3));
    }

    // Gluon beads traveling along triangular flux tubes
    if (beadsRef.current) {
      const children = beadsRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const bead = children[i] as THREE.Mesh;
        const progress = (time * 2 + i * 0.33) % 1;
        const edge = i % 3;
        const p1 = new THREE.Vector3(...quarks[edge].position);
        const p2 = new THREE.Vector3(...quarks[(edge + 1) % 3].position);
        bead.position.lerpVectors(p1, p2, progress);
      }
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Translucent Pulsing MIT Bag (Hadron Confinement Surface) */}
      <mesh ref={bagRef}>
        <sphereGeometry args={[3.6, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.14}
          roughness={0.1}
          metalness={0.8}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* MIT Bag Wireframe outline */}
      <mesh scale={[1.002, 1.002, 1.002]}>
        <sphereGeometry args={[3.6, 20, 20]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Triangular SU(3) Gluon Flux Tubes */}
      <group ref={fluxTubesRef}>
        {[0, 1, 2].map((idx) => {
          const p1 = new THREE.Vector3(...quarks[idx].position);
          const p2 = new THREE.Vector3(...quarks[(idx + 1) % 3].position);
          const curve = new THREE.LineCurve3(p1, p2);
          const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 8, false);

          return (
            <mesh key={`tube_${idx}`} geometry={tubeGeo}>
              <meshStandardMaterial
                color="#facc15"
                emissive="#f59e0b"
                emissiveIntensity={1.2}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>

      {/* High-Velocity Gluon Energy Beads traveling along tubes */}
      <group ref={beadsRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`bead_${i}`}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
            <pointLight color="#facc15" intensity={1.5} distance={2} />
          </mesh>
        ))}
      </group>

      {/* The 3 Valence Quarks */}
      {quarks.map((q) => {
        const isUp = q.initialFlavor === 'u';
        const isHovered = hoveredQuark === q.id;

        return (
          <group key={q.id} position={q.position}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredQuark(q.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                if (hoveredQuark === q.id) setHoveredQuark(null);
                document.body.style.cursor = 'default';
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Plunge into Planck scale string inside this quark!
                setScaleLevel(5);
              }}
            >
              <sphereGeometry args={[0.72, 28, 28]} />
              <meshStandardMaterial
                map={isUp ? (upTexture || undefined) : (downTexture || undefined)}
                color={isUp ? '#ef4444' : '#3b82f6'}
                emissive={isHovered ? '#facc15' : isUp ? '#991b1b' : '#1e3a8a'}
                emissiveIntensity={isHovered ? 2.0 : 0.8}
                roughness={0.25}
                metalness={0.4}
              />
            </mesh>

            {/* Glowing Color-Charge Halo */}
            <mesh scale={[1.3, 1.3, 1.3]}>
              <sphereGeometry args={[0.72, 16, 16]} />
              <meshBasicMaterial
                color={q.colorCharge}
                wireframe
                transparent
                opacity={isHovered ? 0.8 : 0.35}
              />
            </mesh>

            <pointLight
              color={q.colorCharge}
              intensity={isHovered ? 3.0 : 1.5}
              distance={4}
            />

            {/* 3D Tooltip for each quark */}
            {isHovered && (
              <Html distanceFactor={14} center position={[0, 1.2, 0]}>
                <div className="glass-panel-deep px-3 py-2 rounded-xl text-xs whitespace-nowrap shadow-xl border border-yellow-400/50 text-slate-100 flex flex-col gap-0.5">
                  <div className="font-bold text-amber-300">
                    {isUp ? 'Up Quark (u)' : 'Down Quark (d)'}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    {language === 'ar' ? 'شحنة كهربية:' : 'Charge:'}{' '}
                    <span className="font-bold text-cyan-400">
                      {isUp ? '+2/3 e' : '-1/3 e'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono">
                    {language === 'ar' ? 'كتلة هيغز:' : 'Bare Mass:'}{' '}
                    <span>{isUp ? '~2.2 MeV/c²' : '~4.7 MeV/c²'}</span>
                  </div>
                  <div className="text-[10px] text-yellow-400 font-semibold mt-1">
                    {language === 'ar'
                      ? 'انقر للغوص في وتر بلانك ⚡'
                      : 'Click to plunge into Planck String ⚡'}
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Virtual Sea Quarks (Bubbling q-qbar pairs in quantum vacuum) */}
      {isSeaQuarksActive &&
        virtualPairs.map((p) => (
          <group key={p.id} position={p.posA}>
            <mesh>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#ec4899" wireframe />
            </mesh>
            <mesh position={[0.25, 0, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshBasicMaterial color="#a855f7" wireframe />
            </mesh>
          </group>
        ))}

      {/* Animated W- Gauge Boson during Beta Decay */}
      {isBetaDecaying && (
        <mesh ref={wBosonRef} position={[2, -1, 0]}>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#7e22ce"
            emissiveIntensity={2.5}
            wireframe
          />
          <pointLight color="#a855f7" intensity={3} distance={5} />
        </mesh>
      )}

      {/* Ambient subatomic lighting */}
      <ambientLight intensity={0.4} />
      <pointLight color="#ffffff" intensity={2} distance={20} />
    </group>
  );
};
