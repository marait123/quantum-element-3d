'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { Gauge, Zap, Rocket, Sparkles, Keyboard, Target } from 'lucide-react';

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
  const showConstellations = useQuantumStore((s) => s.showConstellations);
  const toggleConstellations = useQuantumStore((s) => s.toggleConstellations);
  const navigationMode = useQuantumStore((s) => s.navigationMode);
  const toggleNavigationMode = useQuantumStore((s) => s.toggleNavigationMode);
  const language = useQuantumStore((s) => s.language);

  const currentPreset =
    SPEED_PRESETS.find((p) => p.value === movementSpeedMultiplier) || SPEED_PRESETS[1];

  return (
    <>
      {/* Flight Dynamics & Speed Dock (Positioned at Bottom Start / Left) */}
      <div
        id="speed-multiplier-widget"
        className="fixed bottom-4 start-3 sm:start-4 z-30 select-none pointer-events-auto flex flex-col items-start gap-1.5"
      >
        {/* Animated Flight Helper Pill (Active in Free Flight Mode) */}
        {navigationMode === 'fly' && (
          <div className="px-3 py-1 rounded-full bg-slate-900/95 border border-purple-500/50 backdrop-blur-md text-[10px] sm:text-[11px] text-purple-200 flex items-center gap-1.5 shadow-lg animate-bounce mb-0.5">
            <Rocket className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-mono">
              {language === 'ar'
                ? 'W,A,S,D للتحرك • Space للصعود • C للهبوط • الماوس للتوجيه'
                : 'W,A,S,D: Move • Space: Elevate • C: Descend • Mouse: Look'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/70 shadow-2xl">
          {/* Navigation Mode Switcher: Orbit vs Free-Flight */}
          <button
            type="button"
            id="toggle-nav-mode-btn"
            onClick={toggleNavigationMode}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold ${
              navigationMode === 'fly'
                ? 'bg-purple-600/30 border border-purple-400 text-purple-200 shadow-purple-500/20 ring-1 ring-purple-400/50 scale-105'
                : 'bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={language === 'ar' ? 'تبديل وضع الاستكشاف (طيران / مدار)' : 'Toggle Navigation Mode (Fly / Orbit)'}
          >
            {navigationMode === 'fly' ? (
              <Rocket className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            ) : (
              <Target className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="hidden sm:inline font-mono">
              {navigationMode === 'fly'
                ? language === 'ar' ? 'طيران 🚀' : 'Fly 🚀'
                : language === 'ar' ? 'مدار 🎯' : 'Orbit 🎯'}
            </span>
          </button>

          {/* Speed Presets Selector */}
          <div className="flex items-center gap-1 ps-1 border-s border-slate-800">
            <div
              className="flex items-center gap-1 px-1.5 text-slate-400 hidden sm:flex"
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
            </div>

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
                  className={`px-1.5 sm:px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer ${
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

      {/* Visual Overlays & Controls Guide (Positioned at Bottom End / Right) */}
      <div
        id="visual-overlays-dock"
        className="fixed bottom-4 end-3 sm:end-4 z-30 select-none pointer-events-auto flex items-center gap-1.5 sm:gap-2"
      >
        {/* Constellations Layer Toggle Button */}
        <button
          type="button"
          id="toggle-constellations-btn"
          onClick={toggleConstellations}
          title={language === 'ar' ? 'تشغيل/إيقاف خطوط الكوكبات النجمية' : 'Toggle 3D Constellation Asterism Lines'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl backdrop-blur-xl border transition-all cursor-pointer shadow-xl text-xs font-bold ${
            showConstellations
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20 scale-105'
              : 'bg-slate-950/85 border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${showConstellations ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="hidden sm:inline font-mono">
            {language === 'ar' ? 'الكوكبات' : 'Constellations'}
          </span>
        </button>

        {/* Keyboard Controls Hint & Popover Card */}
        <div className="relative group">
          <button
            type="button"
            id="controls-guide-btn"
            title={
              language === 'ar'
                ? '[Space] صعود للأعلى • [C] هبوط • [WASD] تحليق • [Shift] تسريع'
                : '[Space] Elevate Up • [C] Descend • [WASD] Fly • [Shift] Boost'
            }
            className="p-2 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-slate-700/70 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all cursor-pointer shadow-xl flex items-center justify-center"
          >
            <Keyboard className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          </button>

          {/* Floating Controls Quick Reference Card */}
          <div className="absolute bottom-full end-0 mb-2.5 hidden group-hover:flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl text-[11px] font-mono min-w-[220px] pointer-events-none animate-fadeIn z-50">
            <div className="text-cyan-300 font-bold border-b border-cyan-500/20 pb-1.5 flex items-center justify-between">
              <span>{language === 'ar' ? 'أزرار التحكم والملاحة' : 'Flight & Camera Controls'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">3D</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-amber-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700 shadow-sm">Space</span>
              <span>{language === 'ar' ? 'صعود للأعلى' : 'Elevate Up'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-sky-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700 shadow-sm">C / Ctrl</span>
              <span>{language === 'ar' ? 'هبوط للأسفل' : 'Descend Down'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-emerald-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700 shadow-sm">W A S D</span>
              <span>{language === 'ar' ? 'تحليق حر' : 'Fly / Cruise'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-rose-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700 shadow-sm">Shift</span>
              <span>{language === 'ar' ? 'تسريع فائق (x3.5)' : 'Warp Boost (x3.5)'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
