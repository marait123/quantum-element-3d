'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES } from '@/data/universeData';
import { X, PlayCircle, Atom, Compass, Flame, Orbit, Sparkles } from 'lucide-react';

export const CelestialInspectorTooltip: React.FC = () => {
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const language = useQuantumStore((s) => s.language);

  if (!selectedCosmicBodyId || !CELESTIAL_BODIES[selectedCosmicBodyId]) {
    return null;
  }

  const body = CELESTIAL_BODIES[selectedCosmicBodyId];
  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const description = language === 'ar' ? body.descriptionAr : body.descriptionEn;
  const nucleosynthesisRole = language === 'ar' ? body.nucleosynthesisRoleAr : body.nucleosynthesisRoleEn;

  return (
    <div className="fixed top-20 start-6 z-40 w-96 max-w-[calc(100vw-3rem)] rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden animate-fadeIn">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-md"
            style={{ backgroundColor: body.color }}
          />
          <h3 className="font-bold text-base text-white truncate">{displayName}</h3>
        </div>
        <button
          id="close-celestial-tooltip-btn"
          type="button"
          onClick={() => setSelectedCosmicBodyId(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
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
            <span className="font-semibold text-purple-300 capitalize">{body.type.replace('_', ' ')}</span>
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
              <span>{language === 'ar' ? 'دور التخليق الكوني للعناصر' : 'Cosmic Nucleosynthesis Role'}</span>
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
                <span>{language === 'ar' ? 'التركيب العنصري الأولي' : 'Primary Elemental Makeup'}</span>
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
                    className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors group"
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

                    {role && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{role}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Masterclass Button (if available) */}
        {body.videoId && (
          <button
            type="button"
            onClick={() => {
              // Map body id to universe video key
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{language === 'ar' ? 'مشاهدة فيلم علمي وثائقي' : 'Watch Documentary Video'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
