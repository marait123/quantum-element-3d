'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { TOUR_STEPS } from '@/lib/tourSteps';
import { audioSynth } from '@/lib/audioSynth';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  Atom,
} from 'lucide-react';

export const InteractiveGuidedTour: React.FC = () => {
  const isTutorialOpen = useQuantumStore((s) => s.isTutorialOpen);
  const setTutorialOpen = useQuantumStore((s) => s.setTutorialOpen);
  const tutorialStep = useQuantumStore((s) => s.tutorialStep);
  const setTutorialStep = useQuantumStore((s) => s.setTutorialStep);
  const language = useQuantumStore((s) => s.language);

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for step timer
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const step = TOUR_STEPS[tutorialStep] || TOUR_STEPS[0];
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = tutorialStep === totalSteps - 1;

  // Auto-launch once on first visit if not completed
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('science_lab_tutorial_completed');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setTutorialOpen(true, 0);
        }, 1400);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore localStorage restrictions
    }
  }, [setTutorialOpen]);

  // Execute step lifecycle hook on step change
  useEffect(() => {
    if (!isTutorialOpen) return;

    if (step.onEnter) {
      step.onEnter(useQuantumStore.getState());
    }

    // Play subtle zero-point audio feedback
    try {
      audioSynth.playQuantumLeapChime();
    } catch (e) {}

    // Reset auto-play progress
    setProgress(0);
  }, [isTutorialOpen, tutorialStep]);

  // Measure target element position
  const updateTargetRect = useCallback(() => {
    if (!isTutorialOpen) return;

    if (!step.targetSelector || step.targetSelector === 'body') {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isTutorialOpen, step.targetSelector]);

  // Dynamic measuring with polling and resize listener
  useEffect(() => {
    if (!isTutorialOpen) return;

    updateTargetRect();
    const interval = setInterval(updateTargetRect, 250);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isTutorialOpen, updateTargetRect]);

  const finishTour = useCallback(() => {
    try {
      localStorage.setItem('science_lab_tutorial_completed', 'true');
    } catch (e) {}
    setIsAutoPlay(false);
    setTutorialOpen(false);
  }, [setTutorialOpen]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      finishTour();
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  }, [isLastStep, finishTour, setTutorialStep, tutorialStep]);

  const handlePrev = useCallback(() => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  }, [setTutorialStep, tutorialStep]);

  // Auto-play timer logic (7s per step)
  useEffect(() => {
    if (!isTutorialOpen || !isAutoPlay) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    const duration = 7000;
    const intervalMs = 100;
    const stepIncrement = (intervalMs / duration) * 100;

    autoPlayTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isTutorialOpen, isAutoPlay, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTutorialOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishTour();
      } else if (e.key === 'ArrowRight') {
        if (language === 'ar') handlePrev();
        else handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (language === 'ar') handleNext();
        else handlePrev();
      } else if (e.key === ' ') {
        setIsAutoPlay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialOpen, handleNext, handlePrev, finishTour, language]);

  if (!isTutorialOpen) return null;

  // Calculate anchored tooltip card style based on targetRect & preferredPlacement
  const padding = 10;
  const cardWidth = 420;
  const cardHeight = 240;

  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
    width: cardWidth,
    maxWidth: 'calc(100vw - 2rem)',
  };

  if (!targetRect || step.preferredPlacement === 'center') {
    tooltipStyle = {
      ...tooltipStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  } else {
    const { top, bottom, left, right, width, height } = targetRect;
    const placement = step.preferredPlacement;

    let computedTop = 0;
    let computedLeft = 0;

    if (placement === 'bottom') {
      computedTop = bottom + padding + 14;
      computedLeft = left + width / 2 - cardWidth / 2;
    } else if (placement === 'top') {
      computedTop = Math.max(top - cardHeight - padding - 14, 16);
      computedLeft = left + width / 2 - cardWidth / 2;
    } else if (placement === 'right') {
      computedLeft = right + padding + 14;
      computedTop = top;
    } else if (placement === 'left') {
      computedLeft = Math.max(left - cardWidth - padding - 14, 16);
      computedTop = top;
    }

    // Clamp within viewport
    if (typeof window !== 'undefined') {
      const maxX = window.innerWidth - cardWidth - 16;
      const maxY = window.innerHeight - cardHeight - 16;
      computedLeft = Math.max(16, Math.min(computedLeft, maxX));
      computedTop = Math.max(16, Math.min(computedTop, maxY));
    }

    tooltipStyle = {
      ...tooltipStyle,
      top: computedTop,
      left: computedLeft,
    };
  }

  return (
    <div id="interactive-guided-tour-container" className="fixed inset-0 z-50 select-none pointer-events-none">
      {/* SVG Spotlight Mask Backdrop */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White: opaque dark overlay covers screen */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black: transparent spotlight hole revealing targeted UI element */}
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="18"
                fill="black"
              />
            )}
          </mask>

          {/* Animated Neon Pulse Gradient */}
          <linearGradient id="tour-neon-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Shrouded Dark Backdrop (Clipped around highlighted component) */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.76)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto transition-all duration-300"
        />

        {/* Pulsing Halo Border Outline Around Highlighted Element */}
        {targetRect && (
          <rect
            x={targetRect.left - padding}
            y={targetRect.top - padding}
            width={targetRect.width + padding * 2}
            height={targetRect.height + padding * 2}
            rx="18"
            fill="none"
            stroke="url(#tour-neon-glow)"
            strokeWidth="3"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Tethered Speech-Bubble Interactive Tooltip Card */}
      <div
        id="tour-speech-bubble-card"
        style={tooltipStyle}
        className="pointer-events-auto rounded-3xl bg-slate-950/95 border border-purple-500/40 shadow-2xl backdrop-blur-2xl text-slate-100 overflow-hidden animate-fadeIn flex flex-col"
      >
        {/* Auto-Play Linear Progress Bar */}
        {isAutoPlay && (
          <div className="w-full h-1 bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Card Header: Step Pill & Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3 h-3 animate-spin-slow text-purple-400" />
              <span>
                {language === 'ar' ? step.badgeAr : step.badgeEn}
              </span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {language === 'ar'
                ? `الخطوة ${tutorialStep + 1} من ${totalSteps}`
                : `Step ${tutorialStep + 1} of ${totalSteps}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Auto-Play Toggle */}
            <button
              id="tour-autoplay-btn"
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition cursor-pointer ${
                isAutoPlay
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
              title={
                language === 'ar'
                  ? isAutoPlay ? 'إيقاف الجولة التلقائية' : 'تشغيل الجولة التلقائية'
                  : isAutoPlay ? 'Pause Auto-Play' : 'Start Auto-Play'
              }
            >
              {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden sm:inline">
                {language === 'ar' ? 'تلقائي' : 'Auto'}
              </span>
            </button>

            {/* Close / Dismiss Tour */}
            <button
              id="tour-close-btn"
              type="button"
              onClick={finishTour}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={language === 'ar' ? 'إغلاق الدليل' : 'Dismiss Guide'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body: Title, Subtitle, and Explanation */}
        <div className="p-5 space-y-2">
          <h3 className="font-extrabold text-base md:text-lg text-white tracking-tight flex items-center gap-2">
            {language === 'ar' ? step.titleAr : step.titleEn}
          </h3>
          <p className="text-xs font-semibold text-cyan-400">
            {language === 'ar' ? step.subtitleAr : step.subtitleEn}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {language === 'ar' ? step.descriptionAr : step.descriptionEn}
          </p>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-3">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTutorialStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === tutorialStep
                    ? 'w-7 bg-cyan-400 shadow-sm shadow-cyan-400/50'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Card Footer: Skip & Navigation Buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-slate-900/60">
          <button
            id="tour-skip-btn"
            type="button"
            onClick={finishTour}
            className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {language === 'ar' ? 'تخطي الجولة' : 'Skip Tour'}
          </button>

          <div className="flex items-center gap-2">
            {tutorialStep > 0 && (
              <button
                id="tour-prev-btn"
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                {language === 'ar' ? (
                  <>
                    <span>السابق</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </>
                )}
              </button>
            )}

            <button
              id="tour-next-btn"
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/25 transition cursor-pointer"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'ابدأ الاستكشاف!' : 'Start Exploring!'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'ar' ? 'التالي' : 'Next'}</span>
                  {language === 'ar' ? (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
