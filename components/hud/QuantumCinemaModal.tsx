'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Play,
  Video,
  Award,
  Clock,
  Sparkles,
  Orbit,
  CheckCircle2,
  Search,
  Compass,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useQuantumStore, ScaleLevel } from '@/stores/useQuantumStore';
import { ELEMENTS, ELEMENT_MAP } from '@/data/elementsData';
import {
  SCALE_VIDEOS,
  SUBTOPIC_VIDEOS,
  getElementVideo,
  VideoItem,
} from '@/data/videosData';
import { TRANSLATIONS } from '@/data/translations';

export const QuantumCinemaModal: React.FC = () => {
  const isOpen = useQuantumStore((s) => s.isVideoModalOpen);
  const setOpen = useQuantumStore((s) => s.setVideoModalOpen);
  const activeVideoType = useQuantumStore((s) => s.activeVideoType);
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const language = useQuantumStore((s) => s.language);
  const t = TRANSLATIONS[language];

  // Local navigation states inside Cinema
  const [selectedScale, setSelectedScale] = useState<ScaleLevel>(scaleLevel);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [selectedElementNum, setSelectedElementNum] = useState<number>(activeElementNum);
  const [elementSearch, setElementSearch] = useState<string>('');

  // Sync with global store when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedScale(scaleLevel);
      setSelectedElementNum(activeElementNum);
      setSelectedSubtopic(null);
    }
  }, [isOpen, scaleLevel, activeElementNum]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpen]);

  // Selected element object
  const currentElement = useMemo(() => {
    return ELEMENT_MAP[selectedElementNum] || ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [selectedElementNum, activeElementNum]);

  // Scale video calculation
  const currentScaleVideo: VideoItem = useMemo(() => {
    if (selectedSubtopic && SUBTOPIC_VIDEOS[selectedSubtopic]) {
      return SUBTOPIC_VIDEOS[selectedSubtopic];
    }
    return SCALE_VIDEOS[selectedScale] || SCALE_VIDEOS[1];
  }, [selectedScale, selectedSubtopic]);

  // Element video calculation
  const currentElementVideo: VideoItem = useMemo(() => {
    return getElementVideo(
      currentElement.num,
      currentElement.sym,
      currentElement.nameEn,
      currentElement.nameAr
    );
  }, [currentElement]);

  // Active video playing in iframe
  const currentVideo: VideoItem =
    activeVideoType === 'scale' ? currentScaleVideo : currentElementVideo;

  // Filtered elements for quick element picker
  const filteredElements = useMemo(() => {
    if (!elementSearch.trim()) return ELEMENTS;
    const q = elementSearch.toLowerCase().trim();
    return ELEMENTS.filter(
      (el) =>
        el.nameEn.toLowerCase().includes(q) ||
        el.nameAr.includes(q) ||
        el.sym.toLowerCase().includes(q) ||
        el.num.toString() === q
    );
  }, [elementSearch]);

  const scaleNames: Record<ScaleLevel, { nameEn: string; nameAr: string; power: string }> = {
    1: { nameEn: 'Periodic Table', nameAr: 'الجدول الدوري', power: '10⁰ m' },
    2: { nameEn: 'Bohr Atom', nameAr: 'ذرة بور', power: '10⁻¹⁰ m' },
    3: { nameEn: 'Packed Nucleus', nameAr: 'النواة المتراصة', power: '10⁻¹⁴ m' },
    4: { nameEn: 'Valence Quarks', nameAr: 'كواركات التكافؤ', power: '10⁻¹⁸ m' },
    5: { nameEn: 'Planck Strings', nameAr: 'أوتار بلانك', power: '10⁻³⁵ m' },
  };

  // Subtopic mappings for each scale
  const scaleSubtopics: Record<
    ScaleLevel,
    { key: string; labelEn: string; labelAr: string }[]
  > = {
    1: [
      { key: 'mendeleev_table', labelEn: "Mendeleev's Genius", labelAr: 'عبقرية مندلييف' },
    ],
    2: [
      { key: 'atom_orbitals', labelEn: 'Electron Orbitals', labelAr: 'المدارات الإلكترونية' },
    ],
    3: [
      { key: 'proton_structure', labelEn: 'Inside a Proton', labelAr: 'داخل البروتون' },
    ],
    4: [
      { key: 'beta_decay_weak_force', labelEn: 'Weak Force & Beta Decay', labelAr: 'القوة الضعيفة وتحلل بيتا' },
    ],
    5: [
      { key: 'graviton_extra_dimensions', labelEn: 'Graviton & Extra Dimensions', labelAr: 'الغرافيتون والأبعاد الخفية' },
    ],
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div
        id="quantum-cinema-modal"
        className="glass-panel-deep w-full max-w-5xl max-h-[95vh] rounded-3xl flex flex-col border border-sky-400/30 shadow-2xl overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-white tracking-wide">
                  {language === 'ar'
                    ? 'سينما كوانتوم: المحاضرات المرئية لكافة المقاييس والعناصر'
                    : 'Quantum Cinema: Animated Physics Masterclasses'}
                </h3>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  HD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'استكشف شروحات مرئية عالمية لأبعاد المادة الخمسة وجميع عناصر الجدول الدوري الـ 118'
                  : 'Curated world-class animations for all 5 powers of ten & all 118 chemical elements'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="quantum-youtube-direct-link"
              href={currentVideo.id.startsWith('search_') ? currentVideo.embedUrl : `https://www.youtube.com/watch?v=${currentVideo.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
              title={language === 'ar' ? 'مشاهدة مباشرة على يوتيوب' : 'Watch directly on YouTube'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'مشاهدة على YouTube ↗' : 'Watch on YouTube ↗'}
              </span>
            </a>
            <button
              id="quantum-cinema-close"
              onClick={() => setOpen(false)}
              aria-label="Close Cinema"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary View Mode Switcher */}
        <div className="flex items-center justify-between gap-2 p-2 sm:px-5 border-b border-slate-700/40 bg-slate-950/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setOpen(true, 'scale')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeVideoType === 'scale'
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-400/60 shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-sky-400" />
              <span>{language === 'ar' ? 'مقاييس المادة (1 - 5)' : 'Powers of Ten Scales'}</span>
            </button>

            <button
              onClick={() => setOpen(true, 'element')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeVideoType === 'element'
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'مختبر الـ 118 عنصراً' : 'All 118 Elements Lab'}</span>
            </button>
          </div>

          {/* Jump to 3D Action */}
          {activeVideoType === 'scale' ? (
            <button
              onClick={() => {
                setScaleLevel(selectedScale);
                setOpen(false);
              }}
              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-cyan-600/30 text-cyan-200 border border-cyan-400/50 hover:bg-cyan-600/50 transition flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الغوص في هذا المقياس 3D' : 'Explore this Scale in 3D'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveElement(selectedElementNum);
                setScaleLevel(2);
                setOpen(false);
              }}
              className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-600/30 text-amber-200 border border-amber-400/50 hover:bg-amber-600/50 transition flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'عرض العنصر في 3D' : 'View Element in 3D'}
              </span>
            </button>
          )}
        </div>

        {/* Sub-bar for Powers of Ten: 5 Scale Chips */}
        {activeVideoType === 'scale' && (
          <div className="px-3 sm:px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] text-slate-400 font-semibold me-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-sky-400" />
              {language === 'ar' ? 'اختر المقياس:' : 'Select Scale:'}
            </span>

            {([1, 2, 3, 4, 5] as ScaleLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedScale(lvl);
                  setSelectedSubtopic(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  selectedScale === lvl
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{lvl}.</span>
                <span>{language === 'ar' ? scaleNames[lvl].nameAr : scaleNames[lvl].nameEn}</span>
                <span className="text-[10px] opacity-75 font-mono">({scaleNames[lvl].power})</span>
              </button>
            ))}

            {/* Subtopic selector for the chosen scale */}
            {scaleSubtopics[selectedScale]?.length > 0 && (
              <div className="flex items-center gap-1.5 ms-auto">
                <span className="text-[10px] text-slate-500">|</span>
                <button
                  onClick={() => setSelectedSubtopic(null)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    selectedSubtopic === null
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'ar' ? 'الرئيسي' : 'Primary'}
                </button>
                {scaleSubtopics[selectedScale].map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => setSelectedSubtopic(sub.key)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      selectedSubtopic === sub.key
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {language === 'ar' ? sub.labelAr : sub.labelEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-bar for Elements: Search & Popular Fast Jump Chips */}
        {activeVideoType === 'element' && (
          <div className="px-3 sm:px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  language === 'ar'
                    ? 'ابحث بالاسم أو الرمز (1 - 118)...'
                    : 'Search element by name, symbol or Z (1-118)...'
                }
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-8 pe-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Popular Element Chips */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[1, 2, 6, 7, 8, 26, 29, 47, 78, 79, 92, 118].map((num) => {
                const el = ELEMENT_MAP[num];
                if (!el) return null;
                const isSelected = selectedElementNum === num;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedElementNum(num)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {el.sym} #{el.num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
          {/* 16:9 Video Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
            <iframe
              key={currentVideo.id}
              className="w-full h-full"
              src={currentVideo.embedUrl || `https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&rel=0`}
              title={currentVideo.titleEn}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Metadata Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h4 className="text-sm sm:text-lg font-bold text-white">
                {language === 'ar' ? currentVideo.titleAr : currentVideo.titleEn}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  {currentVideo.channel}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentVideo.duration}
                </span>
                <span className="text-slate-600">•</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono bg-slate-800 text-amber-300 border border-amber-500/20">
                  {currentVideo.reputation}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {language === 'ar' ? currentVideo.descriptionAr : currentVideo.descriptionEn}
          </div>

          {/* Key Animation Takeaways */}
          <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-sky-500/20">
            <h5 className="text-xs sm:text-sm font-bold text-sky-400 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              {language === 'ar'
                ? 'أبرز المفاهيم الفيزيائية في هذا الفيديو'
                : 'Key Animation Physics Takeaways'}
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(language === 'ar' ? currentVideo.highlightsAr : currentVideo.highlightsEn).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
