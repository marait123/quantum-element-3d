'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { eclipticDirection, trajectoryHistory } from '@/lib/frames';
import { simClock } from '@/lib/simClock';

interface InterstellarTrajectoriesProps {
  language: 'en' | 'ar';
  onSelectBody: (id: string) => void;
}

interface ProbeRoute {
  id: string;
  color: string;
  badge: string; // ecliptic latitude of the heading
  titleEn: string;
  titleAr: string;
  noteEn: string;
  noteAr: string;
  // Voyager beacons are always labelled; the others only while their probe is selected
  alwaysLabelled: boolean;
}

// Headings and encounters as given by NASA/JPL (Voyager FAQ, Pioneer mission pages)
const ROUTES: ProbeRoute[] = [
  {
    id: 'voyager_1',
    color: '#38bdf8',
    badge: '+35° N',
    titleEn: 'Voyager 1 → Ophiuchus',
    titleAr: 'فوياجر 1 ← كوكبة الحواء',
    noteEn: 'Passes 1.7 ly from AC+79 3888 (Gliese 445) in 40,272 AD',
    noteAr: 'يمر على بعد 1.7 سنة ضوئية من AC+79 3888 (غليزا 445) عام 40,272م',
    alwaysLabelled: true,
  },
  {
    id: 'voyager_2',
    color: '#10b981',
    badge: '−48° S',
    titleEn: 'Voyager 2 → Sagittarius & Pavo',
    titleAr: 'فوياجر 2 ← الرامي والطاووس',
    noteEn: '1.7 ly from Ross 248 in ~40,000 yrs · 4.3 ly from Sirius in ~296,000 yrs',
    noteAr: '1.7 سنة ضوئية من روس 248 بعد ~40 ألف عام · 4.3 من الشعرى بعد ~296 ألف عام',
    alwaysLabelled: true,
  },
  {
    id: 'pioneer_10',
    color: '#f59e0b',
    badge: '+3° N',
    titleEn: 'Pioneer 10 → Aldebaran (Taurus)',
    titleAr: 'بايونير 10 ← الدبران (الثور)',
    noteEn: 'Would pass Aldebaran in about 2 million years',
    noteAr: 'سيمر قرب الدبران بعد نحو مليوني عام',
    alwaysLabelled: false,
  },
  {
    id: 'pioneer_11',
    color: '#f472b6',
    badge: '+14° N',
    titleEn: 'Pioneer 11 → Aquila',
    titleAr: 'بايونير 11 ← العقاب',
    noteEn: 'Would pass near one of its stars in about 4 million years',
    noteAr: 'سيمر قرب أحد نجومها بعد نحو 4 ملايين عام',
    alwaysLabelled: false,
  },
  {
    id: 'new_horizons',
    color: '#a78bfa',
    badge: '+2° N',
    titleEn: 'New Horizons → Sagittarius',
    titleAr: 'نيو هورايزنز ← الرامي',
    noteEn: 'Pluto 2015 · Arrokoth 2019 · still exploring the Kuiper Belt',
    noteAr: 'بلوتو 2015 · أروكوث 2019 · ما زالت تستكشف حزام كايبر',
    alwaysLabelled: false,
  },
];

// The flown route up to the sky date (launch at Earth, the real flybys, then out along the heading; see
// trajectoryHistory in lib/frames.ts), and a dashed line on along the escape direction. Nothing before launch.
function buildTrail(route: ProbeRoute) {
  const hist = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: route.color, transparent: true, opacity: 0.45 }));
  const future = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({ color: route.color, dashSize: 3, gapSize: 2, transparent: true, opacity: 0.55 })
  );
  const update = (t: number) => {
    const pts = trajectoryHistory(route.id, t);
    const launched = pts.length > 1;
    hist.visible = future.visible = launched;
    if (!launched) return null;
    hist.geometry.setFromPoints(pts);
    const now = pts[pts.length - 1];
    const dest = now.clone().multiplyScalar(1.55);
    future.geometry.setFromPoints([now, dest]);
    future.computeLineDistances();
    return dest;
  };
  const dest = update(0);
  return { hist, future, update, dest: dest ?? new THREE.Vector3() };
}

