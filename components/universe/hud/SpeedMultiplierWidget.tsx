'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { Gauge, Zap, Rocket } from 'lucide-react';

const SPEED_PRESETS = [
  { value: 0.5, label: '0.5x', nameEn: 'Slow / Precision', nameAr: 'استكشاف دقيق' },
  { value: 1.0, label: '1x', nameEn: 'Standard Cruise', nameAr: 'سرعة عادية' },
  { value: 3.0, label: '3x', nameEn: 'High Velocity', nameAr: 'سرعة عالية' },
  { value: 10.0, label: '10x', nameEn: 'Interstellar Warp', nameAr: 'فائق السرعة' },
  { value: 25.0, label: 'WARP', nameEn: 'Superluminal (x25)', nameAr: 'قفزة الالتفاف (x25)' },
];

export const SpeedMultiplierWidget: React.FC = () => {
  const movementSpeedMultiplier = useQuantumStore((s) => s.movementSpeedMultiplier);
  const setMovementSpeedMultiplier = useQuantumStore((s) => s.setMovementSpeedMultiplier);
  const language = useQuantumStore((s) => s.language);

  const currentPreset =
    SPEED_PRESETS.find((p) => p.value === movementSpeedMultiplier) || SPEED_PRESETS[1];

  return (
    <div
      id="speed-multiplier-widget"
      className="fixed bottom-20 end-4 z-30 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/70 shadow-2xl">
        <div
          className="flex items-center gap-1 px-2 py-1 text-slate-400"
          title={
            language === 'ar'
              ? `سرعة الحركة الحالية: ${currentPreset.nameAr}`
              : `Flight Speed: ${currentPreset.nameEn}`
          }
        >
          {movementSpeedMultiplier >= 10.0 ? (
            <Rocket className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          ) : movementSpeedMultiplier > 1.0 ? (
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="text-[10px] font-mono hidden md:inline text-slate-300">
            {language === 'ar' ? 'السرعة' : 'Speed'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {SPEED_PRESETS.map((preset) => {
            const isSelected = movementSpeedMultiplier === preset.value;
            const isWarp = preset.value === 25.0;

            return (
              <button
                key={preset.value}
                id={`speed-btn-${preset.label.toLowerCase()}`}
                type="button"
                onClick={() => setMovementSpeedMultiplier(preset.value)}
                title={language === 'ar' ? preset.nameAr : preset.nameEn}
                className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isWarp
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
