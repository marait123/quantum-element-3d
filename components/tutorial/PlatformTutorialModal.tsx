'use client';

import React, { useEffect, useState } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import {
  Compass,
  Atom,
  Rocket,
  Search,
  Video,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface TutorialStep {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ReactNode;
  badgeEn: string;
  badgeAr: string;
  color: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    titleEn: 'Welcome to Ibrahim Science Lab',
    titleAr: 'أهلاً بك في معمل إبراهيم العلمي',
    subtitleEn: 'Two Parallel 3D Worlds to Explore',
    subtitleAr: 'عالمان ثلاثيا الأبعاد لاستكشاف المادة والكون',
    descriptionEn:
      'Seamlessly switch between two interactive dimensions: the Quantum Subatomic Realm (10⁰ m to 10⁻³⁵ m) and the Cosmic Universe (10⁷ m to 10²⁶ m). Journey from quarks and electron probability clouds to black holes and the cosmic web.',
    descriptionAr:
      'تنقل بسلاسة فائقة بين بعدين تفاعليين: العالم دون الذري الكمي (من 10⁰ إلى 10⁻³⁵ متر) والكون الكوني الفسيح (من 10⁷ إلى 10²⁶ متر)، من سحب الإلكترونات والكواركات حتى الثقوب السوداء وأعماق المجرات.',
    icon: <Atom className="w-8 h-8 text-cyan-400" />,
    badgeEn: 'Dual Realms',
    badgeAr: 'العالمان المتوازيان',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40',
  },
  {
    titleEn: 'Unified Omnidirectional Navigation',
    titleAr: 'نظام الملاحة الموحد متعدد الوسائط',
    subtitleEn: 'Fly, Orbit, and Zoom with Absolute Freedom',
    subtitleAr: 'طيران ومدارات وتقريب بحرية مطلقة وانسيابية',
    descriptionEn:
      'Fly anywhere using keyboard WASD or Arrow keys (hold Shift for a 3.5x boost). Orbit with mouse drag or 1-finger swipe. Zoom continuously across space using the scroll wheel or 2-finger pinch with fluid kinetic momentum. Use the on-screen Speed Multiplier (0.5x to 25x WARP) to cruise or jump across light-years.',
    descriptionAr:
      'حلق بحرية باستخدام مفاتيح WASD أو الأسهم (اضغط Shift لزيادة السرعة 3.5 أضعاف). استدر بسحب الفأرة أو لمسة واحدة. قرب الرؤية بعجلة التمرير أو لمس الإصبعين بحركية انسيابية. واستخدم مضاعف السرعة على الشاشة (من 0.5x حتى 25x قفزة الالتفاف) للعبور الفوري بين المجرات.',
    icon: <Rocket className="w-8 h-8 text-amber-400" />,
    badgeEn: 'Unified Controls',
    badgeAr: 'تحكم متكامل',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
  },
  {
    titleEn: 'Continuous Powers of Ten Journey',
    titleAr: 'رحلة المقاييس المتصلة (قوى العشرة)',
    subtitleEn: 'From Planck Length to the Observable Horizon',
    subtitleAr: 'من طول بلانك السحيق إلى أفق الكون المنظور',
    descriptionEn:
      'Use the interactive scale slider at the bottom to travel through the 5 quantum milestones (Periodic Table, Bohr Atom, Packed Nucleus, Quarks, Planck Strings) or 5 cosmic scales (Solar System, Stellar Neighborhood, Milky Way, Extragalactic, Cosmic Web).',
    descriptionAr:
      'استخدم شريط المقاييس التفاعلي أسفل الشاشة للتنقل السلس بين 5 مقاييس كمية (الجدول الدوري، ذرة بور، النواة، الكواركات، أوتار بلانك) أو 5 مقاييس كونية (المجموعة الشمسية، الجوار النجمي، درب التبانة، خارج المجرة، نسيج الكون السحيق).',
    icon: <Layers className="w-8 h-8 text-purple-400" />,
    badgeEn: 'Continuous Zoom',
    badgeAr: 'تقريب مستمر',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
  },
  {
    titleEn: 'Scientific Dossiers & Authentic NASA Imagery',
    titleAr: 'بطاقات البيانات العلمية وصور ناسا الحقيقية',
    subtitleEn: 'High-Resolution Visuals & Elemental Analysis',
    subtitleAr: 'رؤية بصرية فائقة الدقة وتحليل عنصري متكامل',
    descriptionEn:
      'Click any celestial body, voyager, satellite, or chemical element to view its scientific dossier. Inspect high-definition authentic NASA/ESA imagery, physical parameters (mass, radius, temperature), nucleosynthesis origins, and instant Google Search links.',
    descriptionAr:
      'انقر على أي كوكب أو مسبار فضائي أو نجم أو عنصر كيميائي لفتح بطاقته العلمية المتكاملة، وتصفح صوره الحقيقية فائقة الدقة من أرشيف ناسا، وبياناته الفيزيائية وتركيبه العنصري، وروابط البحث المباشرة.',
    icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
    badgeEn: 'Authentic Data',
    badgeAr: 'بيانات موثقة',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
  },
  {
    titleEn: 'Bilingual Instant Space Search',
    titleAr: 'محرك البحث الكوني الفوري ثنائي اللغة',
    subtitleEn: 'Find Any Star, Planet, or Element in Arabic & English',
    subtitleAr: 'اعثر على أي كوكب أو مجرة أو عنصر بالعربية والإنجليزية',
    descriptionEn:
      'Use the search bar at the top to quickly jump to any celestial body (e.g. "Mars", "المريخ", "Andromeda", "أندروميدا") or chemical element. Instant auto-suggestions guide you directly to the selected object with intelligent camera framing.',
    descriptionAr:
      'استخدم شريط البحث العلوي للانتقال الفوري إلى أي جرم سماوي أو عنصر كيميائي باللغتين العربية والإنجليزية. ترشدك الاقتراحات الذكية مباشرة إلى الجرم مع ضبط زاوية الرؤية التلقائية دون أي حجب.',
    icon: <Search className="w-8 h-8 text-sky-400" />,
    badgeEn: 'Smart Search',
    badgeAr: 'بحث ذكي',
    color: 'from-sky-500/20 to-blue-500/20 border-sky-500/40',
  },
  {
    titleEn: 'Masterclass Video Cinema',
    titleAr: 'سينما المحاضرات والشروحات المرئية',
    subtitleEn: '100% Verified, Peer-Reviewed Masterclasses',
    subtitleAr: 'شروحات علمية معتمدة عالمياً خالية من أي روابط معطلة',
    descriptionEn:
      'Access built-in cinema masterclasses curated from CrashCourse, Kurzgesagt, Periodic Videos, and NASA. Watch interactive video lessons for each power of ten and all 118 chemical elements, with direct YouTube fallback links.',
    descriptionAr:
      'شاهد محاضرات وسينما تفاعلية مدمجة تم اختيارها بعناية من كبرى القنوات العلمية العالمية مثل Periodic Videos و Kurzgesagt و CrashCourse و NASA، مع روابط مشاهدة مباشرة موثقة 100%.',
    icon: <Video className="w-8 h-8 text-rose-400" />,
    badgeEn: 'Video Masterclasses',
    badgeAr: 'سينما مرئية',
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/40',
  },
];

