'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';
import { getMliTexture, getSolarCellTexture, parabolicDishGeometry, useSpacecraftEnvMap } from './spacecraftKit';

interface RealisticHubbleProps {
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

// Built in metres from the real spacecraft (13.2 m long, 4.2 m diameter, SA3 rigid solar wings 7.1 × 2.45 m,
// two 1.3 m high-gain antennas on 4.3 m booms), then scaled to the scene so it fits its low orbit around Earth.
const METRE = 0.04;
const R = 2.1; // tube radius

export const RealisticHubble: React.FC<RealisticHubbleProps> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const wingsRef = useRef<THREE.Group[]>([]);
  const [hovered, setHovered] = useState(false);
  const envMap = useSpacecraftEnvMap();

  useEffect(() => {
    if (rootRef.current) registerCelestialObject('hubble', rootRef.current);
    return () => unregisterCelestialObject('hubble');
  }, []);

  const mats = useMemo(() => {
    const mli = getMliTexture().clone();
    mli.needsUpdate = true;
    mli.repeat.set(3, 2);
    const cells = getSolarCellTexture();
    return {
      mli: new THREE.MeshStandardMaterial({ map: mli, color: '#e6e9ee', metalness: 0.85, roughness: 0.32, envMap, envMapIntensity: 1.1 }),
      bay: new THREE.MeshStandardMaterial({ map: mli, color: '#b8bec8', metalness: 0.8, roughness: 0.4, envMap, envMapIntensity: 1 }),
      dark: new THREE.MeshStandardMaterial({ color: '#0b0d12', roughness: 0.9, metalness: 0.1, side: THREE.DoubleSide }),
      cells: new THREE.MeshStandardMaterial({ map: cells, metalness: 0.35, roughness: 0.3, envMap, envMapIntensity: 0.9 }),
      cellBack: new THREE.MeshStandardMaterial({ color: '#d8dce2', metalness: 0.6, roughness: 0.45, envMap }),
      white: new THREE.MeshStandardMaterial({ color: '#f1f3f5', metalness: 0.1, roughness: 0.55, envMap, envMapIntensity: 0.6, side: THREE.DoubleSide }),
      rail: new THREE.MeshStandardMaterial({ color: '#e8b923', metalness: 0.3, roughness: 0.5 }),
      steel: new THREE.MeshStandardMaterial({ color: '#9aa1ab', metalness: 0.9, roughness: 0.3, envMap }),
    };
  }, [envMap]);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const dish = useMemo(() => parabolicDishGeometry(0.65, 0.22, 36, 10), []);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    // Low Earth orbit around the moving Earth (frame graph)
    worldPositionAt('hubble', simClock.time, root.position);
    // Slow attitude change as it slews between targets
    const t = simClock.time;
    root.rotation.set(0.35 + Math.sin(t * 0.05) * 0.15, t * 0.04, 0.2);
    // Solar wings rotate about their masts to face the Sun (world origin)
    for (const w of wingsRef.current) if (w) w.rotation.x = Math.sin(t * 0.03) * 0.4;
  });

  const showLabel = hovered || isSelected;

  return (
    <group
      ref={rootRef}
      onClick={(e) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group scale={METRE}>
        {/* Light shield (forward, open end at +y) and forward shell */}
        <mesh position={[0, 4.25, 0]} material={mats.mli}>
          <cylinderGeometry args={[R, R, 4.7, 48, 1, true]} />
        </mesh>
        <mesh position={[0, 4.25, 0]} material={mats.dark}>
          <cylinderGeometry args={[R * 0.97, R * 0.97, 4.68, 48, 1, true]} />
        </mesh>
        <mesh position={[0, 0.45, 0]} material={mats.mli}>
          <cylinderGeometry args={[R, R, 2.9, 48]} />
        </mesh>
        {/* Secondary-mirror baffle glimpsed inside the aperture */}
        <mesh position={[0, 5.2, 0]} material={mats.dark}>
          <cylinderGeometry args={[0.3, 0.3, 1.4, 20]} />
        </mesh>
        {/* Aperture door, hinged open on its +x edge */}
        <group position={[R, 6.6, 0]} rotation={[0, 0, -1.9]}>
          <mesh position={[-R, 0, 0]} material={mats.mli}>
            <cylinderGeometry args={[R * 1.02, R * 1.02, 0.12, 48]} />
          </mesh>
        </group>

        {/* Equipment section: ten bays (Support Systems Module), the bay doors a darker blanket */}
        <mesh position={[0, -2.5, 0]} material={mats.bay}>
          <cylinderGeometry args={[R * 1.05, R * 1.05, 3.0, 10]} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * R * 1.06, -2.5, Math.sin(a) * R * 1.06]} rotation={[0, -a, 0]} material={mats.steel}>
              <boxGeometry args={[0.04, 3.0, 0.08]} />
            </mesh>
          );
        })}
        {/* Aft shroud and aft bulkhead with the Soft Capture Mechanism ring (added in 2009) */}
        <mesh position={[0, -5.3, 0]} material={mats.mli}>
          <cylinderGeometry args={[R, R, 2.6, 48]} />
        </mesh>
        <mesh position={[0, -6.62, 0]} material={mats.steel}>
          <cylinderGeometry args={[R * 0.98, R * 0.98, 0.06, 48]} />
        </mesh>
        <mesh position={[0, -6.72, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.steel}>
          <torusGeometry args={[0.9, 0.08, 10, 40]} />
        </mesh>

        {/* Magnetic torquer bars along the light shield (four, at 45°) */}
        {[0.25, 0.75, 1.25, 1.75].map((k) => {
          const a = k * Math.PI;
          return (
            <mesh key={k} position={[Math.cos(a) * (R + 0.18), 3.6, Math.sin(a) * (R + 0.18)]} material={mats.steel}>
              <cylinderGeometry args={[0.1, 0.1, 2.4, 10]} />
            </mesh>
          );
        })}
        {/* Yellow EVA handrails running along the body */}
        {[0.1, 0.6, 1.1, 1.6].map((k) => {
          const a = k * Math.PI;
          return (
            <mesh key={k} position={[Math.cos(a) * (R + 0.12), -1.2, Math.sin(a) * (R + 0.12)]} material={mats.rail}>
              <cylinderGeometry args={[0.035, 0.035, 9.5, 6]} />
            </mesh>
          );
        })}

        {/* Two rigid SA3 solar wings on masts (±x), each two panels either side of the mast */}
        {[1, -1].map((side, i) => (
          <group key={side} position={[side * (R + 0.35), 0.6, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 0.9, 0, 0]} material={mats.steel}>
              <cylinderGeometry args={[0.07, 0.07, 1.8, 8]} />
            </mesh>
            <group
              ref={(el) => {
                if (el) wingsRef.current[i] = el;
              }}
              position={[side * 3.1, 0, 0]}
            >
              {[1, -1].map((half) => (
                <group key={half} position={[0, half * 1.85, 0]}>
                  <mesh material={mats.cells}>
                    <boxGeometry args={[2.45, 3.5, 0.03]} />
                  </mesh>
                  <mesh position={[0, 0, -0.02]} material={mats.cellBack}>
                    <boxGeometry args={[2.45, 3.5, 0.005]} />
                  </mesh>
                </group>
              ))}
              <mesh material={mats.steel}>
                <boxGeometry args={[2.5, 0.12, 0.08]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* High-gain antennas on 4.3 m booms (±z), parabolic dishes facing outwards */}
        {[1, -1].map((side) => (
          <group key={side} position={[0, -1.4, side * R]}>
            <mesh position={[0, 0, side * 2.15]} rotation={[Math.PI / 2, 0, 0]} material={mats.steel}>
              <cylinderGeometry args={[0.05, 0.05, 4.3, 6]} />
            </mesh>
            <group position={[0, 0, side * 4.3]} rotation={[side * (Math.PI / 2), 0, 0]}>
              <mesh geometry={dish} material={mats.white} />
              <mesh position={[0, 0.35, 0]} material={mats.steel}>
                <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Low-gain antennas at both ends */}
        <mesh position={[0, 6.9, R * 0.7]} material={mats.white}>
          <coneGeometry args={[0.18, 0.4, 12]} />
        </mesh>
        <mesh position={[0, -6.9, -R * 0.7]} rotation={[Math.PI, 0, 0]} material={mats.white}>
          <coneGeometry args={[0.18, 0.4, 12]} />
        </mesh>
      </group>

      {showLabel && (
        <Html position={[0, 0.45, 0]} center>
          <div
            className={`px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border ${
              isSelected ? 'border-sky-400 ring-2 ring-sky-400' : 'border-sky-500/40'
            } text-[11px] font-bold text-sky-300 whitespace-nowrap shadow-2xl flex items-center gap-2 cursor-pointer pointer-events-auto`}
            onClick={onSelect}
          >
            <span className="text-sm">🔭</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200">LEO 540 km</span>
          </div>
        </Html>
      )}
    </group>
  );
};
