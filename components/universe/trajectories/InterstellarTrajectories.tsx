'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { eclipticDirection, heliocentricPositionOnDate, worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';

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
  const isV1Active = selectedCosmicBodyId === 'voyager_1';
  const isV2Active = selectedCosmicBodyId === 'voyager_2';

  // Real history: where Earth and the planets actually were on the launch and flyby dates (from the same orbital
  // elements as the frame graph), then out to the probe's live position along its real heading
  const V1_WAYPOINTS: [string, number][] = [
    ['earth', Date.UTC(1977, 8, 5)], // launch
    ['jupiter', Date.UTC(1979, 2, 5)],
    ['saturn', Date.UTC(1980, 10, 12)],
  ];
  const V2_WAYPOINTS: [string, number][] = [
    ['earth', Date.UTC(1977, 7, 20)],
    ['jupiter', Date.UTC(1979, 6, 9)],
    ['saturn', Date.UTC(1981, 7, 25)],
    ['uranus', Date.UTC(1986, 0, 24)],
    ['neptune', Date.UTC(1989, 7, 25)],
  ];

  const trail = useMemo(() => {
    const build = (probe: 'voyager_1' | 'voyager_2', waypoints: [string, number][], color: string) => {
      const pts = waypoints.map(([id, date]) => heliocentricPositionOnDate(id, date));
      const hist = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 }));
      const future = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineDashedMaterial({ color, dashSize: 3, gapSize: 2, transparent: true, opacity: 0.55 })
      );
      const update = (t: number) => {
        const now = worldPositionAt(probe, t);
        const curve = new THREE.CatmullRomCurve3([...pts, now], false, 'centripetal');
        hist.geometry.setFromPoints(curve.getPoints(96));
        const dest = now.clone().multiplyScalar(1.55);
        future.geometry.setFromPoints([now, dest]);
        future.computeLineDistances();
        return dest;
      };
      return { hist, future, update, dest: update(0) };
    };
    return {
      v1: build('voyager_1', V1_WAYPOINTS, '#38bdf8'),
      v2: build('voyager_2', V2_WAYPOINTS, '#10b981'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      for (const k of ['v1', 'v2'] as const) {
        trail[k].hist.geometry.dispose();
        (trail[k].hist.material as THREE.Material).dispose();
        trail[k].future.geometry.dispose();
        (trail[k].future.material as THREE.Material).dispose();
      }
    },
    [trail]
  );
  const v1DestRef = useRef<THREE.Group>(null);
  const v2DestRef = useRef<THREE.Group>(null);
  const lastUpdate = useRef(-1);

  // Proxima Centauri's real direction in the sky (RA 14h30m, Dec −62.7° → ecliptic 239°, −44.8°)
  const proximaRef = useMemo(() => {
    const dir = eclipticDirection(239.1, -44.8).multiplyScalar(105);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir]),
      new THREE.LineDashedMaterial({ color: '#f87171', dashSize: 2, gapSize: 3, transparent: true, opacity: 0.35 })
    );
    line.computeLineDistances();
    return { line, pos: dir };
  }, []);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1.0 + Math.sin(clock.getElapsedTime() * 3.0) * 0.18;
      pulseRef.current.scale.set(s, s, s);
    }
    // The probes keep moving outward: refresh the trails a few times a second
    if (Math.abs(simClock.time - lastUpdate.current) > 0.5) {
      lastUpdate.current = simClock.time;
      v1DestRef.current?.position.copy(trail.v1.update(simClock.time));
      v2DestRef.current?.position.copy(trail.v2.update(simClock.time));
    }
    (trail.v1.hist.material as THREE.LineBasicMaterial).opacity = isV1Active ? 0.85 : 0.45;
    (trail.v2.hist.material as THREE.LineBasicMaterial).opacity = isV2Active ? 0.85 : 0.45;
  });

  return (
    <group>
      {/* =================================================================== */}
      {/* VOYAGER 1: TRAJECTORY & GLIESE 445 ENCOUNTER BEACON                 */}
      {/* =================================================================== */}
      {/* Historic Flight Path */}
      <primitive object={trail.v1.hist} />

      {/* Future Interstellar Escape Vector */}
      <primitive object={trail.v1.future} />

      {/* Gliese 445 Future Encounter Beacon */}
      <group ref={v1DestRef} position={trail.v1.dest}>
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
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs whitespace-nowrap shadow-2xl transition-all cursor-pointer pointer-events-auto ${
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
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
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
      <primitive object={trail.v2.hist} />

      {/* Future Interstellar Escape Vector */}
      <primitive object={trail.v2.future} />

      {/* Ross 248 & Sirius Future Encounter Beacon */}
      <group ref={v2DestRef} position={trail.v2.dest}>
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
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs whitespace-nowrap shadow-2xl transition-all cursor-pointer pointer-events-auto ${
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
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
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
      <primitive object={proximaRef.line} />

      <group position={proximaRef.pos}>
        <mesh>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
        </mesh>

        <Html position={[0, -1.6, 0]} center distanceFactor={44}>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-red-500/30 text-[10px] text-red-300/90 whitespace-nowrap backdrop-blur-sm pointer-events-none select-none">
            <span className="font-bold">
              {language === 'ar'
                ? '🔴 اتجاه بروكسيما قنطورس (الميل -62.7°)'
                : '🔴 Proxima Centauri Direction (Dec −62.7°)'}
            </span>
            <span className="block text-[9px] text-slate-400">
              {language === 'ar'
                ? 'بعيد عن مسار فوياجر 1 (4.25 سنة ضوئية)'
                : 'Far from Voyager 1’s heading (4.25 ly)'}
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
};