export const PlatformTutorialModal: React.FC = () => {
  const isTutorialOpen = useQuantumStore((s) => s.isTutorialOpen);
  const setTutorialOpen = useQuantumStore((s) => s.setTutorialOpen);
  const tutorialStep = useQuantumStore((s) => s.tutorialStep);
  const setTutorialStep = useQuantumStore((s) => s.setTutorialStep);
  const language = useQuantumStore((s) => s.language);

  // Auto-launch once on first visit
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('science_lab_tutorial_completed');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setTutorialOpen(true, 0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignore localStorage restrictions
    }
  }, [setTutorialOpen]);

  // Handle keyboard navigation (ArrowLeft/Right, Escape)
  useEffect(() => {
    if (!isTutorialOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishTutorial();
      } else if (e.key === 'ArrowRight') {
        if (language === 'ar') handlePrev();
        else handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (language === 'ar') handleNext();
        else handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialOpen, tutorialStep, language]);

  if (!isTutorialOpen) return null;

  const step = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[0];
  const totalSteps = TUTORIAL_STEPS.length;
  const isLastStep = tutorialStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      finishTutorial();
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  };

  const handlePrev = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const finishTutorial = () => {
    try {
      localStorage.setItem('science_lab_tutorial_completed', 'true');
    } catch (e) {}
    setTutorialOpen(false);
  };

  return (
    <div
      id="platform-tutorial-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none"
    >
      <div
        id="platform-tutorial-modal"
        className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block">
                {language === 'ar' ? 'دليل المنصة التفاعلي' : 'Interactive Platform Guide'}
              </span>
              <span className="text-xs text-slate-400">
                {language === 'ar'
                  ? `الخطوة ${tutorialStep + 1} من ${totalSteps}`
                  : `Step ${tutorialStep + 1} of ${totalSteps}`}
              </span>
            </div>
          </div>

          <button
            id="tutorial-close-btn"
            type="button"
            onClick={finishTutorial}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={language === 'ar' ? 'إغلاق الدليل' : 'Dismiss Guide'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Card Icon & Category Badge */}
          <div className="flex items-center justify-between">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${step.color} border shadow-lg`}>
              {step.icon}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-purple-300 border border-slate-700">
              {language === 'ar' ? step.badgeAr : step.badgeEn}
            </span>
          </div>

          {/* Titles & Descriptions */}
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
              {language === 'ar' ? step.titleAr : step.titleEn}
            </h3>
            <p className="text-xs font-semibold text-purple-400">
              {language === 'ar' ? step.subtitleAr : step.subtitleEn}
            </p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed pt-1">
              {language === 'ar' ? step.descriptionAr : step.descriptionEn}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTutorialStep(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === tutorialStep
                    ? 'w-8 bg-purple-500 shadow-sm shadow-purple-500/50'
                    : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={finishTutorial}
            className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {language === 'ar' ? 'تخطي الجولة' : 'Skip Tour'}
          </button>

          <div className="flex items-center gap-2">
            {tutorialStep > 0 && (
              <button
                id="tutorial-prev-btn"
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
              id="tutorial-next-btn"
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition cursor-pointer"
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
