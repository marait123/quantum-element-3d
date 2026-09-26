'use client';

import React from 'react';
import { Layers, ShieldAlert, Cpu } from 'lucide-react';
import { TRANSLATIONS } from '@/data/translations';

interface Props {
  language: 'en' | 'ar';
}

export const TabSubatomicQCD: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const qcd = t.dossier.qcd;

  const actors = [
    { key: 'gluon', color: 'border-amber-500/50 text-amber-400', badge: 'SU(3) Octet' },
    { key: 'pion', color: 'border-rose-500/50 text-rose-400', badge: 'Yukawa Meson' },
    { key: 'wz', color: 'border-purple-500/50 text-purple-400', badge: 'Weak Force' },
    { key: 'seaQuarks', color: 'border-cyan-500/50 text-cyan-400', badge: 'Quantum Vacuum' },
    { key: 'photon', color: 'border-yellow-500/50 text-yellow-300', badge: 'Electromagnetic' },
    { key: 'neutrino', color: 'border-emerald-500/50 text-emerald-400', badge: 'Neutral Lepton' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* 99% Mass Paradox Callout */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 relative overflow-hidden">
        <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="text-base text-white">{qcd.massParadoxTitle}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {qcd.massParadoxBody}
        </p>
      </div>

      {/* Fundamental vs Residual Strong Force */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fundamental Strong Force */}
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
            <Cpu className="w-4 h-4" />
            <h4 className="text-sm text-white">{qcd.fundamentalStrongTitle}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {qcd.fundamentalStrongBody}
          </p>
        </div>

        {/* Residual Strong Force */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
            <Layers className="w-4 h-4" />
            <h4 className="text-sm text-white">{qcd.residualStrongTitle}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {qcd.residualStrongBody}
          </p>
        </div>
      </div>

      {/* The 6 Subatomic Actors */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          {qcd.sixActorsTitle}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actors.map(({ key, color, badge }) => {
            const actorData = qcd.actors[key];
            return (
              <div
                key={key}
                className={`p-3 rounded-xl bg-slate-900/60 border ${color} flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">
                    {actorData.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {actorData.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
