'use client';

import React, { useMemo, useEffect } from 'react';
import { X, Sparkles, Orbit, Cpu, Waves, BookOpen } from 'lucide-react';
import { useQuantumStore, DossierTab } from '@/stores/useQuantumStore';
import { ELEMENT_MAP, CATEGORY_COLORS } from '@/data/elementsData';
import { TRANSLATIONS } from '@/data/translations';

import { TabOverview } from './TabOverview';
import { TabQuantumShells } from './TabQuantumShells';
import { TabSubatomicQCD } from './TabSubatomicQCD';
import { TabStringTheory } from './TabStringTheory';
import { TabPapersVideo } from './TabPapersVideo';

export const ResearchDrawer: React.FC = () => {
  const isOpen = useQuantumStore((s) => s.isDossierOpen);
  const setOpen = useQuantumStore((s) => s.setDossierOpen);
  const activeTab = useQuantumStore((s) => s.activeDossierTab);
  const setActiveTab = useQuantumStore((s) => s.setActiveDossierTab);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const language = useQuantumStore((s) => s.language);

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  const t = TRANSLATIONS[language];
  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  const catMeta = CATEGORY_COLORS[element.cat] || CATEGORY_COLORS.nonmetal;

  if (!isOpen) return null;

  const tabs: { id: DossierTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t.dossier.tabs.overview, icon: Sparkles },
    { id: 'shells', label: t.dossier.tabs.shells, icon: Orbit },
    { id: 'qcd', label: t.dossier.tabs.qcd, icon: Cpu },
    { id: 'strings', label: t.dossier.tabs.strings, icon: Waves },
    { id: 'papers', label: t.dossier.tabs.papers, icon: BookOpen },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel: slides in from right in LTR, from left in RTL */}
      <div
        className={`absolute inset-y-0 ${
          language === 'ar' ? 'start-0' : 'end-0'
        } w-full max-w-2xl glass-panel-deep shadow-2xl border-s border-white/10 flex flex-col z-50`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-lg"
              style={{ backgroundColor: catMeta.hex }}
            >
              {element.sym}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {language === 'ar' ? element.nameAr : element.nameEn}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  #{element.num}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {t.dossier.title} • {element.mass.toFixed(2)} u
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={t.closeDossier}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2.5 sm:px-5 border-b border-slate-700/40 overflow-x-auto scrollbar-none bg-slate-950/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/50 shadow-md shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <TabOverview element={element} language={language} />
          )}
          {activeTab === 'shells' && (
            <TabQuantumShells element={element} language={language} />
          )}
          {activeTab === 'qcd' && <TabSubatomicQCD language={language} />}
          {activeTab === 'strings' && <TabStringTheory language={language} />}
          {activeTab === 'papers' && <TabPapersVideo language={language} />}
        </div>
      </div>
    </div>
  );
};