export const InterstellarTrajectories: React.FC<InterstellarTrajectoriesProps> = ({ language, onSelectBody }) => {
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const trails = useMemo(() => ROUTES.map(buildTrail), []);
  useEffect(
    () => () => {
      for (const t of trails) {
        t.hist.geometry.dispose();
        (t.hist.material as THREE.Material).dispose();
        t.future.geometry.dispose();
        (t.future.material as THREE.Material).dispose();
      }
    },
    [trails]
  );
  const destRefs = useRef<(THREE.Group | null)[]>([]);
  const lastUpdate = useRef(-1);
  // Which probes have launched by the sky date (labels are HTML, so they follow React state, not three visibility)
  const [launched, setLaunched] = React.useState<boolean[]>(() => trails.map((t) => t.hist.visible));

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

  useFrame(() => {
    // The probes keep moving outward: refresh the trails a few times a second
    if (Math.abs(simClock.time - lastUpdate.current) > 0.5) {
      lastUpdate.current = simClock.time;
      const now = trails.map((t, i) => {
        const dest = t.update(simClock.time);
        if (dest) destRefs.current[i]?.position.copy(dest);
        return dest !== null;
      });
      if (now.some((v, i) => v !== launched[i])) setLaunched(now);
    }
    trails.forEach((t, i) => {
      (t.hist.material as THREE.LineBasicMaterial).opacity = selectedCosmicBodyId === ROUTES[i].id ? 0.85 : 0.45;
    });
  });

  return (
    <group>
      {ROUTES.map((route, i) => {
        const active = selectedCosmicBodyId === route.id;
        const trail = trails[i];
        if (!launched[i]) return null;
        return (
          <group key={route.id}>
            {/* Historic flight path through the real flyby positions, then the escape direction */}
            <primitive object={trail.hist} />
            <primitive object={trail.future} />

            {/* Heading beacon */}
            <group
              ref={(g) => {
                destRefs.current[i] = g;
              }}
              position={trail.dest}
            >
              <mesh>
                <sphereGeometry args={[0.9, 16, 16]} />
                <meshBasicMaterial color={route.color} transparent opacity={0.6} />
              </mesh>
              <mesh>
                <ringGeometry args={[1.2, 1.45, 24]} />
                <meshBasicMaterial color={route.color} side={THREE.DoubleSide} transparent opacity={0.7} />
              </mesh>

              {(route.alwaysLabelled || active) && (
                <Html position={[0, i % 2 === 0 ? 1.8 : -2.0, 0]} center distanceFactor={42}>
                  <div
                    className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs whitespace-nowrap shadow-2xl transition-all cursor-pointer pointer-events-auto ${
                      active ? 'bg-slate-950/95 text-white ring-2 scale-105' : 'bg-slate-950/85 text-slate-300 hover:text-white'
                    }`}
                    style={{ borderColor: active ? route.color : `${route.color}66`, ['--tw-ring-color' as string]: `${route.color}80` }}
                    onClick={() => onSelectBody(route.id)}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-sm">🧭</span>
                      <span>{language === 'ar' ? route.titleAr : route.titleEn}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono" style={{ color: route.color }}>
                        {route.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{language === 'ar' ? route.noteAr : route.noteEn}</div>
                  </div>
                </Html>
              )}
            </group>
          </group>
        );
      })}

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
              {language === 'ar' ? '🔴 اتجاه بروكسيما قنطورس (الميل -62.7°)' : '🔴 Proxima Centauri Direction (Dec −62.7°)'}
            </span>
            <span className="block text-[9px] text-slate-400">
              {language === 'ar' ? 'لا يتجه إليه أي من هذه المسابير' : 'None of these probes is heading there'}
            </span>
          </div>
        </Html>
      </group>
    </group>
  );
};
