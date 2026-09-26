'use client';

import React from 'react';
import { Orbit, Zap } from 'lucide-react';
import { ElementData } from '@/data/elementsData';
import { TRANSLATIONS } from '@/data/translations';

interface Props {
  element: ElementData;
  language: 'en' | 'ar';
}

const SHELL_NAMES = ['K (n=1)', 'L (n=2)', 'M (n=3)', 'N (n=4)', 'O (n=5)', 'P (n=6)', 'Q (n=7)'];
const THEORETICAL_CAPACITIES = [2, 8, 18, 32, 32, 18, 8];

export const TabQuantumShells: React.FC<Props> = ({ element, language }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Electron Configuration Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
          <Orbit className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base text-white">{t.dossier.shells.title}</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">{t.dossier.shells.subtitle}</p>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 font-mono text-cyan-300 text-sm tracking-wider flex items-center justify-between">
          <span className="text-slate-400 text-xs font-sans">
            {t.hud.electronConfig}:
          </span>
          <span className="font-bold text-amber-300 text-base">{element.config}</span>
        </div>

        {/* Pauling Electronegativity */}
        <div className="mt-3.5 flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            {t.hud.electronegativity}:
          </span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {element.eneg !== null ? element.eneg : (language === 'ar' ? 'غير محدد' : 'N/A')}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {t.dossier.shells.electronegativityNote}
        </p>
      </div>

      {/* Bohr Shell Population Meters */}
      <div className="glass-panel p-5 rounded-2xl border border-purple-500/20">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          {t.dossier.shells.bohrModelTitle}
        </h4>

        <div className="space-y-3.5">
          {element.shells.map((count, idx) => {
            const shellLabel = SHELL_NAMES[idx] || `Shell ${idx + 1}`;
            const maxCap = THEORETICAL_CAPACITIES[idx] || 32;
            const percentage = Math.min(100, Math.round((count / maxCap) * 100));

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{shellLabel}</span>
                  <span className="text-cyan-300 font-bold">
                    {count} / {maxCap} e⁻ ({percentage}%)
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-900/90 overflow-hidden border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
