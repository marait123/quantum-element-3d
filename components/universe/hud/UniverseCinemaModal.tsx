'use client';

import React, { useMemo } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import {
  COSMIC_SCALE_VIDEOS,
  COSMIC_SUBTOPIC_VIDEOS,
  CosmicVideoItem,
  CosmicScaleVideoMap,
} from '@/data/universeVideosData';
import { X, Play, Clock, Sparkles, CheckCircle2, ExternalLink } from 'lucide-react';

export const UniverseCinemaModal: React.FC = () => {
  const isUniverseVideoModalOpen = useQuantumStore((s) => s.isUniverseVideoModalOpen);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const activeUniverseVideoKey = useQuantumStore((s) => s.activeUniverseVideoKey);
  const language = useQuantumStore((s) => s.language);

  const video: CosmicVideoItem = useMemo(() => {
    if (activeUniverseVideoKey && COSMIC_SUBTOPIC_VIDEOS[activeUniverseVideoKey]) {
      return COSMIC_SUBTOPIC_VIDEOS[activeUniverseVideoKey];
    }
    return COSMIC_SCALE_VIDEOS[cosmicScaleLevel as keyof CosmicScaleVideoMap] || COSMIC_SCALE_VIDEOS[1];
  }, [activeUniverseVideoKey, cosmicScaleLevel]);

  if (!isUniverseVideoModalOpen) return null;

  const title = language === 'ar' ? video.titleAr : video.titleEn;
  const description = language === 'ar' ? video.descriptionAr : video.descriptionEn;
  const highlights = language === 'ar' ? video.highlightsAr : video.highlightsEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Play className="w-4 h-4 fill-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block">
                {language === 'ar' ? 'سينما الفضاء الكوني' : 'Cosmic Universe Cinema'}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-lg">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              id="universe-youtube-direct-link"
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title={language === 'ar' ? 'مشاهدة مباشرة على يوتيوب' : 'Watch directly on YouTube'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'مشاهدة على YouTube ↗' : 'Watch on YouTube ↗'}
              </span>
            </a>
            <button
              id="close-universe-cinema-btn"
              type="button"
              onClick={() => setUniverseVideoModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.titleEn}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        {/* Video Metadata & Educational Context */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-slate-400">
              <span className="font-semibold text-slate-200">{video.channel}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {video.duration}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/80 text-[11px] text-purple-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{video.reputation}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

          {/* Key Physics Takeaways */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2">
              {language === 'ar' ? 'أبرز المفاهيم الفيزيائية في هذا المقطع:' : 'Key Physical Concepts Explored:'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-300"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
