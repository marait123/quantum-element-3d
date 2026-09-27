'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import {
  Database,
  Sparkles,
  Video,
  BookOpen,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Flame,
  Atom,
  HelpCircle,
  FlaskConical,
} from 'lucide-react';

export const ScienceToolsDock: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const language = useQuantumStore((s) => s.language);
  const activeWorld = useQuantumStore((s) => s.activeWorld);
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);

  const effectiveWorld = isMounted ? activeWorld : 'subatomic';

  // Modal and Drawer States
  const isCosmicDatabaseOpen = useQuantumStore((s) => s.isCosmicDatabaseOpen);
  const setCosmicDatabaseOpen = useQuantumStore((s) => s.setCosmicDatabaseOpen);
  const isCosmicElementDrawerOpen = useQuantumStore((s) => s.isCosmicElementDrawerOpen);
  const setCosmicElementDrawerOpen = useQuantumStore((s) => s.setCosmicElementDrawerOpen);
  const isUniverseVideoModalOpen = useQuantumStore((s) => s.isUniverseVideoModalOpen);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const isDossierOpen = useQuantumStore((s) => s.isDossierOpen);
  const setDossierOpen = useQuantumStore((s) => s.setDossierOpen);
  const isGridModalOpen = useQuantumStore((s) => s.isGridModalOpen);
  const setGridModalOpen = useQuantumStore((s) => s.setGridModalOpen);
  const isVideoModalOpen = useQuantumStore((s) => s.isVideoModalOpen);
  const setVideoModalOpen = useQuantumStore((s) => s.setVideoModalOpen);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const t = TRANSLATIONS[language]?.scienceHub || TRANSLATIONS.en.scienceHub;

  const scaleVideoKeys = [
    'solar_system',
    'stars_supergiants',
    'milky_way_sgr_a',
    'extragalactic_andromeda',
    'cosmic_web',
  ];

  return (
    <div
      id="science-tools-dock"
      className="fixed end-3 sm:end-4 top-20 z-30 select-none pointer-events-auto flex flex-col items-end gap-2 transition-all duration-300"
    >
      {/* Collapsed Pill Button */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-sky-500/40 text-sky-300 shadow-xl backdrop-blur-xl text-xs font-bold transition-all cursor-pointer group hover:border-sky-400"
          title={t.expand}
        >
          <FlaskConical className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="font-sans">{t.title}</span>
          <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      ) : (
        /* Full Science Tools Command Panel */
        <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-slate-950/88 border border-slate-800/80 shadow-2xl backdrop-blur-2xl w-48 sm:w-56 animate-fadeIn">
          {/* Header with Title and Collapse Button */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800/60 pb-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold tracking-wide">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              title={t.collapse}
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          {/* Universe World Tool Set */}
          {effectiveWorld === 'universe' ? (
            <>
              {/* 1. Master Cosmic Database & NASA Archives */}
              <button
                id="cosmic-database-btn"
                type="button"
                onClick={() => setCosmicDatabaseOpen(!isCosmicDatabaseOpen)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isCosmicDatabaseOpen
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipDatabase}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{t.database}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-mono">
                  NASA
                </span>
              </button>

              {/* 2. Cosmic Elements in Space Drawer */}
              <button
                id="cosmic-elements-btn"
                type="button"
                onClick={() => setCosmicElementDrawerOpen(!isCosmicElementDrawerOpen)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isCosmicElementDrawerOpen
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400/60 shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipElements}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{t.elements}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 font-mono">
                  118
                </span>
              </button>

              {/* 3. Cosmic Cinema Masterclasses */}
              <button
                id="universe-cinema-btn"
                type="button"
                onClick={() => {
                  setUniverseVideoModalOpen(true, scaleVideoKeys[cosmicScaleLevel - 1]);
                }}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isUniverseVideoModalOpen
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-400/60 shadow-lg shadow-rose-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipCinema}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{t.cinema}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/50 font-mono">
                  HD
                </span>
              </button>

              {/* 4. Scientific Dossier & Research Papers */}
              <button
                id="scientific-dossier-btn"
                type="button"
                onClick={() => setDossierOpen(!isDossierOpen)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isDossierOpen
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/60 shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipDossier}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{t.dossier}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-mono">
                  DOI
                </span>
              </button>
            </>
          ) : (
            /* Subatomic World Tool Set */
            <>
              {/* 1. 118 Periodic Table Grid Sheet */}
              <button
                id="grid-118-btn"
                type="button"
                onClick={() => setGridModalOpen(true)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isGridModalOpen
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.grid118}
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{t.grid118}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-mono">
                  IUPAC
                </span>
              </button>

              {/* 2. Quantum Cinema Video Masterclasses */}
              <button
                id="quantum-cinema-btn"
                type="button"
                onClick={() => setVideoModalOpen(true, 'scale')}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isVideoModalOpen
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-400/60 shadow-lg shadow-rose-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipCinema}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">{t.cinema}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/50 font-mono">
                  HD
                </span>
              </button>

              {/* 3. Subatomic Scientific Dossier */}
              <button
                id="subatomic-dossier-btn"
                type="button"
                onClick={() => setDossierOpen(!isDossierOpen)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  isDossierOpen
                    ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/60 shadow-lg shadow-indigo-500/20'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
                title={t.tooltipDossier}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{t.dossier}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-mono">
                  QCD
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
