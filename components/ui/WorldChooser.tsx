'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Atom, Compass, ArrowRight, Languages } from 'lucide-react';
import { useQuantumStore, ActiveWorld } from '@/stores/useQuantumStore';

/**
 * First-visit "where do you want to begin?" screen: two living cards (an orbiting atom, a turning galaxy).
 * Picking one zooms into it while that world loads behind; the choice is remembered by the page.
 */

const COPY = {
  en: {
    kicker: 'Ibrahim Science Laboratory',
    title: 'Where will your journey begin?',
    subtitle: 'Two worlds, 61 orders of magnitude apart — from strings vibrating at 10⁻³⁵ m to the cosmic web at 10²⁶ m.',
    footer: 'You can switch worlds anytime from the top bar — we’ll remember where you like to start.',
    worlds: {
      subatomic: {
        name: 'Quantum Subatomic World',
        range: '10⁰ m → 10⁻³⁵ m',
        pitch: 'Dive from the periodic table into atoms, nuclei, quarks and vibrating strings.',
        points: ['All 118 elements in 3D', 'Electron shells, nuclei & quarks', 'Down to the Planck scale'],
        cta: 'Enter the quantum world',
      },
      universe: {
        name: 'Cosmic Universe',
        range: '10⁷ m → 10²⁶ m',
        pitch: 'Fly from our Solar System through the Milky Way into other galaxies and the cosmic web.',
        points: ['Planets, stars & black holes', 'Enter Andromeda and 5 more galaxies', 'Out to the edge of the observable universe'],
        cta: 'Explore the cosmos',
      },
    },
  },
  ar: {
    kicker: 'مختبر إبراهيم العلمي',
    title: 'من أين تبدأ رحلتك؟',
    subtitle: 'عالمان يفصل بينهما 61 رتبة من المقادير — من أوتار تهتز عند 10⁻³⁵ م إلى النسيج الكوني عند 10²⁶ م.',
    footer: 'يمكنك التبديل بين العالمين في أي وقت من الشريط العلوي — وسنتذكر المكان الذي تحب أن تبدأ منه.',
    worlds: {
      subatomic: {
        name: 'العالم الكمومي دون الذري',
        range: '10⁰ m → 10⁻³⁵ m',
        pitch: 'انطلق من الجدول الدوري إلى الذرات والأنوية والكواركات والأوتار المهتزة.',
        points: ['العناصر الـ118 كلها ثلاثية الأبعاد', 'مدارات الإلكترونات والأنوية والكواركات', 'حتى مقياس بلانك'],
        cta: 'ادخل العالم الكمومي',
      },
      universe: {
        name: 'الكون الفسيح',
        range: '10⁷ m → 10²⁶ m',
        pitch: 'حلّق من نظامنا الشمسي عبر درب التبانة إلى مجرات أخرى وحتى النسيج الكوني.',
        points: ['الكواكب والنجوم والثقوب السوداء', 'ادخل أندروميدا و5 مجرات أخرى', 'حتى حافة الكون المرصود'],
        cta: 'استكشف الكون',
      },
    },
  },
} as const;

// Deterministic twinkling star field
function useStars(count: number) {
  return useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: count }, () => ({
      left: rnd() * 100,
      top: rnd() * 100,
      size: 1 + rnd() * 2,
      delay: rnd() * 4,
      duration: 2.5 + rnd() * 3,
    }));
  }, [count]);
}

const AtomVisual: React.FC = () => (
  <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="wc-nucleus-glow">
        <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
      </radialGradient>
      <path id="wc-orbit" d="M 30 120 a 90 34 0 1 0 180 0 a 90 34 0 1 0 -180 0" />
    </defs>
    <circle cx="120" cy="120" r="46" fill="url(#wc-nucleus-glow)" className="wc-glow-pulse" />
    {/* Nucleus: protons and neutrons */}
    {[
      [112, 114, '#f43f5e'], [126, 112, '#38bdf8'], [118, 126, '#38bdf8'], [130, 125, '#f43f5e'],
      [106, 124, '#f43f5e'], [121, 104, '#f43f5e'], [133, 116, '#38bdf8'], [115, 134, '#f43f5e'],
    ].map(([x, y, c], i) => (
      <circle key={i} cx={x as number} cy={y as number} r="7" fill={c as string} opacity="0.95" />
    ))}
    {/* Three tilted electron orbits with electrons travelling along them */}
    {[0, 60, 120].map((deg, i) => (
      <g key={deg} transform={`rotate(${deg} 120 120)`}>
        <use href="#wc-orbit" fill="none" stroke="#67e8f9" strokeOpacity="0.45" strokeWidth="1.5" />
        <circle r="5" fill="#e0f2fe" className="wc-electron">
          <animateMotion dur={`${2.6 + i * 0.7}s`} repeatCount="indefinite" begin={`${i * -0.9}s`}>
            <mpath href="#wc-orbit" />
          </animateMotion>
        </circle>
      </g>
    ))}
  </svg>
);

