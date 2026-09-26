'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Volume2,
  VolumeX,
  Globe,
  BookOpen,
  LayoutGrid,
  Atom,
  Film,
} from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import { ELEMENTS } from '@/data/elementsData';
import { WorldSwitcher } from '@/components/universe/hud/WorldSwitcher';

export const Header: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const toggleLanguage = useQuantumStore((s) => s.toggleLanguage);
  const isAudioMuted = useQuantumStore((s) => s.isAudioMuted);
  const toggleAudio = useQuantumStore((s) => s.toggleAudio);
  const setDossierOpen = useQuantumStore((s) => s.setDossierOpen);
  const setGridModalOpen = useQuantumStore((s) => s.setGridModalOpen);
  const setVideoModalOpen = useQuantumStore((s) => s.setVideoModalOpen);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const activeWorld = useQuantumStore((s) => s.activeWorld);

  const t = TRANSLATIONS[language];

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return ELEMENTS.filter((el) => {
      return (
        el.num.toString() === query ||
        el.sym.toLowerCase() === query ||
        el.nameEn.toLowerCase().includes(query) ||
        el.nameAr.includes(query)
      );
    }).slice(0, 6);
  }, [searchQuery]);

  return (
    <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 md:p-4 pointer-events-none gap-2">
      {/* Brand & Subtitle + World Switcher */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 shrink-0">
          <Atom className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200 bg-clip-text text-transparent">
            {t.brandTitle}
          </h1>
          <p className="text-[10px] md:text-xs text-sky-400 font-mono tracking-wider">
            {t.brandSubtitle}
          </p>
        </div>

        {/* Top-Level World Switcher (Quantum Subatomic ⟷ Cosmic Universe) */}
        <div className="ms-1 sm:ms-3">
          <WorldSwitcher />
        </div>
      </div>

      {/* Center Search Bar with Instant Autocomplete (Subatomic mode) */}
      {activeWorld === 'subatomic' && (
        <div className="hidden lg:block relative w-64 md:w-80 pointer-events-auto">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-4 py-1.5 rounded-xl glass-panel text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 inset-x-0 glass-panel-deep rounded-xl border border-sky-500/30 overflow-hidden shadow-2xl py-1 z-50">
              {searchResults.map((el) => (
                <button
                  key={el.num}
                  type="button"
                  onMouseDown={() => {
                    setActiveElement(el.num);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-start flex items-center justify-between hover:bg-sky-500/20 text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 font-bold w-6">
                      {el.num}
                    </span>
                    <span className="font-bold text-white">{el.sym}</span>
                    <span className="text-slate-300">
                      {language === 'ar' ? el.nameAr : el.nameEn}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {el.mass.toFixed(1)} u
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right Controls: 118 Grid, Audio, Language Toggle, Dossier */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* 118 Grid Sheet Trigger (Subatomic mode) */}
        {activeWorld === 'subatomic' && (
          <button
            onClick={() => setGridModalOpen(true)}
            className="glass-button px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs text-slate-200 font-semibold"
            title={t.grid118}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{t.grid118}</span>
          </button>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleAudio}
          className="glass-button p-2 rounded-xl text-slate-200"
          title={isAudioMuted ? t.soundOff : t.soundOn}
          aria-label={isAudioMuted ? t.soundOff : t.soundOn}
        >
          {isAudioMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {/* Bilingual Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="glass-button px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold text-amber-300"
          title="Switch Language / تبديل اللغة"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* Quantum Cinema Video Masterclasses Trigger (Subatomic mode) */}
        {activeWorld === 'subatomic' && (
          <button
            id="quantum-cinema-btn"
            onClick={() => setVideoModalOpen(true, 'scale')}
            className="glass-button px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600/30 border-rose-400/50 flex items-center gap-1.5 text-xs text-rose-200 font-bold hover:bg-rose-600/50 transition shadow-lg shadow-rose-500/20"
            title={language === 'ar' ? 'سينما كوانتوم: المحاضرات المرئية' : 'Quantum Cinema & Masterclasses'}
          >
            <Film className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden sm:inline">
              {language === 'ar' ? 'فيديوهات' : 'Cinema 🎬'}
            </span>
          </button>
        )}

        {/* Scientific Dossier Drawer Trigger (Subatomic mode) */}
        {activeWorld === 'subatomic' && (
          <button
            onClick={() => setDossierOpen(true)}
            className="glass-button px-3 py-1.5 rounded-xl bg-cyan-600/30 border-cyan-400/50 flex items-center gap-1.5 text-xs text-cyan-200 font-bold hover:bg-cyan-600/50 transition shadow-lg shadow-cyan-500/20"
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">{t.openDossier}</span>
          </button>
        )}
      </div>
    </header>
  );
};
