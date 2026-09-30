'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CosmicScaleLevel, CELESTIAL_BODIES } from '@/data/universeData';
import { Info, X, ZoomIn, ZoomOut } from 'lucide-react';
import { FEATURED_SYSTEMS, GalaxyViewLevel } from '@/lib/galaxyInteriors';

const SHORT_NAMES: Record<number, { en: string; ar: string }> = {
  1: { en: 'Solar System', ar: 'النظام الشمسي' },
  2: { en: 'Stars & Relics', ar: 'الجوار النجمي' },
  3: { en: 'Milky Way', ar: 'درب التبانة' },
  4: { en: 'Extragalactic', ar: 'عالم المجرات' },
  5: { en: 'Cosmic Web', ar: 'النسيج الكوني' },
};

export const GALAXY_SHORT_NAMES: Record<string, { en: string; ar: string }> = {
  milky_way_galaxy: { en: 'the Milky Way', ar: 'درب التبانة' },
  andromeda_galaxy: { en: 'Andromeda', ar: 'أندروميدا' },
  triangulum_galaxy: { en: 'Triangulum', ar: 'المثلث' },
  large_magellanic_cloud: { en: 'Large Magellanic Cloud', ar: 'سحابة ماجلان الكبرى' },
  small_magellanic_cloud: { en: 'Small Magellanic Cloud', ar: 'سحابة ماجلان الصغرى' },
  centaurus_a: { en: 'Centaurus A', ar: 'قنطورس أ' },
  messier_82: { en: 'Cigar Galaxy (M82)', ar: 'مجرة السيجار (M82)' },
};

// Compact names for the dock buttons (full names stay in tooltips, the location chip and the explorer panel)
const DOCK_NAMES: Record<string, { en: string; ar: string }> = {
  large_magellanic_cloud: { en: 'LMC', ar: 'ماجلان الكبرى' },
  small_magellanic_cloud: { en: 'SMC', ar: 'ماجلان الصغرى' },
  messier_82: { en: 'M82', ar: 'M82' },
};

const ENTER_ORDER = [
  'milky_way_galaxy',
  'andromeda_galaxy',
  'triangulum_galaxy',
  'large_magellanic_cloud',
  'small_magellanic_cloud',
  'centaurus_a',
  'messier_82',
];

