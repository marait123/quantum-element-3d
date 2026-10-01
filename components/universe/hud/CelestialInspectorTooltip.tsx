'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Rocket,
} from 'lucide-react';
import { isEnterableGalaxy } from '@/lib/galaxyInteriors';
import { useDraggableCard } from '@/lib/useDraggableCard';
import { useIsCompact } from '@/lib/useMediaQuery';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { isMotionScaled } from '@/lib/frames';

// A "tap" outside the card closes it; drags (orbiting the camera) and pinches don't
const TAP_MAX_MOVE_PX = 8;
const TAP_MAX_MS = 500;

// A single click flies to the object; its card appears only once the camera has arrived, after a short pause to
// take in the view. A double click shows it at once. The fallback covers a flight that ends without arriving.
const CARD_DELAY_AFTER_ARRIVAL_MS = 750;
const CARD_FALLBACK_MS = 6000;

// Headings, speeds and stellar encounters of the probes leaving the Solar System (NASA/JPL Voyager FAQ and Pioneer
// mission pages). Proxima Centauri lies at Dec −62.7°, far from all of these headings.
const PROBE_TELEMETRY: Record<
  string,
  { headingEn: string; headingAr: string; speed: string; targetEn: string; targetAr: string; noteEn: string; noteAr: string }
> = {
  voyager_1: {
    headingEn: '35° N · Ophiuchus',
    headingAr: '35° شمالاً · الحواء',
    speed: '~3.5 AU/yr (~17 km/s)',
    targetEn: 'AC+79 3888 (Gliese 445), 1.7 ly, 40,272 AD',
    targetAr: 'AC+79 3888 (غليزا 445)، 1.7 سنة ضوئية، عام 40,272م',
    noteEn: 'No. Its Saturn–Titan flyby sent it 35° north of the ecliptic towards Ophiuchus; Proxima Centauri lies deep in the southern sky.',
    noteAr: 'لا. أرسله تحليقه قرب زحل وتيتان 35° شمال دائرة البروج نحو الحواء، بينما يقع بروكسيما قنطورس في أقصى سماء الجنوب.',
  },
  voyager_2: {
    headingEn: '48° S · Sagittarius / Pavo',
    headingAr: '48° جنوباً · الرامي / الطاووس',
    speed: '~3.1 AU/yr (~15 km/s)',
    targetEn: 'Ross 248 (Andromeda), 1.7 ly, ~40,000 yrs',
    targetAr: 'روس 248 (المرأة المسلسلة)، 1.7 سنة ضوئية، بعد ~40,000 عام',
    noteEn: 'No. Neptune bent its path 48° south towards Sagittarius and Pavo. Ross 248 lies in the north, but it is moving into the probe\'s path.',
    noteAr: 'لا. حرف نبتون مسارها 48° جنوباً نحو الرامي والطاووس. يقع روس 248 في الشمال، لكنه يتحرك نحو مسار المسبار.',
  },
  pioneer_10: {
    headingEn: '3° N · Taurus',
    headingAr: '3° شمالاً · الثور',
    speed: '~2.5 AU/yr (~12 km/s)',
    targetEn: 'Aldebaran, in ~2 million yrs',
    targetAr: 'الدبران، بعد ~2 مليون عام',
    noteEn: 'No. It left almost in the plane of the planets, towards Taurus, on the opposite side of the sky from Proxima.',
    noteAr: 'لا. غادرت قريباً من مستوى الكواكب نحو الثور، في الجهة المقابلة من السماء لبروكسيما.',
  },
  pioneer_11: {
    headingEn: '14° N · Aquila',
    headingAr: '14° شمالاً · العقاب',
    speed: '~2.4 AU/yr (~11 km/s)',
    targetEn: 'A star in Aquila, in ~4 million yrs',
    targetAr: 'نجم في العقاب، بعد ~4 ملايين عام',
    noteEn: 'No. Saturn\'s gravity sent it towards Aquila, north of the ecliptic.',
    noteAr: 'لا. أرسلتها جاذبية زحل نحو العقاب، شمال دائرة البروج.',
  },
  new_horizons: {
    headingEn: '2° N · Sagittarius',
    headingAr: '2° شمالاً · الرامي',
    speed: '~3 AU/yr (~14 km/s)',
    targetEn: 'None announced; still in the Kuiper Belt',
    targetAr: 'لم يُعلن عن لقاء؛ ما زالت في حزام كايبر',
    noteEn: 'No. It follows Pluto\'s 2015 direction, close to the ecliptic towards Sagittarius.',
    noteAr: 'لا. تتبع اتجاه بلوتو عام 2015، قريباً من دائرة البروج نحو الرامي.',
  },
};

