'use client';

import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Layers, Activity, Film } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENT_MAP, CATEGORY_COLORS } from '@/data/elementsData';
import { TRANSLATIONS } from '@/data/translations';

export const ElementBadge: React.FC = () => {
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const language = useQuantumStore((s) => s.language);
  const isCollapsed = useQuantumStore((s) => s.isBadgeCollapsed);
  const setBadgeCollapsed = useQuantumStore((s) => s.setBadgeCollapsed);
  const setVideoModalOpen = useQuantumStore((s) => s.setVideoModalOpen);

  const t = TRANSLATIONS[language];
  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  const catMeta = CATEGORY_COLORS[element.cat] || CATEGORY_COLORS.nonmetal;
  const categoryName = language === 'ar' ? catMeta.nameAr : catMeta.nameEn;

  // Valence quark breakdown
  const upQuarks = 2 * element.p + element.n;
  const downQuarks = element.p + 2 * element.n;

  return (
    <div className="absolute top-16 md:top-20 start-3 md:start-4 z-20 pointer-events-auto transition-all duration-300">
      {/* Collapsed Pill View */}
      {isCollapsed ? (
        <button
          onClick={() => setBadgeCollapsed(false)}
          className="glass-panel px-3 py-2 rounded-2xl flex items-center gap-2.5 shadow-xl hover:border-cyan-400/60 transition group"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
            style={{ backgroundColor: catMeta.hex }}
          >
            {element.sym}
          </div>
          <div className="text-start">
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>{language === 'ar' ? element.nameAr : element.nameEn}</span>
              <span className="text-[10px] text-cyan-400 font-mono">#{element.num}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {element.mass.toFixed(2)} u
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 ms-1 transition" />
        </button>
      ) : (
        /* Expanded Full HUD Card */
        <div className="glass-panel w-72 md:w-80 rounded-2xl p-4 shadow-2xl border border-white/15 relative overflow-hidden backdrop-blur-xl">
          {/* Top category accent stripe */}
          <div
            className="absolute top-0 inset-x-0 h-1"
            style={{ backgroundColor: catMeta.hex }}
          />

          {/* Header Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Symbol Box */}
              <div
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shadow-lg border border-white/20 relative"
                style={{ backgroundColor: `${catMeta.hex}33` }}
              >
                <span className="text-[10px] font-mono text-slate-300 absolute top-1 start-1.5">
                  {element.num}
                </span>
                <span className="text-2xl font-black text-white">{element.sym}</span>
              </div>

              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {language === 'ar' ? element.nameAr : element.nameEn}
                </h2>
                <div
                  className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: catMeta.hex,
                    borderColor: `${catMeta.hex}66`,
                    backgroundColor: `${catMeta.hex}18`,
                  }}
                >
                  {categoryName}
                </div>
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setBadgeCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              title={t.collapseBadge}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-700/50 text-center font-mono">
            <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800">
              <span className="text-[9px] text-red-400 block font-sans">
                {t.hud.protons}
              </span>
              <span className="text-sm font-bold text-red-300">{element.p}</span>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800">
              <span className="text-[9px] text-sky-400 block font-sans">
                {t.hud.neutrons}
              </span>
              <span className="text-sm font-bold text-sky-300">{element.n}</span>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800">
              <span className="text-[9px] text-amber-400 block font-sans">
                {t.hud.electrons}
              </span>
              <span className="text-sm font-bold text-amber-300">{element.e}</span>
            </div>
          </div>

          {/* Subatomic & String Inventory */}
          <div className="mt-2.5 space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                {t.hud.valenceQuarks}:
              </span>
              <span className="font-bold text-cyan-300">
                {upQuarks}u + {downQuarks}d
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                {t.hud.planckStrings}:
              </span>
              <span className="font-bold text-purple-300">
                {element.stringsCount}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg">
              <span className="text-slate-400">{t.hud.atomicWeight}:</span>
              <span className="text-slate-200">
                {element.mass.toFixed(3)} u
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg">
              <span className="text-slate-400">{t.hud.electronConfig}:</span>
              <span className="text-amber-200 font-sans text-[10px]">
                {element.config}
              </span>
            </div>

            {/* Quick Watch Element Video Button */}
            <button
              onClick={() => setVideoModalOpen(true, 'element')}
              className="w-full mt-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition shadow-md group font-sans"
            >
              <Film className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
              <span>
                {language === 'ar'
                  ? `فيديو عنصر ${element.nameAr} (${element.sym}) 🎬`
                  : `Watch ${element.nameEn} Masterclass 🎬`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