const GalaxyVisual: React.FC = () => {
  const stars = useMemo(() => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pts: { x: number; y: number; r: number; c: string }[] = [];
    for (let i = 0; i < 520; i++) {
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const t = Math.pow(rnd(), 0.8);
      const radius = 8 + t * 92;
      const angle = arm + Math.log(radius / 8) / 0.32 + (rnd() - 0.5) * 0.55;
      pts.push({
        x: 120 + Math.cos(angle) * radius,
        y: 120 + Math.sin(angle) * radius * 0.55,
        r: 0.6 + rnd() * 1.4,
        c: t < 0.25 ? '#fde68a' : rnd() < 0.12 ? '#f472b6' : '#a5b4fc',
      });
    }
    return pts;
  }, []);
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden>
      <defs>
        <radialGradient id="wc-core-glow">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
          <stop offset="35%" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="wc-galaxy-spin" style={{ transformOrigin: '120px 120px' }}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity="0.85" />
        ))}
      </g>
      <ellipse cx="120" cy="120" rx="38" ry="22" fill="url(#wc-core-glow)" className="wc-glow-pulse" />
      {/* A comet crossing the view */}
      <g className="wc-comet">
        <line x1="0" y1="0" x2="-28" y2="-10" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <circle r="2" fill="#ffffff" />
      </g>
    </svg>
  );
};

export const WorldChooser: React.FC<{ onChoose: (world: ActiveWorld) => void }> = ({ onChoose }) => {
  const language = useQuantumStore((s) => s.language);
  const toggleLanguage = useQuantumStore((s) => s.toggleLanguage);
  const [chosen, setChosen] = useState<ActiveWorld | null>(null);
  const [leaving, setLeaving] = useState(false);
  const stars = useStars(140);
  const t = COPY[language];

  // Let keyboard users pick with 1 / 2
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (chosen) return;
      if (e.key === '1') pick('subatomic');
      if (e.key === '2') pick('universe');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen]);

  const pick = (world: ActiveWorld) => {
    if (chosen) return;
    setChosen(world);
    // Start loading the world behind the zoom, then fade the chooser away
    setTimeout(() => onChoose(world), 250);
    setTimeout(() => setLeaving(true), 450);
  };

  const card = (world: ActiveWorld, index: number) => {
    const w = t.worlds[world];
    const isSub = world === 'subatomic';
    const state = chosen === world ? 'wc-card-chosen' : chosen ? 'wc-card-dismissed' : '';
    return (
      <button
        type="button"
        onClick={() => pick(world)}
        aria-label={w.name}
        className={`wc-card group relative flex flex-col text-start rounded-3xl overflow-hidden border backdrop-blur-xl cursor-pointer focus:outline-none focus-visible:ring-4 ${
          isSub
            ? 'border-cyan-400/30 bg-gradient-to-b from-cyan-950/60 to-slate-950/80 focus-visible:ring-cyan-400/60 hover:border-cyan-300/70'
            : 'border-violet-400/30 bg-gradient-to-b from-violet-950/60 to-slate-950/80 focus-visible:ring-violet-400/60 hover:border-violet-300/70'
        } ${state}`}
        style={{ animationDelay: `${150 + index * 140}ms` }}
      >
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            isSub ? 'bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.22),transparent_60%)]' : 'bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.25),transparent_60%)]'
          }`}
        />
        <div className="relative h-48 sm:h-56 md:h-60 flex items-center justify-center p-4 transition-transform duration-700 group-hover:scale-110">
          {isSub ? <AtomVisual /> : <GalaxyVisual />}
        </div>
        <div className="relative px-6 pb-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {isSub ? <Atom className="w-5 h-5 text-cyan-300" /> : <Compass className="w-5 h-5 text-violet-300" />}
            <h2 className="text-xl font-black text-white">{w.name}</h2>
          </div>
          <span
            className={`self-start px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              isSub ? 'bg-cyan-500/15 text-cyan-200' : 'bg-violet-500/15 text-violet-200'
            }`}
            dir="ltr"
          >
            {w.range}
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">{w.pitch}</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {w.points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isSub ? 'bg-cyan-400' : 'bg-violet-400'}`} />
                {p}
              </li>
            ))}
          </ul>
          <span
            className={`mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all group-hover:gap-3 ${
              isSub ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30' : 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/30'
            }`}
          >
            {w.cta}
            <ArrowRight className="w-4 h-4 flip-in-rtl" />
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="world-chooser-title"
      className={`wc-overlay fixed inset-0 z-[60] overflow-y-auto bg-[#020617] ${leaving ? 'wc-overlay-leaving' : ''}`}
    >
      {/* Twinkling stars and the two worlds' glows meeting in the middle */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(6,182,212,0.16),transparent_55%),radial-gradient(ellipse_at_80%_40%,rgba(139,92,246,0.2),transparent_55%)]" />
        {stars.map((s, i) => (
          <span
            key={i}
            className="wc-star absolute rounded-full bg-white"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
          />
        ))}
      </div>

      <div className="relative min-h-full flex flex-col items-center justify-center gap-8 px-4 pt-20 pb-10 sm:py-10">
        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-4 end-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5" />
          {language === 'ar' ? 'English' : 'العربية'}
        </button>

        <header className="wc-rise text-center max-w-2xl space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/70 text-[11px] font-semibold tracking-widest uppercase text-slate-300">
            {t.kicker}
          </span>
          <h1 id="world-chooser-title" className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">{t.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
          {card('subatomic', 0)}
          {card('universe', 1)}
        </div>

        <p className="wc-rise text-xs text-slate-500 text-center max-w-lg" style={{ animationDelay: '500ms' }}>
          {t.footer}
        </p>
      </div>
    </div>
  );
};
