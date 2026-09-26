'use client';

import React, { useState, useEffect } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES } from '@/data/universeData';
import {
  X,
  PlayCircle,
  Atom,
  Compass,
  Flame,
  Orbit,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Move,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useDraggableCard } from '@/lib/useDraggableCard';

export const CelestialInspectorTooltip: React.FC = () => {
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const language = useQuantumStore((s) => s.language);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [selectedCosmicBodyId]);

  const { pos, isDragging, handlePointerDown } = useDraggableCard({
    initialX: 20,
    initialY: 76,
    cardWidth: 384,
    cardHeight: 520,
    disabledOnMobile: true,
  });

  if (!selectedCosmicBodyId || !CELESTIAL_BODIES[selectedCosmicBodyId]) {
    return null;
  }

  const body = CELESTIAL_BODIES[selectedCosmicBodyId];
  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const description = language === 'ar' ? body.descriptionAr : body.descriptionEn;
  const nucleosynthesisRole = language === 'ar' ? body.nucleosynthesisRoleAr : body.nucleosynthesisRoleEn;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${body.nameEn} astronomy space science`
  )}`;

  return (
    <div
      className={`fixed z-40 select-none pointer-events-auto transition-shadow duration-200 ${
        isDragging ? 'opacity-95 shadow-2xl scale-[1.01]' : ''
      }`}
      style={{
        left: isCollapsed ? 20 : pos.x,
        top: isCollapsed ? 76 : pos.y,
        touchAction: 'none',
      }}
    >
      {/* Collapsed Pill View */}
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl border border-slate-700/80 backdrop-blur-xl text-slate-100 hover:border-purple-400/60 transition group cursor-pointer"
        >
          <div
            className="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
            style={{ backgroundColor: body.color }}
          />
          <span className="font-bold text-xs text-white truncate max-w-[160px]">{displayName}</span>
          <span className="text-[10px] text-purple-300 font-mono capitalize">
            {body.type.replace('_', ' ')}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-300 ms-1 transition" />
        </button>
      ) : (
        /* Expanded Full HUD Card */
        <div
          id="celestial-inspector-card"
          className="w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950/92 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden animate-fadeIn"
        >
          {/* Header Bar (Draggable) */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/70 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
                style={{ backgroundColor: body.color }}
              />
              <h3 className="font-bold text-base text-white truncate">{displayName}</h3>
            </div>

            {/* Actions: Drag Handle, Minimize, Close */}
            <div className="flex items-center gap-1">
              <div
                className="p-1 text-slate-500 hover:text-slate-300 transition cursor-grab active:cursor-grabbing"
                title={language === 'ar' ? 'اسحب لتحريك البطاقة' : 'Drag to reposition'}
              >
                <Move className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={language === 'ar' ? 'تصغير' : 'Collapse'}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                id="close-celestial-tooltip-btn"
                type="button"
                onClick={() => setSelectedCosmicBodyId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3.5 max-h-[65vh] md:max-h-[72vh] overflow-y-auto">
            {/* Authentic Telescopic / Mission Image */}
            {body.imageUrl && (
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/70 group shadow-lg">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 bg-slate-900/80 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-500">
                    <ImageIcon className="w-6 h-6 animate-spin text-purple-400" />
                    <span className="text-[10px] font-mono">
                      {language === 'ar' ? 'جارٍ تحميل الصورة الأرشيفية...' : 'Loading NASA Archive...'}
                    </span>
                  </div>
                )}
                {!imageError ? (
                  <img
                    key={body.imageUrl}
                    src={body.imageUrl}
                    alt={displayName}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1 bg-slate-900/60">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                    <span className="text-[10px]">
                      {language === 'ar' ? 'صورة تلسكوبية غير متاحة حالياً' : 'Telescopic Image Unavailable'}
                    </span>
                  </div>
                )}

                {/* Bottom Shadow Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Authentic Attribution Badge */}
                {body.imageSource && (
                  <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between text-[10px] text-slate-300 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 truncate font-mono text-[9px] flex items-center gap-1.5 shadow-md">
                      <Camera className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                      <span className="truncate text-slate-200">{body.imageSource}</span>
                    </span>
                    <a
                      href={body.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pointer-events-auto px-2 py-0.5 rounded-md bg-slate-950/80 hover:bg-purple-950/90 backdrop-blur-md border border-slate-700/60 text-purple-300 hover:text-white transition flex items-center gap-1 text-[9px] shadow-md cursor-pointer"
                      title={language === 'ar' ? 'عرض الصورة الأصلية عالية الدقة ↗' : 'View Full-Resolution Image ↗'}
                    >
                      <span>HD</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Facts Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  {language === 'ar' ? 'المسافة من الأرض' : 'Distance from Earth'}
                </span>
                <span className="font-semibold text-slate-200">{body.distanceFromEarth}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  {language === 'ar' ? 'الكتلة' : 'Mass'}
                </span>
                <span className="font-semibold text-slate-200">{body.mass}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  {language === 'ar' ? 'نصف القطر' : 'Radius'}
                </span>
                <span className="font-semibold text-slate-200">{body.radius}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  {language === 'ar' ? 'النوع / التصنيف' : 'Type / Class'}
                </span>
                <span className="font-semibold text-purple-300 capitalize">
                  {body.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Temperature (if available) */}
            {body.temperature && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px]">{body.temperature}</span>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

            {/* Nucleosynthesis Role */}
            {nucleosynthesisRole && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-purple-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ar' ? 'دور التخليق الكوني للعناصر' : 'Cosmic Nucleosynthesis Role'}
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-relaxed">{nucleosynthesisRole}</p>
              </div>
            )}

            {/* Elemental Abundance Breakdown */}
            {body.primaryElements && body.primaryElements.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                  <span className="flex items-center gap-1">
                    <Atom className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {language === 'ar' ? 'التركيب العنصري الأولي' : 'Primary Elemental Makeup'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {language === 'ar' ? 'انقر لتمييز العنصر' : 'Click to highlight'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {body.primaryElements.map((el) => {
                    const elName = language === 'ar' ? el.nameAr : el.nameEn;
                    const role = language === 'ar' ? el.roleAr : el.roleEn;

                    return (
                      <button
                        key={el.atomicNumber}
                        type="button"
                        onClick={() => {
                          if (el.atomicNumber > 0) {
                            setHighlightedCosmicElementNum(el.atomicNumber);
                          }
                        }}
                        className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                              {el.symbol} {el.atomicNumber > 0 ? `(${el.atomicNumber})` : ''}
                            </span>
                            <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                              {elName}
                            </span>
                          </div>
                          <span className="font-mono text-cyan-400 text-xs">{el.percentage}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, el.percentage)}%` }}
                          />
                        </div>

                        {role && <p className="text-[10px] text-slate-400 mt-1 truncate">{role}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons: Video Masterclass + Google Search */}
            <div className="space-y-2 pt-1">
              {body.videoId && (
                <button
                  type="button"
                  onClick={() => {
                    const videoMap: Record<string, string> = {
                      sun: 'the_sun_fusion_engine',
                      voyager_1: 'voyager_interstellar_mission',
                      betelgeuse: 'supernovae_neutron_stars',
                      crab_pulsar: 'neutron_stars_pulsars',
                      cygnus_x1: 'stellar_black_holes',
                      sagittarius_a: 'sagittarius_a_supermassive',
                      kilonova_factory: 'cosmic_origin_of_elements',
                      andromeda_galaxy: 'milky_way_andromeda_collision',
                      m87_black_hole: 'sagittarius_a_supermassive',
                      laniakea_supercluster: 'cosmic_web',
                    };
                    const key = videoMap[body.id] || 'solar_system';
                    setUniverseVideoModalOpen(true, key);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>
                    {language === 'ar' ? 'مشاهدة فيلم علمي وثائقي 🎬' : 'Watch Documentary Video 🎬'}
                  </span>
                </button>
              )}

              {/* Google Search Link Button */}
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-300 hover:text-white text-xs font-semibold shadow-md transition group cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition" />
                <span>
                  {language === 'ar'
                    ? `ابحث في Google عن ${displayName} 🔍`
                    : `Search Google for ${displayName} 🔍`}
                </span>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
