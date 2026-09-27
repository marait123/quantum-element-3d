'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useQuantumStore } from '@/stores/useQuantumStore';

interface InterstellarTrajectoriesProps {
  language: 'en' | 'ar';
  onSelectBody: (id: string) => void;
}

export const InterstellarTrajectories: React.FC<InterstellarTrajectoriesProps> = ({
  language,
  onSelectBody,
}) => {
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const pulseRef = useRef<THREE.Group>(null);

  // 1. Voyager 1 Historic Trajectory: Earth -> Saturn/Titan flyby (Nov 1980) -> +35.2° North Interstellar Escape
  const { v1HistoricLine, v1FutureLine, v1DestinationPos } = useMemo(() => {
    const p0 = new THREE.Vector3(15.5, 0, 0); // Earth departure
    const p1 = new THREE.Vector3(26.0, 0.5, 14.0); // Jupiter gravity assist
    const p2 = new THREE.Vector3(42.0, 1.2, 18.0); // Saturn / Titan flyby (bent northward)
    const p3 = new THREE.Vector3(58.0, 32.0, -18.0); // Heliosheath climb
    const pCurrent = new THREE.Vector3(78.0, 68.0, -56.0); // Current location (~163.3 AU)

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, pCurrent]);
    const historicPoints = curve.getPoints(64);
    const histGeo = new THREE.BufferGeometry().setFromPoints(historicPoints);

    // Future Vector toward Gliese 445 (Camelopardalis, +35° North)
    const pDest = new THREE.Vector3(122.0, 112.0, -92.0);
    const futureGeo = new THREE.BufferGeometry().setFromPoints([pCurrent, pDest]);

    return {
      v1HistoricLine: histGeo,
      v1FutureLine: futureGeo,
      v1DestinationPos: pDest,
    };
  }, []);

  // 2. Voyager 2 Historic Trajectory: Grand Tour (Jupiter -> Saturn -> Uranus -> Neptune/Triton Aug 1989) -> -48.0° South Escape
  const { v2HistoricLine, v2FutureLine, v2DestinationPos } = useMemo(() => {
    const p0 = new THREE.Vector3(15.5, 0, 0); // Earth departure
    const p1 = new THREE.Vector3(25.0, 0.8, -12.0); // Jupiter assist
    const p2 = new THREE.Vector3(40.0, 1.5, -24.0); // Saturn assist
    const p3 = new THREE.Vector3(50.0, -3.2, 12.0); // Uranus flyby
    const p4 = new THREE.Vector3(58.0, -8.5, 26.0); // Neptune / Triton polar dive (bent southward)
    const pCurrent = new THREE.Vector3(-42.0, -74.0, 52.0); // Current location (~136.2 AU)

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, pCurrent]);
    const historicPoints = curve.getPoints(72);
    const histGeo = new THREE.BufferGeometry().setFromPoints(historicPoints);

    // Future Vector toward Ross 248 / Sirius (-48° South, Pavo)
    const pDest = new THREE.Vector3(-68.0, -124.0, 84.0);
    const futureGeo = new THREE.BufferGeometry().setFromPoints([pCurrent, pDest]);

    return {
      v2HistoricLine: histGeo,
      v2FutureLine: futureGeo,
      v2DestinationPos: pDest,
    };
  }, []);

  // 3. Proxima Centauri Celestial Direction Vector (Dec -62.7° in Centaurus, deep southern sky)
  const { proximaRefLine, proximaRefPos } = useMemo(() => {
    const origin = new THREE.Vector3(0, 0, 0);
    // Heading toward Dec -62.7° in southern celestial hemisphere
    const dir = new THREE.Vector3(38.0, -88.0, -42.0);
    const geo = new THREE.BufferGeometry().setFromPoints([origin, dir]);
    return { proximaRefLine: geo, proximaRefPos: dir };
  }, []);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 3.0) * 0.18;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  const isV1Active = selectedCosmicBodyId === 'voyager_1';
  const isV2Active = selectedCosmicBodyId === 'voyager_2';

  return (
    <group>
      {/* =================================================================== */}
      {/* VOYAGER 1: TRAJECTORY & GLIESE 445 ENCOUNTER BEACON                 */}
      {/* =================================================================== */}
      {/* Historic Flight Path */}
      <primitive
        object={
          new THREE.Line(
            v1HistoricLine,
            new THREE.LineBasicMaterial({
              color: '#38bdf8',
              transparent: true,
              opacity: isV1Active ? 0.85 : 0.45,
              linewidth: 2,
            })
          )
        }
      />

      {/* Future Interstellar Escape Vector */}
      <primitive
        object={
          new THREE.Line(
            v1FutureLine,
            new THREE.LineDashedMaterial({
              color: '#38bdf8',
              dashSize: 3,
              gapSize: 2,
              transparent: true,
              opacity: isV1Active ? 0.95 : 0.55,
            })
          )
        }
      />

      {/* Gliese 445 Future Encounter Beacon */}
      <group position={v1DestinationPos}>
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.2, 1.45, 24]} />
          <meshBasicMaterial color="#7dd3fc" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>

        <Html position={[0, 1.8, 0]} center distanceFactor={42}>
          <div
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs whitespace-nowrap shadow-2xl transition-all cursor-pointer ${
              isV1Active
                ? 'bg-sky-950/95 border-sky-400 text-sky-200 ring-2 ring-sky-400/50 scale-105'
                : 'bg-slate-950/85 border-sky-500/40 text-slate-300 hover:border-sky-400 hover:text-white'
            }`}
            onClick={() => onSelectBody('voyager_1')}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-sm">🌟</span>
              <span>
                {language === 'ar'
                  ? 'وجهة فوياجر 1: غليزا 445'
                  : 'Voyager 1 Heading: Gliese 445'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300">
                +35.2° North
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {language === 'ar'
                ? 'اقتراب لمسافة 1.6 سنة ضوئية بعد ~40,000 عام (كوكبة الزرافة)'
                : 'Passes 1.6 ly away in ~40,000 yrs (Camelopardalis)'}
            </div>
          </div>
        </Html>
      </group>

      {/* =================================================================== */}
      {/* VOYAGER 2: TRAJECTORY & ROSS 248 / SIRIUS ENCOUNTER BEACON          */}
      {/* =================================================================== */}
      {/* Historic Flight Path */}
      <primitive
        object={
          new THREE.Line(
            v2HistoricLine,
            new THREE.LineBasicMaterial({
              color: '#10b981',
              transparent: true,
              opacity: isV2Active ? 0.85 : 0.45,
              linewidth: 2,
            })
          )
        }
      />

      {/* Future Interstellar Escape Vector */}
      <primitive
        object={
          new THREE.Line(
            v2FutureLine,
            new THREE.LineDashedMaterial({
              color: '#10b981',
              dashSize: 3,
              gapSize: 2,
              transparent: true,
              opacity: isV2Active ? 0.95 : 0.55,
            })
          )
        }
      />

      {/* Ross 248 & Sirius Future Encounter Beacon */}
      <group position={v2DestinationPos}>
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.2, 1.45, 24]} />
          <meshBasicMaterial color="#6ee7b7" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>

        <Html position={[0, -2.0, 0]} center distanceFactor={42}>
          <div
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs whitespace-nowrap shadow-2xl transition-all cursor-pointer ${
              isV2Active
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 scale-105'
                : 'bg-slate-950/85 border-emerald-500/40 text-slate-300 hover:border-emerald-400 hover:text-white'
            }`}
            onClick={() => onSelectBody('voyager_2')}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-sm">🌟</span>
              <span>
                {language === 'ar'
                  ? 'وجهة فوياجر 2: روس 248 والشعرى اليمانية'
                  : 'Voyager 2 Heading: Ross 248 & Sirius'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                -48.0° South
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {language === 'ar'
                ? 'اقتراب من روس 248 (40k عام) ومن الشعرى (296k عام) بكوكبة الطاووس'
                : 'Passes Ross 248 (40k yrs) & Sirius (296k yrs) in Pavo'}
            </div>
          </div>
        </Html>
      </group>

      {/* =================================================================== */}
      {/* PROXIMA CENTAURI REFERENCE DIRECTION POINTER                        */}
      {/* =================================================================== */}
      <primitive
        object={
          new THREE.Line(
            proximaRefLine,
            new THREE.LineDashedMaterial({
              color: '#f87171',
              dashSize: 2,
              gapSize: 3,
              transparent: true,
              opacity: 0.35,
            })
          )
        }
      />

      <group position={proximaRefPos}>
        <mesh>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
        </mesh>

        <Html position={[0, -1.6, 0]} center distanceFactor={44}>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-red-500/30 text-[10px] text-red-300/90 whitespace-nowrap backdrop-blur-sm pointer-events-none select-none">
            <span className="font-bold">
              {language === 'ar'
                ? '🔴 اتجاه بروكسيما قنطورس (الجنوب العميق -62.7°)'
                : '🔴 Proxima Centauri Direction (Deep South -62.7°)'}
            </span>
            <span className="block text-[9px] text-slate-400">
              {language === 'ar'
                ? 'عكس اتجاه فوياجر 1 تماماً (4.25 سنة ضوئية)'
                : 'Opposite to Voyager 1 trajectory (4.25 ly)'}
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
};
