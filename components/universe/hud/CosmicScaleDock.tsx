'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CosmicScaleLevel } from '@/data/universeData';
import { ZoomIn, ZoomOut } from 'lucide-react';

const SHORT_NAMES: Record<number, { en: string; ar: string }> = {
  1: { en: 'Solar System', ar: 'النظام الشمسي' },
  2: { en: 'Stars & Relics', ar: 'الجوار النجمي' },
  3: { en: 'Milky Way', ar: 'درب التبانة' },
  4: { en: 'Extragalactic', ar: 'عالم المجرات' },
  5: { en: 'Cosmic Web', ar: 'النسيج الكوني' },
};

export const CosmicScaleDock: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const requestScaleNavigation = useQuantumStore((s) => s.requestScaleNavigation);
  const cosmicZoomIn = useQuantumStore((s) => s.cosmicZoomIn);
  const cosmicZoomOut = useQuantumStore((s) => s.cosmicZoomOut);
  const language = useQuantumStore((s) => s.language);

  const scaleIcons = ['🪐', '⭐', '🌌', '🌀', '🕸️'];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95vw]">
      {/* Main Glassmorphic Scale Navigation Dock */}
      <div
        id="cosmic-scale-dock"
        className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-xl shadow-2xl"
      >
        {/* Continuous Smooth Zoom Out Button */}
        <button
          type="button"
          onClick={cosmicZoomOut}
          className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تصغير مستمر للخلف' : 'Continuous Zoom Out'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* 5 Cosmic Scale Buttons */}
        <div className="flex items-center gap-1">
          {COSMIC_SCALES.map((scale, idx) => {
            const isActive = cosmicScaleLevel === scale.level;
            const shortName = SHORT_NAMES[scale.level]?.[language] || (language === 'ar' ? scale.nameAr : scale.nameEn);
            const fullName = language === 'ar' ? scale.nameAr : scale.nameEn;

            return (
              <button
                key={scale.level}
                type="button"
                onClick={() => requestScaleNavigation(scale.level as CosmicScaleLevel)}
                title={`${fullName} • ${scale.rangeMetric}`}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm">{scaleIcons[idx]}</span>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[11px] font-bold whitespace-nowrap">{shortName}</span>
                  <span className="text-[9px] opacity-70 tracking-tight hidden md:inline">
                    {scale.rangeMetric}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continuous Smooth Zoom In Button */}
        <button
          type="button"
          onClick={cosmicZoomIn}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تكبير مستمر للأمام' : 'Continuous Zoom In'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