export const CelestialInspectorTooltip: React.FC = () => {
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setUniverseVideoModalOpen = useQuantumStore((s) => s.setUniverseVideoModalOpen);
  const requestGalaxyEntry = useQuantumStore((s) => s.requestGalaxyEntry);
  const language = useQuantumStore((s) => s.language);
  const arrivedCosmicBodyId = useQuantumStore((s) => s.arrivedCosmicBodyId);
  const instantCardBodyId = useQuantumStore((s) => s.instantCardBodyId);
  const dismissedCardBodyId = useQuantumStore((s) => s.dismissedCardBodyId);
  const dismissCosmicCard = useQuantumStore((s) => s.dismissCosmicCard);
  const cardRef = useRef<HTMLDivElement>(null);
  const isCompact = useIsCompact();

  // Which body's card may be shown now
  const [revealedId, setRevealedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedCosmicBodyId) return;
    const fallback = setTimeout(() => setRevealedId(selectedCosmicBodyId), CARD_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [selectedCosmicBodyId]);
  useEffect(() => {
    if (!selectedCosmicBodyId || arrivedCosmicBodyId !== selectedCosmicBodyId) return;
    const timer = setTimeout(() => setRevealedId(selectedCosmicBodyId), CARD_DELAY_AFTER_ARRIVAL_MS);
    return () => clearTimeout(timer);
  }, [selectedCosmicBodyId, arrivedCosmicBodyId]);
  const isRevealed =
    !!selectedCosmicBodyId &&
    dismissedCardBodyId !== selectedCosmicBodyId &&
    (revealedId === selectedCosmicBodyId || instantCardBodyId === selectedCosmicBodyId);

  // Clicking or tapping anywhere outside the open card closes it. The object stays selected, so the camera keeps
  // following it; clicking the object again reopens the card. Only a tap counts: dragging to orbit the camera or
  // pinching to zoom must not close the card you are reading.
  useEffect(() => {
    if (!isRevealed) return;
    const downs = new Map<number, { x: number; y: number; t: number; outside: boolean }>();
    let multiTouch = false;
    const isOutside = (e: PointerEvent) =>
      !(cardRef.current && e.target instanceof Node && cardRef.current.contains(e.target));
    const onPointerDown = (e: PointerEvent) => {
      downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), outside: isOutside(e) });
      if (downs.size > 1) multiTouch = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      const d = downs.get(e.pointerId);
      downs.delete(e.pointerId);
      const wasMulti = multiTouch;
      if (downs.size === 0) multiTouch = false;
      if (!d || !d.outside || wasMulti) return;
      const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
      if (moved > TAP_MAX_MOVE_PX || performance.now() - d.t > TAP_MAX_MS) return;
      // Once revealed, the fallback/arrival timers have done their job; clear them so the card stays closed
      setRevealedId(null);
      dismissCosmicCard();
    };
    const onPointerCancel = (e: PointerEvent) => {
      downs.delete(e.pointerId);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerCancel, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerCancel, true);
    };
  }, [isRevealed, dismissCosmicCard]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [selectedCosmicBodyId]);

  // Tell the camera when the phone sheet covers the lower half, so it can frame the object above it
  const setCardSheetOpen = useQuantumStore((s) => s.setCardSheetOpen);
  const sheetOpen = isCompact && isRevealed;
  useEffect(() => {
    setCardSheetOpen(sheetOpen);
  }, [sheetOpen, setCardSheetOpen]);
  useEffect(() => () => setCardSheetOpen(false), [setCardSheetOpen]);

  const { pos, isDragging, handlePointerDown } = useDraggableCard({
    initialX: 20,
    initialY: 76,
    cardWidth: 384,
    cardHeight: 520,
    disabledOnMobile: true,
  });

  if (!selectedCosmicBodyId || !CELESTIAL_BODIES[selectedCosmicBodyId] || !isRevealed) {
    return null;
  }

  const body = CELESTIAL_BODIES[selectedCosmicBodyId];
  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const description = language === 'ar' ? body.descriptionAr : body.descriptionEn;
  const nucleosynthesisRole = language === 'ar' ? body.nucleosynthesisRoleAr : body.nucleosynthesisRoleEn;

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${body.nameEn} astronomy space science`
  )}`;

  // Card content, shared by the desktop floating card and the phone bottom sheet
  const details = (
    <>
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
          <a
            href={body.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full cursor-zoom-in"
            title={language === 'ar' ? 'فتح الصورة كاملة في علامة تبويب جديدة' : 'Open the full image in a new tab'}
          >
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
          </a>
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

    {/* Interstellar probe telemetry: heading, speed and next stellar encounter (NASA/JPL figures) */}
    {PROBE_TELEMETRY[body.id] && (() => {
      const t = PROBE_TELEMETRY[body.id];
      const ar = language === 'ar';
      return (
        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-sky-300">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{ar ? 'بيانات المسار بين النجوم' : 'Interstellar Telemetry'}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200 font-mono">{ar ? t.headingAr : t.headingEn}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">{ar ? 'سرعة الابتعاد عن الشمس' : 'Speed away from the Sun'}</span>
              <span className="font-semibold text-slate-200">{t.speed}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 block text-[9px]">{ar ? 'اللقاء النجمي القادم' : 'Next stellar encounter'}</span>
              <span className="font-semibold text-sky-200">{ar ? t.targetAr : t.targetEn}</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
            <span className="text-amber-400 font-semibold block mb-0.5">
              {ar ? '💡 هل يتجه نحو أقرب نجم (بروكسيما قنطورس)؟' : '💡 Heading to the nearest star (Proxima)?'}
            </span>
            <span>{ar ? t.noteAr : t.noteEn}</span>
          </div>
        </div>
      );
    })()}

    {/* Honesty note: this body's orbit runs slower or faster than its true ratio so it stays watchable */}
    {isMotionScaled(body.id) && (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-[11px] text-cyan-200">
        <span>⏱</span>
        <span>
          {language === 'ar'
            ? 'الحركة المدارية مُسرّعة لتبقى مرئية (النسب الحقيقية أبطأ أو أسرع بكثير)'
            : 'Orbital motion speeded up to stay watchable (the real period is much shorter or longer)'}
        </span>
      </div>
    )}

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

    {/* Action Buttons: Enter Galaxy + Video Masterclass + Google Search */}
    <div className="space-y-2 pt-1">
      {isEnterableGalaxy(body.id) && (
        <button
          type="button"
          onClick={() => requestGalaxyEntry(body.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <Rocket className="w-4 h-4" />
          <span>{language === 'ar' ? 'ادخل إلى هذه المجرة 🚀' : 'Enter this galaxy 🚀'}</span>
        </button>
      )}

      {body.videoId && (
        <button
          type="button"
          onClick={() => {
            const videoMap: Record<string, string> = {
              sun: 'the_sun_fusion_engine',
              voyager_1: 'voyager_interstellar_mission',
              voyager_2: 'voyager_interstellar_mission',
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
    </>
  );

  // CC BY 4.0 attribution for the real surface maps used by the 3D planets and stars
  const mapCredit = (
    <p className="pt-1 text-[10px] text-slate-500">
      {language === 'ar' ? 'خرائط الأسطح ثلاثية الأبعاد: ' : '3D surface maps: '}
      <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
        Solar System Scope
      </a>{' '}
      (CC BY 4.0)
    </p>
  );

  const closeButton = (
    <button
      id="close-celestial-tooltip-btn"
      type="button"
      onClick={() => setSelectedCosmicBodyId(null)}
      className="p-1 coarse:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
      title={language === 'ar' ? 'إغلاق' : 'Close'}
      aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
    >
      <X className="w-4 h-4 coarse:w-5 coarse:h-5" />
    </button>
  );

  const titleRow = (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-3.5 h-3.5 rounded-full shadow-md shrink-0" style={{ backgroundColor: body.color }} />
      <h3 className="font-bold text-base text-white truncate">{displayName}</h3>
    </div>
  );

  // Phones: a bottom sheet, so the object the camera just flew to stays visible above it
  if (isCompact) {
    return (
      <BottomSheet
        ref={cardRef}
        animationKey={selectedCosmicBodyId}
        ariaLabel={displayName}
        header={titleRow}
        actions={closeButton}
      >
        <div id="celestial-inspector-card" className="p-4 space-y-3.5">
          {details}
          {mapCredit}
        </div>
      </BottomSheet>
    );
  }

  return (
    <div
      key={selectedCosmicBodyId}
      ref={cardRef}
      className={`card-reveal fixed z-40 select-none pointer-events-auto transition-shadow duration-200 ${
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
          className="w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden"
        >
          {/* Header Bar (Draggable) */}
          <div
            className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/70 cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
          >
            <div className="flex-1 min-w-0">{titleRow}</div>

            {/* Actions: Drag Handle, Minimize, Close */}
            <div className="flex items-center gap-1 shrink-0">
              <div
                className="p-1 text-slate-500 hover:text-slate-300 transition cursor-grab active:cursor-grabbing"
                title={language === 'ar' ? 'اسحب لتحريك البطاقة' : 'Drag to reposition'}
              >
                <Move className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1 coarse:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={language === 'ar' ? 'تصغير' : 'Collapse'}
                aria-label={language === 'ar' ? 'تصغير' : 'Collapse'}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              {closeButton}
            </div>
          </div>

          <div className="p-4 space-y-3.5 max-h-[65dvh] md:max-h-[72dvh] overflow-y-auto">
            {details}
            {mapCredit}
          </div>
        </div>
      )}
    </div>
  );
};
