'use client';

import React, { useState } from 'react';
import { Sparkles, Compass, CheckCircle2, Search, ExternalLink, Camera } from 'lucide-react';
import { ElementData } from '@/data/elementsData';
import { ELEMENT_IMAGES } from '@/data/elementImagesData';
import { TRANSLATIONS } from '@/data/translations';

interface Props {
  element: ElementData;
  language: 'en' | 'ar';
}

export const TabOverview: React.FC<Props> = ({ element, language }) => {
  const [imageError, setImageError] = useState(false);
  const t = TRANSLATIONS[language];
  const originText = language === 'ar' ? element.originAr : element.origin;
  const usesList = language === 'ar' ? element.usesAr : element.uses;

  const elementImg = ELEMENT_IMAGES[element.num];

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${element.nameEn} chemical element ${element.sym}`
  )}`;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Real Element Sample Photograph Card */}
      {elementImg?.url && !imageError && (
        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 overflow-hidden relative group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base text-white">
                {language === 'ar' ? 'عينة حقيقية للمادة الكيميائية' : 'Authentic Elemental Sample'}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              #{element.num} {element.sym}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Image Container with Hover Zoom */}
            <div className="w-full sm:w-48 h-40 sm:h-36 rounded-xl overflow-hidden border border-white/20 relative shrink-0 bg-slate-900 shadow-xl">
              <img
                src={elementImg.url}
                alt={element.nameEn}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-1.5 start-2 text-[10px] font-mono text-cyan-200 font-bold drop-shadow">
                {element.sym} • {element.mass.toFixed(2)} u
              </div>
            </div>

            {/* Description & Scientific Attribution */}
            <div className="flex-1 flex flex-col justify-between self-stretch text-xs space-y-2">
              <div>
                <h4 className="font-semibold text-slate-100 text-sm">
                  {language === 'ar' ? elementImg.titleAr : elementImg.titleEn}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {elementImg.attribution}
                </p>
              </div>

              {/* Direct Google Search Button */}
              <div className="pt-2">
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600/80 to-blue-600/80 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-sky-600/25 border border-sky-400/40 group cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-sky-200 group-hover:scale-110 transition" />
                  <span>
                    {language === 'ar'
                      ? `ابحث عن ${element.nameAr} في Google 🔍`
                      : `Search Google for ${element.nameEn} 🔍`}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cosmic Origin Section */}
      <div className="glass-panel p-5 rounded-2xl border border-sky-500/20">
        <div className="flex items-center gap-2.5 text-sky-400 font-bold mb-3">
          <Compass className="w-5 h-5 text-sky-400" />
          <h3 className="text-base text-white">{t.dossier.overview.originTitle}</h3>
        </div>

        <div className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-500/30">
          ✨ {t.dossier.overview.nucleosynthesisBadge}
        </div>

        <p className="text-sm leading-relaxed text-slate-200 font-medium">
          {originText}
        </p>

        <p className="mt-3 text-xs text-slate-400 border-t border-slate-700/50 pt-3">
          {t.dossier.overview.supernovaNote}
        </p>
      </div>

      {/* Technological & Medical Uses */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold mb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base text-white">{t.dossier.overview.usesTitle}</h3>
        </div>

        <div className="space-y-3">
          {usesList.map((useItem, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-200 leading-snug">{useItem}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
