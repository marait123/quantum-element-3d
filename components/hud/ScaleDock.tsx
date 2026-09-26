'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Zap,
  Radio,
  Sparkles,
  Waves,
  Orbit,
  Film,
} from 'lucide-react';
import { useQuantumStore, ScaleLevel } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import { SCALE_VIDEOS } from '@/data/videosData';

export const ScaleDock: React.FC = () => {
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);
  const zoomIn = useQuantumStore((s) => s.zoomIn);
  const zoomOut = useQuantumStore((s) => s.zoomOut);
  const language = useQuantumStore((s) => s.language);
  const setVideoModalOpen = useQuantumStore((s) => s.setVideoModalOpen);

  // Scale 2 & 4 & 5 actions
  const triggerQuantumLeap = useQuantumStore((s) => s.triggerQuantumLeap);
  const isExcitedState = useQuantumStore((s) => s.isExcitedState);

  const triggerBetaDecay = useQuantumStore((s) => s.triggerBetaDecay);
  const isBetaDecaying = useQuantumStore((s) => s.isBetaDecaying);

  const isSeaQuarksActive = useQuantumStore((s) => s.isSeaQuarksActive);
  const toggleSeaQuarks = useQuantumStore((s) => s.toggleSeaQuarks);

  const stringHarmonicMode = useQuantumStore((s) => s.stringHarmonicMode);
  const setStringHarmonicMode = useQuantumStore((s) => s.setStringHarmonicMode);

  const t = TRANSLATIONS[language];

  const scaleItems: { id: ScaleLevel; label: string; power: string }[] = [
    { id: 1, label: t.scales[1].name, power: t.scales[1].power },
    { id: 2, label: t.scales[2].name, power: t.scales[2].power },
    { id: 3, label: t.scales[3].name, power: t.scales[3].power },
    { id: 4, label: t.scales[4].name, power: t.scales[4].power },
    { id: 5, label: t.scales[5].name, power: t.scales[5].power },
  ];

  return (
    <div
      id="subatomic-scale-dock"
      className="absolute bottom-20 md:bottom-6 inset-x-0 z-20 flex flex-col items-center gap-2.5 pointer-events-none px-4"
    >
      {/* Contextual Interactive Actions Bar for Active Scale */}
      <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
        {/* Contextual Video Masterclass for Current Scale */}
        <button
          onClick={() => setVideoModalOpen(true, 'scale')}
          className="glass-panel px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-amber-300 border-amber-500/40 hover:bg-amber-500/20 transition shadow-lg shadow-amber-500/10 group"
          title={language === 'ar' ? `مشاهدة فيديو شرح ${t.scales[scaleLevel].name}` : `Watch ${t.scales[scaleLevel].name} Explainer Video`}
        >
          <Film className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
          <span>
            {language === 'ar' ? `فيديو: ${t.scales[scaleLevel].name}` : `Watch: ${t.scales[scaleLevel].name}`}
          </span>
        </button>

        {/* Scale 2: Quantum Leap */}
        {scaleLevel === 2 && (
          <button
            onClick={triggerQuantumLeap}
            disabled={isExcitedState}
            className={`glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition shadow-lg ${
              isExcitedState
                ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                : 'bg-sky-500/20 text-sky-200 border-sky-400/40 hover:bg-sky-500/30'
            }`}
            title={t.controls.quantumLeapDesc}
          >
            <Zap className={`w-4 h-4 ${isExcitedState ? 'animate-bounce text-amber-400' : 'text-sky-300'}`} />
            <span>{t.controls.quantumLeap}</span>
          </button>
        )}

        {/* Scale 4: Beta Decay & Sea Quarks */}
        {scaleLevel === 4 && (
          <>
            <button
              onClick={triggerBetaDecay}
              disabled={isBetaDecaying}
              className={`glass-panel px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition shadow-lg ${
                isBetaDecaying
                  ? 'bg-purple-600/40 text-purple-200 border-purple-400 animate-pulse'
                  : 'bg-rose-500/20 text-rose-200 border-rose-400/40 hover:bg-rose-500/30'
              }`}
              title={t.controls.betaDecayDesc}
            >
              <Radio className="w-4 h-4 text-rose-400" />
              <span>{t.controls.betaDecay}</span>
            </button>

            <button
              onClick={toggleSeaQuarks}
              className={`glass-panel px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition shadow-lg ${
                isSeaQuarksActive
                  ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400'
                  : 'bg-slate-800/60 text-slate-300 border-white/10 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{isSeaQuarksActive ? t.controls.seaQuarksOn : t.controls.seaQuarksOff}</span>
            </button>
          </>
        )}

        {/* Scale 5: String Harmonic Mode Selector */}
        {scaleLevel === 5 && (
          <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-purple-500/30 shadow-xl">
            <span className="text-[11px] font-bold text-purple-300 me-1 hidden sm:inline flex items-center gap-1">
              <Waves className="w-3.5 h-3.5" />
              {t.controls.stringModes.title}:
            </span>
            {[
              { mode: 1, label: 'e⁻ (n=1)' },
              { mode: 2, label: 'Quark (n=2)' },
              { mode: 3, label: 'γ Photon (n=3)' },
              { mode: 4, label: 'Graviton Loop' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => setStringHarmonicMode(mode)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  stringHarmonicMode === mode
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Powers of Ten Dock */}
      <div className="glass-panel p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border border-white/15 pointer-events-auto max-w-full overflow-x-auto">
        {/* Zoom Out Button */}
        <button
          onClick={zoomOut}
          disabled={scaleLevel <= 1}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title={t.hud.zoomOutScale}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-700/60 mx-1" />

        {/* Scale Steps 1 to 5 */}
        {scaleItems.map((item) => {
          const isActive = item.id === scaleLevel;
          return (
            <button
              key={item.id}
              onClick={() => setScaleLevel(item.id)}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs transition relative font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/25 text-white border border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Orbit className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400 animate-spin-slow' : 'text-slate-400'}`} />
              <span className="font-semibold">{item.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {item.power}
              </span>
            </button>
          );
        })}

        <div className="h-6 w-px bg-slate-700/60 mx-1" />

        {/* Zoom In Button */}
        <button
          onClick={zoomIn}
          disabled={scaleLevel >= 5}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title={t.hud.zoomInScale}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
