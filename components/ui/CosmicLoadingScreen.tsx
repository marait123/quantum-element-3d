'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { TRANSLATIONS } from '@/data/translations';
import { Atom, Sparkles, Rocket, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface CosmicLoadingScreenProps {
  onComplete?: () => void;
}

export const CosmicLoadingScreen: React.FC<CosmicLoadingScreenProps> = ({ onComplete }) => {
  const language = useQuantumStore((s) => s.language);
  const t = TRANSLATIONS[language]?.loading || TRANSLATIONS.en.loading;

  const activeWorld = useQuantumStore((s) => s.activeWorld);
  const isCanvasReady = useQuantumStore((s) => s.isCanvasReady);

  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isWebGlReady, setIsWebGlReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isFullyDismissed, setIsFullyDismissed] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with store isCanvasReady
  useEffect(() => {
    if (isCanvasReady) {
      setIsWebGlReady(true);
    }
  }, [isCanvasReady]);

  // Listen for WebGL Canvas first frame ready event with matching world detail
  useEffect(() => {
    const handleWebGlReady = (e: Event) => {
      const customEvent = e as CustomEvent<{ world?: string }>;
      if (!customEvent.detail?.world || customEvent.detail.world === activeWorld) {
        setIsWebGlReady(true);
      }
    };

    window.addEventListener('webgl-canvas-ready', handleWebGlReady);

    // Safety fallback: if WebGL takes too long or event is delayed, mark ready after 4.5s
    const fallbackTimer = setTimeout(() => {
      setIsWebGlReady(true);
    }, 4500);

    return () => {
      window.removeEventListener('webgl-canvas-ready', handleWebGlReady);
      clearTimeout(fallbackTimer);
    };
  }, [activeWorld]);

  // Stepped Progress Animation Loop
  useEffect(() => {
    const totalDuration = 1800; // ms for baseline calibration climb

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const rawProgress = Math.min((elapsed / totalDuration) * 100, 92);

      if (!isWebGlReady) {
        // Hold progress at 92% until WebGL confirms its active rasterized frame
        setProgress(Math.floor(Math.min(rawProgress, 92)));
      } else {
        // WebGL is ready, smoothly advance to 100%
        setProgress((prev) => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isWebGlReady]);

  // Sync diagnostic stage text based on current percentage
  useEffect(() => {
    if (progress < 22) {
      setStageIndex(0);
    } else if (progress < 45) {
      setStageIndex(1);
    } else if (progress < 70) {
      setStageIndex(2);
    } else if (progress < 92) {
      setStageIndex(3);
    } else {
      setStageIndex(4);
    }
  }, [progress]);

  // Trigger exit when 100% is reached
  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      timerRef.current = setTimeout(() => {
        handleEnter();
      }, 350);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [progress, isExiting]);

  const handleEnter = () => {
    if (isExiting) return;
    setIsExiting(true);

    setTimeout(() => {
      setIsFullyDismissed(true);
      onComplete?.();
    }, 700);
  };

  if (isFullyDismissed) {
    return null;
  }

  const stageMessages = [
    t.initializing,
    t.calibrating,
    t.compiling,
    t.indexing,
    t.telemetryReady,
  ];

  return (
    <div
      id="cosmic-loading-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020617] select-none transition-all duration-700 ease-out ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 40%, rgba(30, 27, 75, 0.45) 0%, rgba(2, 6, 23, 0.98) 75%)',
      }}
    >
      {/* Background Micro-Stars Texture */}
      <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Central Holographic Hub */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Holographic Gyroscopic Rings */}
        <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center mb-8">
          {/* Outer Dashed Gyro Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30 animate-spin-slow" />

          {/* Middle Counter-Rotating Violet Ring */}
          <div
            className="absolute inset-3 rounded-full border border-purple-500/40 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '14s' }}
          />

          {/* Glowing Quantum Core Corona */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-400/30 to-purple-600/20 blur-md animate-pulse" />

          {/* Inner Core Display with Digital Readout */}
          <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-950/90 border border-cyan-400/50 shadow-2xl shadow-cyan-500/30 backdrop-blur-xl">
            <Atom className="w-6 h-6 text-cyan-400 animate-spin-slow mb-1" />
            <span className="font-mono text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200 tracking-tighter">
              {progress}%
            </span>
          </div>

          {/* Orbiting Satellite Marker */}
          <div
            className="absolute inset-0 flex items-center justify-start pointer-events-none animate-spin"
            style={{ animationDuration: '5s' }}
          >
            <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-cyan-300 shadow-[0_0_10px_#38bdf8]" />
          </div>
        </div>

        {/* Brand & Lab Title */}
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mb-1.5 flex items-center gap-2">
          <span>{t.title}</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6 tracking-wide">
          {t.subtitle}
        </p>

        {/* Semantic Progress Bar & Laser Meter */}
        <div className="w-full relative mb-4">
          {/* Accessible Semantic HTML Progress Element */}
          <progress
            value={progress}
            max={100}
            aria-label={t.subtitle}
            className="sr-only"
          >
            {progress}%
          </progress>

          {/* Custom Styled High-Tech Laser Track */}
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden relative shadow-inner p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 transition-all duration-150 ease-out relative shadow-[0_0_12px_rgba(56,189,248,0.7)]"
              style={{ width: `${progress}%` }}
            >
              {/* Laser Leading Tip Spark */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
            </div>
          </div>
        </div>

        {/* Diagnostic Telemetry Feed */}
        <div className="min-h-[2.5rem] flex items-center justify-center text-xs text-sky-300 font-mono tracking-tight px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md mb-6 w-full text-center">
          <Activity className="w-3.5 h-3.5 text-cyan-400 me-2 shrink-0 animate-pulse" />
          <span className="truncate">
            {stageMessages[stageIndex]}
          </span>
        </div>

        {/* Subsystem Telemetry Status Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full text-[10px] font-mono text-slate-400 mb-6">
          <div className="px-2 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                progress > 20 ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className={progress > 20 ? 'text-slate-300' : 'text-slate-500'}>
              {t.coreOnline}
            </span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                progress > 50 ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span className={progress > 50 ? 'text-slate-300' : 'text-slate-500'}>
              {t.shadersCompiled}
            </span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                progress > 75 ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span className={progress > 75 ? 'text-slate-300' : 'text-slate-500'}>
              {t.nasaConnected}
            </span>
          </div>
          <div className="px-2 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                progress >= 95 ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span className={progress >= 95 ? 'text-slate-300' : 'text-slate-500'}>
              {t.audioReady}
            </span>
          </div>
        </div>

        {/* Enter Now Skip Button (Active once >= 80%) */}
        {progress >= 80 && (
          <button
            type="button"
            onClick={handleEnter}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer transform hover:scale-105 active:scale-95 animate-fadeIn"
          >
            <span>{t.enterLab}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
};
