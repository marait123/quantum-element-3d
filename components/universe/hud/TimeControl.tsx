'use client';

import React, { useEffect, useState } from 'react';
import { Pause, Play, Clock } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { EARTH_YEAR_SECONDS, setSimTimeScale, simClock, onSimClockChange } from '@/lib/simClock';
import { useIsCompact } from '@/lib/useMediaQuery';

// Simulation time: the date the sky is showing (it starts at today's real date) and how fast it runs.
// At ×1 one Earth year takes EARTH_YEAR_SECONDS (3 minutes).
const SPEEDS = [1, 10, 100];

function formatSkyDate(language: 'en' | 'ar') {
  const ms = simClock.epochMs + (simClock.time / EARTH_YEAR_SECONDS) * 365.25 * 86400000;
  return new Date(ms).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const TimeControl: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const isCompact = useIsCompact();
  const [scale, setScale] = useState(simClock.scale);
  const [lastSpeed, setLastSpeed] = useState(1);
  const [date, setDate] = useState(() => formatSkyDate(language));

  useEffect(() => onSimClockChange(() => setScale(simClock.scale)), []);
  // The date label ticks a few times a second (cheap; nothing else re-renders)
  useEffect(() => {
    const id = setInterval(() => setDate(formatSkyDate(language)), 250);
    return () => clearInterval(id);
  }, [language]);

  const paused = scale === 0;
  const t = {
    pause: language === 'ar' ? 'إيقاف الزمن' : 'Pause time',
    play: language === 'ar' ? 'تشغيل الزمن' : 'Resume time',
    speed: language === 'ar' ? 'سرعة الزمن' : 'Time speed',
    date: language === 'ar' ? 'تاريخ السماء المعروضة' : 'Date shown in the sky',
  };

  return (
    <div
      id="time-control"
      className="fixed start-3 sm:start-4 z-30 bottom-[calc(var(--hud-bottom,72px)+4rem)] xl:bottom-[4.1rem] flex items-center gap-1 p-1 rounded-2xl bg-slate-950/85 border border-slate-700/70 backdrop-blur-xl shadow-2xl pointer-events-auto select-none"
    >
      <button
        type="button"
        onClick={() => {
          if (paused) setSimTimeScale(lastSpeed);
          else {
            setLastSpeed(scale);
            setSimTimeScale(0);
          }
        }}
        className="p-1.5 coarse:p-2 rounded-xl text-slate-200 hover:bg-slate-800 cursor-pointer"
        title={paused ? t.play : t.pause}
        aria-label={paused ? t.play : t.pause}
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
      <span className="flex items-center gap-1 px-1.5 text-[11px] font-mono text-slate-300 tabular-nums" title={t.date}>
        <Clock className="w-3 h-3 text-cyan-400" />
        {date}
      </span>
      {isCompact ? (
        <button
          type="button"
          onClick={() => setSimTimeScale(SPEEDS[(SPEEDS.indexOf(scale) + 1) % SPEEDS.length] ?? 1)}
          className="px-2.5 py-1 min-h-9 min-w-10 rounded-xl text-[11px] font-mono font-bold bg-slate-900/80 text-cyan-300 cursor-pointer"
          aria-label={t.speed}
        >
          {paused ? '0×' : `${scale}×`}
        </button>
      ) : (
        SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSimTimeScale(s)}
            className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold cursor-pointer transition ${
              scale === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
            title={`${t.speed}: ${s}×`}
          >
            {s}×
          </button>
        ))
      )}
    </div>
  );
};
