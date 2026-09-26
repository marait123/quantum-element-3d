'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CosmicScaleLevel } from '@/data/universeData';
import { ZoomIn, ZoomOut, Rocket, Target, Sparkles, Video, HelpCircle } from 'lucide-react';

export const CosmicScaleDock: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const requestScaleNavigation = useQuantumStore((s) => s.requestScaleNavigation);
  const cosmicZoomIn = useQuantumStore((s) => s.cosmicZoomIn);
  const cosmicZoomOut = useQuantumStore((s) => s.cosmicZoomOut);
  const navigationMode = useQuantumStore((s) => s.navigationMode);
  const toggleNavigationMode = useQuantumStore((s) => s.toggleNavigationMode);
  const isCosmicElementDrawerOpen = useQuantumStore((s) => s.isCosmicElementDrawerOpen);
  const setCosmicElementDrawerOpen = useQuantumStore((s) => s.setCosmicElementDrawerOpen);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const language = useQuantumStore((s) => s.language);

  const scaleIcons = ['🪐', '⭐', '🌌', '🌀', '🕸️'];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95vw]">
      {/* Keyboard Helper Pill when in Free Flight Mode */}
      {navigationMode === 'fly' && (
        <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-purple-500/50 backdrop-blur-md text-[11px] text-purple-200 flex items-center gap-2 shadow-lg animate-bounce">
          <Rocket className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {language === 'ar'
              ? 'وضع الطيران حر: استخدم مفاتيح W, A, S, D للتحرك، Q و E للارتفاع، والماوس للتوجيه'
              : 'Free Flight: Use W, A, S, D to move, Q/E for vertical, Mouse to look'}
          </span>
        </div>
      )}

      {/* Main Glassmorphic Dock */}
      <div
        id="cosmic-scale-dock"
        className="flex items-center gap-1.5 p-2 rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-xl shadow-2xl"
      >
        {/* Continuous Smooth Zoom Out Button */}
        <button
          type="button"
          onClick={cosmicZoomOut}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تصغير مستمر للخلف' : 'Continuous Zoom Out'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* 5 Cosmic Scale Buttons */}
        <div className="flex items-center gap-1">
          {COSMIC_SCALES.map((scale, idx) => {
            const isActive = cosmicScaleLevel === scale.level;
            const name = language === 'ar' ? scale.nameAr : scale.nameEn;

            return (
              <button
                key={scale.level}
                type="button"
                onClick={() => requestScaleNavigation(scale.level as CosmicScaleLevel)}
                className={`relative px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400 scale-105'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm">{scaleIcons[idx]}</span>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-[11px] font-bold">{name}</span>
                  <span className="text-[9px] opacity-70 tracking-tight">{scale.rangeMetric}</span>
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

        {/* Separator */}
        <div className="w-[1px] h-6 bg-slate-700 mx-1" />

        {/* Navigation Mode Toggle: Orbit vs Free-Flight */}
        <button
          type="button"
          onClick={toggleNavigationMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            navigationMode === 'fly'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={language === 'ar' ? 'تبديل وضع الاستكشاف (طيران / مدار)' : 'Toggle Navigation (Fly / Orbit)'}
        >
          {navigationMode === 'fly' ? <Rocket className="w-3.5 h-3.5 text-purple-200" /> : <Target className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">
            {navigationMode === 'fly'
              ? language === 'ar' ? 'طيران حر 🚀' : 'Fly Mode 🚀'
              : language === 'ar' ? 'مدار هدف 🎯' : 'Orbit Mode 🎯'}
          </span>
        </button>

        {/* Cosmic Elements in Space Drawer Trigger */}
        <button
          type="button"
          onClick={() => setCosmicElementDrawerOpen(!isCosmicElementDrawerOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isCosmicElementDrawerOpen
              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 font-bold'
              : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
          }`}
          title={language === 'ar' ? 'مواقع العناصر في الكون' : 'Cosmic Elements'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {language === 'ar' ? 'عناصر الكون 🧪' : 'Cosmic Elements 🧪'}
          </span>
        </button>

        {/* Video Masterclass Trigger */}
        <button
          id="universe-cinema-btn"
          type="button"
          onClick={() => {
            const scaleKeys = ['solar_system', 'stars_supergiants', 'milky_way_sgr_a', 'extragalactic_andromeda', 'cosmic_web'];
            setUniverseVideoModalOpen(true, scaleKeys[cosmicScaleLevel - 1]);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer"
          title={language === 'ar' ? 'فيديو تعليمي لهذا المستوى' : 'Scale Masterclass Video'}
        >
          <Video className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{language === 'ar' ? 'فيديو' : 'Video'}</span>
        </button>
      </div>
    </div>
  );
};
