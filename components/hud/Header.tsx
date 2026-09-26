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
  Share2,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import { ELEMENTS } from '@/data/elementsData';
import { WorldSwitcher } from '@/components/universe/hud/WorldSwitcher';
import { SpaceSearchBox } from '@/components/universe/hud/SpaceSearchBox';

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
  const setTutorialOpen = useQuantumStore((s) => s.setTutorialOpen);

  const t = TRANSLATIONS[language];

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2600);
  };

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
    <>
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

        {/* Center Search Bar: Subatomic Elements vs Cosmic Space */}
        <div className="hidden lg:block relative pointer-events-auto">
          {activeWorld === 'subatomic' ? (
            <div className="relative w-64 md:w-80">
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
                      className="w-full px-3 py-2 text-start flex items-center justify-between hover:bg-sky-500/20 text-xs transition cursor-pointer"
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
          ) : (
            <SpaceSearchBox />
          )}
        </div>

        {/* Right Controls: Search (Mobile), 118 Grid, Audio, Language Toggle, Share, Dossier */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Mobile Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="lg:hidden glass-button p-2 rounded-xl text-slate-200"
            title={language === 'ar' ? 'بحث' : 'Search'}
          >
            <Search className="w-4 h-4 text-sky-400" />
          </button>

          {/* 118 Grid Sheet Trigger (Subatomic mode) */}
          {activeWorld === 'subatomic' && (
            <button
              onClick={() => setGridModalOpen(true)}
              className="glass-button px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs text-slate-200 font-semibold cursor-pointer"
              title={t.grid118}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">{t.grid118}</span>
            </button>
          )}

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            className="glass-button p-2 rounded-xl text-slate-200 cursor-pointer"
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
            className="glass-button px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold text-amber-300 cursor-pointer"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Interactive Platform Onboarding Tour Trigger */}
          <button
            id="platform-tour-btn"
            type="button"
            onClick={() => setTutorialOpen(true, 0)}
            className="glass-button px-2.5 py-1.5 rounded-xl bg-purple-600/25 border-purple-400/50 flex items-center gap-1.5 text-xs text-purple-200 font-semibold hover:bg-purple-600/40 hover:text-white transition shadow-lg shadow-purple-500/20 cursor-pointer"
            title={language === 'ar' ? 'دليل المنصة والتحكم (جولة تعريفية)' : 'Platform Guide & Controls Tour'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">
              {language === 'ar' ? 'دليل المنصة' : 'Tour'}
            </span>
          </button>

          {/* Share / Copy Direct View Link */}
          <div className="relative">
            <button
              onClick={handleCopyLink}
              className={`glass-button px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isCopied
                  ? 'bg-emerald-600/40 border-emerald-400 text-emerald-200'
                  : 'text-sky-300 hover:text-white'
              }`}
              title={language === 'ar' ? 'نسخ رابط العرض المباشر' : 'Copy Direct View Link'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isCopied
                  ? language === 'ar' ? 'تم النسخ!' : 'Copied!'
                  : language === 'ar' ? 'مشاركة' : 'Share'}
              </span>
            </button>

            {/* Toast Notification */}
            {isCopied && (
              <div className="absolute top-full mt-2 end-0 px-3 py-1.5 rounded-xl bg-emerald-950/95 border border-emerald-500 text-[11px] font-bold text-emerald-200 shadow-2xl backdrop-blur-xl whitespace-nowrap animate-fadeIn z-50">
                {language === 'ar'
                  ? '🔗 تم نسخ رابط العرض! يمكنك مشاركته أو تحديث الصفحة.'
                  : '🔗 View link copied! Share or refresh anytime.'}
              </div>
            )}
          </div>

          {/* Quantum Cinema Video Masterclasses Trigger (Subatomic mode) */}
          {activeWorld === 'subatomic' && (
            <button
              id="quantum-cinema-btn"
              onClick={() => setVideoModalOpen(true, 'scale')}
              className="glass-button px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600/30 border-rose-400/50 flex items-center gap-1.5 text-xs text-rose-200 font-bold hover:bg-rose-600/50 transition shadow-lg shadow-rose-500/20 cursor-pointer"
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
              className="glass-button px-3 py-1.5 rounded-xl bg-cyan-600/30 border-cyan-400/50 flex items-center gap-1.5 text-xs text-cyan-200 font-bold hover:bg-cyan-600/50 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">{t.openDossier}</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile Search Overlay Popover */}
      {isMobileSearchOpen && (
        <div className="lg:hidden fixed top-16 inset-x-3 z-50 p-3 rounded-2xl bg-slate-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-2xl pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200">
              {activeWorld === 'universe'
                ? language === 'ar'
                  ? '🔭 البحث في أجرام الفضاء والكون'
                  : '🔭 Search Cosmic Bodies & Space'
                : language === 'ar'
                ? '⚛️ البحث في الجدول الدوري'
                : '⚛️ Search Chemical Elements'}
            </span>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeWorld === 'universe' ? (
            <SpaceSearchBox
              isMobileModal
              onCloseMobile={() => setIsMobileSearchOpen(false)}
            />
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-900 border border-sky-500/40 text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 rounded-xl bg-slate-900/80 border border-slate-800">
                  {searchResults.map((el) => (
                    <button
                      key={el.num}
                      type="button"
                      onClick={() => {
                        setActiveElement(el.num);
                        setSearchQuery('');
                        setIsMobileSearchOpen(false);
                      }}
                      className="w-full px-3 py-2.5 text-start flex items-center justify-between hover:bg-sky-500/20 text-xs"
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
        </div>
      )}
    </>
  );
};
