'use client';

import React from 'react';
import { Waves, Box, Disc3, ShieldAlert } from 'lucide-react';
import { TRANSLATIONS } from '@/data/translations';

interface Props {
  language: 'en' | 'ar';
}

export const TabStringTheory: React.FC<Props> = ({ language }) => {
  const t = TRANSLATIONS[language];
  const st = t.dossier.strings;

  const theories = [
    { key: 'type1', text: st.theories.type1, badge: 'SO(32)' },
    { key: 'type2a', text: st.theories.type2a, badge: 'Type IIA' },
    { key: 'type2b', text: st.theories.type2b, badge: 'Type IIB' },
    { key: 'heteroticSo', text: st.theories.heteroticSo, badge: 'Heterotic SO' },
    { key: 'heteroticE8', text: st.theories.heteroticE8, badge: 'E8 × E8' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Introduction to 1D Planck Strings */}
      <div className="glass-panel p-5 rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
          <Waves className="w-5 h-5 text-purple-400" />
          <h3 className="text-base text-white">{st.title}</h3>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {st.intro}
        </p>
      </div>

      {/* The 5 Superstring Theories */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-cyan-400" />
          {st.theoriesTitle}
        </h4>

        <div className="space-y-2.5">
          {theories.map(({ key, text, badge }) => (
            <div
              key={key}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3"
            >
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 flex-shrink-0 mt-0.5">
                {badge}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 11D M-Theory & Calabi-Yau Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* M-Theory */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
            <Box className="w-4 h-4" />
            <h4 className="text-sm text-white">{st.mTheoryTitle}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {st.mTheoryBody}
          </p>
        </div>

        {/* Calabi-Yau 6D Manifolds */}
        <div className="glass-panel p-4 rounded-2xl border border-sky-500/20">
          <div className="flex items-center gap-2 text-sky-400 font-bold mb-2">
            <Waves className="w-4 h-4" />
            <h4 className="text-sm text-white">{st.calabiYauTitle}</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {st.calabiYauBody}
          </p>
        </div>
      </div>

      {/* Graviton Loop & The Hierarchy Problem */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/20">
        <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-base text-white">{st.gravitonHierarchyTitle}</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {st.gravitonHierarchyBody}
        </p>
      </div>
    </div>
  );
};