export const CosmicScaleDock: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const requestScaleNavigation = useQuantumStore((s) => s.requestScaleNavigation);
  const cosmicZoomIn = useQuantumStore((s) => s.cosmicZoomIn);
  const cosmicZoomOut = useQuantumStore((s) => s.cosmicZoomOut);
  const language = useQuantumStore((s) => s.language);

  const insideGalaxyId = useQuantumStore((s) => s.insideGalaxyId);
  const galaxyViewLevel = useQuantumStore((s) => s.galaxyViewLevel);
  const requestGalaxyEntry = useQuantumStore((s) => s.requestGalaxyEntry);

  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const showCosmicCardNow = useQuantumStore((s) => s.showCosmicCardNow);
  const followed = selectedCosmicBodyId ? CELESTIAL_BODIES[selectedCosmicBodyId] : null;

  // The dock's height (plus its bottom offset) as --hud-bottom, so widgets that share the bottom edge on narrower
  // screens (speed widget, explorer chip) can sit above it instead of underneath
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const publish = () => {
      const fromBottom = window.innerHeight - el.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--hud-bottom', `${Math.round(fromBottom)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener('resize', publish);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', publish);
    };
  }, []);

  // Keep the active level visible when the scale strip scrolls (phones)
  const stripRef = useRef<HTMLDivElement>(null);
  const activeKey = insideGalaxyId && insideGalaxyId !== 'milky_way_galaxy' ? `g${galaxyViewLevel}` : `s${cosmicScaleLevel}`;
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]');
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return;
    const target = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
    strip.scrollTo({ left: target, behavior: 'smooth' });
  }, [activeKey]);

  const scaleIcons = ['🪐', '⭐', '🌌', '🌀', '🕸️'];
  const insideName = insideGalaxyId ? GALAXY_SHORT_NAMES[insideGalaxyId]?.[language] : null;
  const insideOtherGalaxy = !!insideGalaxyId && insideGalaxyId !== 'milky_way_galaxy';

  return (
    <div
      ref={rootRef}
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-max max-w-[calc(100vw-1rem)]"
    >
      {/* Following a selected object: stop following (the touch equivalent of Escape), or bring its card back */}
      {followed && (
        <div className="flex items-center gap-1 ps-3 pe-1 py-1 rounded-full bg-slate-900/85 border border-purple-500/50 backdrop-blur-xl shadow-lg text-xs max-w-full">
          <span className="text-purple-200 font-semibold truncate">
            🎯 {language === 'ar' ? `تتبع ${followed.nameAr}` : `Following ${followed.nameEn}`}
          </span>
          <button
            type="button"
            onClick={showCosmicCardNow}
            className="shrink-0 p-1.5 coarse:p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label={language === 'ar' ? 'عرض البطاقة' : 'Show info card'}
            title={language === 'ar' ? 'عرض البطاقة' : 'Show info card'}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <button
            id="stop-following-btn"
            type="button"
            onClick={() => setSelectedCosmicBodyId(null)}
            className="shrink-0 p-1.5 coarse:p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label={language === 'ar' ? 'إيقاف التتبع' : 'Stop following'}
            title={language === 'ar' ? 'إيقاف التتبع (Esc)' : 'Stop following (Esc)'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Where am I: the galaxy the camera is inside, or quick "enter a galaxy" pills out in deep space */}
      {insideOtherGalaxy ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 border border-indigo-500/50 backdrop-blur-xl shadow-lg text-xs">
          <span className="text-indigo-200 font-semibold">
            📍 {language === 'ar' ? `داخل ${insideName}` : `Inside ${insideName}`}
          </span>
          <button
            type="button"
            onClick={() => requestScaleNavigation(4)}
            className="px-2 py-0.5 coarse:px-3 coarse:py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            {language === 'ar' ? 'مغادرة' : 'Leave'}
          </button>
        </div>
      ) : cosmicScaleLevel >= 4 ? (
        <div className="flex flex-nowrap sm:flex-wrap items-center sm:justify-center gap-1.5 px-2 py-1.5 rounded-2xl bg-slate-900/75 border border-slate-700/50 backdrop-blur-xl shadow-lg max-w-full overflow-x-auto sm:overflow-visible no-scrollbar">
          <span className="shrink-0 text-[11px] text-slate-400 font-semibold px-1 whitespace-nowrap">
            {language === 'ar' ? '🚀 ادخل مجرة:' : '🚀 Enter a galaxy:'}
          </span>
          {ENTER_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => requestGalaxyEntry(id)}
              className="shrink-0 px-2.5 py-1 coarse:py-2 rounded-full text-[11px] font-semibold text-slate-200 bg-slate-800/80 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {GALAXY_SHORT_NAMES[id][language]}
            </button>
          ))}
        </div>
      ) : null}

      {/* Main Glassmorphic Scale Navigation Dock */}
      <div
        id="cosmic-scale-dock"
        className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-xl shadow-2xl max-w-full"
      >
        {/* Continuous Smooth Zoom Out Button (pinned: never scrolls out of reach) */}
        <button
          type="button"
          onClick={cosmicZoomOut}
          className="shrink-0 p-2 coarse:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تصغير مستمر للخلف' : 'Continuous Zoom Out'}
          aria-label={language === 'ar' ? 'تصغير' : 'Zoom out'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* 5 levels. Inside another galaxy the first three become that galaxy's own levels (star system → its
            stars → the galaxy), exactly like Solar System → Stars & Relics → Milky Way for our own. */}
        <div ref={stripRef} className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar snap-x">
          {COSMIC_SCALES.map((scale, idx) => {
            const galaxyLevel = insideOtherGalaxy && scale.level <= 3 ? (scale.level as GalaxyViewLevel) : null;
            const isActive = galaxyLevel
              ? galaxyViewLevel === galaxyLevel
              : insideOtherGalaxy
              ? false
              : cosmicScaleLevel === scale.level;
            let icon = scaleIcons[idx];
            let title = SHORT_NAMES[scale.level]?.[language] || (language === 'ar' ? scale.nameAr : scale.nameEn);
            let subtitle = scale.rangeMetric;
            let tooltip = `${language === 'ar' ? scale.nameAr : scale.nameEn} • ${scale.rangeMetric}`;
            if (galaxyLevel && insideGalaxyId) {
              const featured = FEATURED_SYSTEMS[insideGalaxyId];
              const galaxyName = (DOCK_NAMES[insideGalaxyId] ?? GALAXY_SHORT_NAMES[insideGalaxyId])?.[language] ?? '';
              const fullGalaxyName = GALAXY_SHORT_NAMES[insideGalaxyId]?.[language] ?? '';
              if (galaxyLevel === 1) {
                icon = featured?.bodyId === 'pa_99_n2_star' ? '🪐' : '⭐';
                title = featured ? featured[language] : title;
                subtitle = language === 'ar' ? 'نظام نجمي' : 'Star system';
              } else if (galaxyLevel === 2) {
                icon = '✨';
                title = language === 'ar' ? `نجوم ${galaxyName}` : `${galaxyName} Stars`;
                subtitle = language === 'ar' ? 'النجوم والبقايا' : 'Stars & relics';
              } else {
                icon = '🌀';
                title = galaxyName;
                subtitle = language === 'ar' ? 'المجرة' : 'Galaxy';
              }
              tooltip = `${title} • ${subtitle} • ${fullGalaxyName}`;
            }

            return (
              <button
                key={scale.level}
                type="button"
                onClick={() =>
                  galaxyLevel && insideGalaxyId
                    ? requestGalaxyEntry(insideGalaxyId, galaxyLevel)
                    : requestScaleNavigation(scale.level as CosmicScaleLevel)
                }
                title={tooltip}
                data-active={isActive}
                className={`relative shrink-0 snap-center px-2.5 sm:px-3 py-1.5 coarse:py-2 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400 scale-105'
                    : galaxyLevel
                    ? 'text-indigo-200 hover:text-white hover:bg-indigo-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="text-sm">{icon}</span>
                <div className="flex flex-col items-start leading-none text-start">
                  <span className="text-[11px] font-bold whitespace-nowrap">{title}</span>
                  <span className="text-[9px] opacity-70 tracking-tight hidden md:inline">{subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continuous Smooth Zoom In Button */}
        <button
          type="button"
          onClick={cosmicZoomIn}
          className="shrink-0 p-2 coarse:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'ar' ? 'تكبير مستمر للأمام' : 'Continuous Zoom In'}
          aria-label={language === 'ar' ? 'تكبير' : 'Zoom in'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
