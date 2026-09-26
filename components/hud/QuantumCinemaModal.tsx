'use client';

import React, { useMemo, useEffect } from 'react';
import { X, Play, Video, Award, Clock, Sparkles, Orbit, CheckCircle2 } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENT_MAP } from '@/data/elementsData';
import { SCALE_VIDEOS, getElementVideo, VideoItem } from '@/data/videosData';
import { TRANSLATIONS } from '@/data/translations';

export const QuantumCinemaModal: React.FC = () => {
  const isOpen = useQuantumStore((s) => s.isVideoModalOpen);
  const setOpen = useQuantumStore((s) => s.setVideoModalOpen);
  const activeVideoType = useQuantumStore((s) => s.activeVideoType);
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const language = useQuantumStore((s) => s.language);
  const t = TRANSLATIONS[language];

  const element = useMemo(() => {
    return ELEMENT_MAP[activeElementNum] || ELEMENT_MAP[6];
  }, [activeElementNum]);

  // Scale video for current scale
  const scaleVideo: VideoItem = SCALE_VIDEOS[scaleLevel] || SCALE_VIDEOS[1];

  // Element video for active element
  const elementVideo: VideoItem = useMemo(() => {
    return getElementVideo(element.num, element.sym, element.nameEn, element.nameAr);
  }, [element]);

  // Active playing video based on selected tab
  const currentVideo: VideoItem = activeVideoType === 'scale' ? scaleVideo : elementVideo;

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div id="quantum-cinema-modal" className="glass-panel-deep w-full max-w-5xl max-h-[92vh] rounded-3xl flex flex-col border border-sky-400/30 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {language === 'ar' ? 'سينما كوانتوم: المحاضرات المرئية' : 'Quantum Cinema & Masterclasses'}
                </h3>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  HD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'شروحات مرئية تفاعلية بأنيميشن عالي الدقة لكافة المقاييس والعناصر'
                  : 'High-reputation animations explaining each subatomic scale and chemical element'}
              </p>
            </div>
          </div>

          <button
            id="quantum-cinema-close"
            onClick={() => setOpen(false)}
            aria-label="Close Cinema"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Mode Selection Tabs */}
        <div className="flex items-center gap-2 p-3 sm:px-5 border-b border-slate-700/40 bg-slate-950/40 overflow-x-auto scrollbar-none">
          {/* Tab 1: Current Scale Video */}
          <button
            onClick={() => setOpen(true, 'scale')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
              activeVideoType === 'scale'
                ? 'bg-sky-500/25 text-sky-200 border border-sky-400/60 shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Orbit className="w-4 h-4 text-sky-400" />
            <span>
              {language === 'ar'
                ? `مقياس ${t.scales[scaleLevel].name} (${t.scales[scaleLevel].power})`
                : `Scale: ${t.scales[scaleLevel].name} (${t.scales[scaleLevel].power})`}
            </span>
          </button>

          {/* Tab 2: Active Element Video */}
          <button
            onClick={() => setOpen(true, 'element')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
              activeVideoType === 'element'
                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/60 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4 text-amber-400" />
            <span>
              {language === 'ar'
                ? `عنصر ${element.nameAr} (${element.sym}, #${element.num})`
                : `Element: ${element.nameEn} (${element.sym}, #${element.num})`}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 16:9 Video Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
            <iframe
              key={currentVideo.id}
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${currentVideo.id}?autoplay=1&rel=0`}
              title={currentVideo.titleEn}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Metadata Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                {language === 'ar' ? currentVideo.titleAr : currentVideo.titleEn}
              </h4>
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-300">
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
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-amber-300 border border-amber-500/20">
                  {currentVideo.reputation}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed">
            {language === 'ar' ? currentVideo.descriptionAr : currentVideo.descriptionEn}
          </div>

          {/* Key Animation Takeaways */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-sky-500/20">
            <h5 className="text-xs sm:text-sm font-bold text-sky-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              {language === 'ar' ? 'أبرز المفاهيم الفيزيائية في هذا الفيديو' : 'Key Animation Physics Concepts'}
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(language === 'ar' ? currentVideo.highlightsAr : currentVideo.highlightsEn).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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
