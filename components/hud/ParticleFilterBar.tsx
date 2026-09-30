'use client';

import React from 'react';
import { useQuantumStore, ParticleFilter } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import { useIsCompact } from '@/lib/useMediaQuery';

// Particle symbols for the narrow phone column
const SHORT_LABELS: Record<ParticleFilter, { en: string; ar: string }> = {
  all: { en: 'All', ar: 'الكل' },
  protons: { en: 'p⁺', ar: 'p⁺' },
  neutrons: { en: 'n⁰', ar: 'n⁰' },
  electrons: { en: 'e⁻', ar: 'e⁻' },
};

export const ParticleFilterBar: React.FC = () => {
  const particleFilter = useQuantumStore((s) => s.particleFilter);
  const setParticleFilter = useQuantumStore((s) => s.setParticleFilter);
  const language = useQuantumStore((s) => s.language);
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const isCompact = useIsCompact();

  const t = TRANSLATIONS[language];

  // Only relevant in subatomic scales (Atom, Nucleus, Quarks)
  if (scaleLevel === 1 || scaleLevel === 5) return null;

  const filters: { id: ParticleFilter; label: string; dotColor: string }[] = [
    { id: 'all', label: t.filters.all, dotColor: 'bg-white' },
    { id: 'protons', label: t.filters.protons, dotColor: 'bg-red-500' },
    { id: 'neutrons', label: t.filters.neutrons, dotColor: 'bg-sky-400' },
    { id: 'electrons', label: t.filters.electrons, dotColor: 'bg-amber-400' },
  ];

  // Phones: a slim column under the tools pill, in the gutter the expanded element card leaves free
  if (isCompact) {
    return (
      <div className="absolute top-[128px] end-3 z-20 pointer-events-auto">
        <div className="glass-panel p-1 rounded-2xl flex flex-col items-stretch gap-1 shadow-xl border border-white/10">
          {filters.map((f) => {
            const isActive = particleFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setParticleFilter(f.id)}
                title={f.label}
                aria-label={f.label}
                aria-pressed={isActive}
                className={`min-w-[44px] min-h-[40px] px-1.5 rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 transition font-bold ${
                  isActive
                    ? 'bg-slate-800 text-white border border-sky-400/50 shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${f.dotColor}`} />
                <span dir="ltr">{SHORT_LABELS[f.id][language]}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-16 md:top-20 end-3 md:end-4 z-20 pointer-events-auto">
      <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 shadow-xl border border-white/10">
        {filters.map((f) => {
          const isActive = particleFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setParticleFilter(f.id)}
              className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition font-medium ${
                isActive
                  ? 'bg-slate-800 text-white border border-sky-400/50 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${f.dotColor}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
