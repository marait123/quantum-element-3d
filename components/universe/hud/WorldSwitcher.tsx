'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { Atom, Compass } from 'lucide-react';

export const WorldSwitcher: React.FC = () => {
  const activeWorld = useQuantumStore((s) => s.activeWorld);
  const setActiveWorld = useQuantumStore((s) => s.setActiveWorld);
  const language = useQuantumStore((s) => s.language);

  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-md shadow-2xl">
      {/* Subatomic World Option */}
      <button
        type="button"
        onClick={() => setActiveWorld('subatomic')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
          activeWorld === 'subatomic'
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Atom className="w-3.5 h-3.5" />
        <span>{language === 'ar' ? 'العالم دون الذري (كوانتوم)' : 'Quantum Subatomic'}</span>
        <span className="hidden sm:inline text-[10px] opacity-75">(10⁰ → 10⁻³⁵m)</span>
      </button>

      {/* Cosmic Universe World Option */}
      <button
        type="button"
        onClick={() => setActiveWorld('universe')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
          activeWorld === 'universe'
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
      >
        <Compass className="w-3.5 h-3.5" />
        <span>{language === 'ar' ? 'الكون الكوني (الفضاء الفسيح)' : 'Cosmic Universe'}</span>
        <span className="hidden sm:inline text-[10px] opacity-75">(10⁷ → 10²⁶m)</span>
      </button>
    </div>
  );
};
