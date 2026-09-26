'use client';

import React from 'react';
import { Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { ElementData } from '@/data/elementsData';
import { TRANSLATIONS } from '@/data/translations';

interface Props {
  element: ElementData;
  language: 'en' | 'ar';
}

export const TabOverview: React.FC<Props> = ({ element, language }) => {
  const t = TRANSLATIONS[language];
  const originText = language === 'ar' ? element.originAr : element.origin;
  const usesList = language === 'ar' ? element.usesAr : element.uses;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Cosmic Origin Section */}
      <div className="glass-panel p-5 rounded-2xl border border-sky-500/20">
        <div className="flex items-center gap-2.5 text-sky-400 font-bold mb-3">
          <Compass className="w-5 h-5 text-sky-400" />
          <h3 className="text-base text-white">{t.dossier.overview.originTitle}</h3>
        </div>

        <div className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-500/30">
          ✨ {t.dossier.overview.nucleosynthesisBadge}
        </div>

        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {originText}
        </p>

        <p className="mt-3 text-xs text-slate-400 border-t border-slate-700/50 pt-3">
          {t.dossier.overview.supernovaNote}
        </p>
      </div>

      {/* Technological & Medical Uses */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold mb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base text-white">{t.dossier.overview.usesTitle}</h3>
        </div>

        <div className="space-y-3">
          {usesList.map((useItem, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-200 leading-snug">{useItem}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
