'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Clock, CalendarDays, X } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { setSimTimeScale, simClock, onSimClockChange, skyDateMs, travelToDate, skyDaysSinceJ2000 } from '@/lib/simClock';
import { earthSeason, seasonEventDate, SeasonName, SeasonEvent } from '@/lib/ephemeris';
import { useIsCompact } from '@/lib/useMediaQuery';

// Simulation time: the date the sky is showing (it starts at today's real date) and how fast it runs.
// At ×1 one Earth year takes EARTH_YEAR_SECONDS (3 minutes). Planets, the Moon, Earth's tilt and spin all follow
// this date (lib/ephemeris.ts), so the season can be read off Earth's position. Picking a date glides there.
const SPEEDS = [1, 10, 100];
const MIN_DATE = '1800-01-01';
const MAX_DATE = '2200-12-31';

const SEASON_ICON: Record<SeasonName, string> = { spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_TEXT: Record<SeasonName, { en: string; ar: string }> = {
  spring: { en: 'Spring', ar: 'الربيع' },
  summer: { en: 'Summer', ar: 'الصيف' },
  autumn: { en: 'Autumn', ar: 'الخريف' },
  winter: { en: 'Winter', ar: 'الشتاء' },
};
const EVENT_TEXT: Record<SeasonEvent, { en: string; ar: string }> = {
  march_equinox: { en: 'March equinox', ar: 'اعتدال مارس' },
  june_solstice: { en: 'June solstice', ar: 'انقلاب يونيو' },
  september_equinox: { en: 'September equinox', ar: 'اعتدال سبتمبر' },
  december_solstice: { en: 'December solstice', ar: 'انقلاب ديسمبر' },
};
const EVENTS: SeasonEvent[] = ['march_equinox', 'june_solstice', 'september_equinox', 'december_solstice'];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateInput = (ms: number) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const toTimeInput = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
function formatSkyDate(language: 'en' | 'ar', ms = skyDateMs()) {
  return new Date(ms).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function useSkySnapshot(language: 'en' | 'ar') {
  const read = () => ({ label: formatSkyDate(language), ms: skyDateMs(), season: earthSeason(skyDaysSinceJ2000()) });
  const [snap, setSnap] = useState(read);
  useEffect(() => {
    setSnap(read());
    // The label ticks a few times a second (cheap; nothing else re-renders)
    const id = setInterval(() => setSnap(read()), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  return snap;
}

/** Season card: both hemispheres, the Sun's place on the ecliptic and the next equinox or solstice */
const SeasonInfo: React.FC<{ season: ReturnType<typeof earthSeason>; language: 'en' | 'ar' }> = ({ season, language }) => {
  const ar = language === 'ar';
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {(['north', 'south'] as const).map((h) => (
          <div key={h} className="px-2 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[9px] uppercase tracking-wide text-slate-500">
              {h === 'north' ? (ar ? 'نصف الكرة الشمالي' : 'Northern hemisphere') : ar ? 'نصف الكرة الجنوبي' : 'Southern hemisphere'}
            </div>
            <div className="text-[13px] font-bold text-slate-100">
              {SEASON_ICON[season[h]]} {SEASON_TEXT[season[h]][language]}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] leading-relaxed text-slate-400">
        {ar ? 'التالي: ' : 'Next: '}
        <span className="text-cyan-300 font-semibold">{EVENT_TEXT[season.nextEvent][language]}</span>
        {ar ? ` بعد ${season.daysToNextEvent} يوماً` : ` in ${season.daysToNextEvent} days`}
        <span className="block text-slate-500">
          {ar
            ? `الشمس عند خط طول بروجي ${season.sunLongitudeDeg.toFixed(1)}°. الفصول سببها ميل محور الأرض 23.4°، لا بعدها عن الشمس.`
            : `Sun at ecliptic longitude ${season.sunLongitudeDeg.toFixed(1)}°. Seasons come from Earth's 23.4° axial tilt, not its distance from the Sun.`}
        </span>
      </div>
    </div>
  );
};

export const TimeControl: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const ar = language === 'ar';
  const isCompact = useIsCompact();
  const [scale, setScale] = useState(simClock.scale);
  const [lastSpeed, setLastSpeed] = useState(1);
  const sky = useSkySnapshot(language);
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('12:00');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => onSimClockChange(() => setScale(simClock.scale)), []);

  // Close on Escape or a press outside the control
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const openPicker = () => {
    const now = skyDateMs();
    setDraftDate(toDateInput(now));
    setDraftTime(toTimeInput(now));
    setOpen((o) => !o);
  };

  const go = (ms: number) => {
    // The sky holds the chosen date when it arrives; Play then resumes at the speed it had
    if (scale > 0) setLastSpeed(scale);
    travelToDate(ms);
    setDraftDate(toDateInput(ms));
    setDraftTime(toTimeInput(ms));
  };
  // Apply a date (and time) as soon as it is picked: choosing a day in the calendar, including its "Today", goes there
  // straight away. Picking today's date goes to the present moment rather than the time in the time field.
  const goToDraft = (date = draftDate, time = draftTime) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return;
    if (date === toDateInput(Date.now()) && time === draftTime && date !== draftDate) {
      go(Date.now());
      return;
    }
    const [hh, mm] = (time || '12:00').split(':').map(Number);
    const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], hh || 0, mm || 0);
    if (ms < Date.UTC(1800, 0, 1) || ms > Date.UTC(2200, 11, 31, 23, 59)) return;
    go(ms);
  };
  const skyYear = new Date(sky.ms).getUTCFullYear();

  const paused = scale === 0;
  const t = {
    pause: ar ? 'إيقاف الزمن' : 'Pause time',
    play: ar ? 'تشغيل الزمن' : 'Resume time',
    speed: ar ? 'سرعة الزمن' : 'Time speed',
    date: ar ? 'تاريخ السماء المعروضة — اختر تاريخاً' : 'Date shown in the sky — pick a date',
  };

  return (
    <div
      ref={rootRef}
      id="time-control"
      className="fixed start-3 sm:start-4 z-30 bottom-[calc(var(--hud-bottom,72px)+4rem)] xl:bottom-[4.1rem] flex items-center gap-1 p-1 rounded-2xl bg-slate-950/85 border border-slate-700/70 backdrop-blur-xl shadow-2xl pointer-events-auto select-none"
    >
      <button
        type="button"
        onClick={() => {
          if (paused) setSimTimeScale(lastSpeed);
          else {
            setLastSpeed(scale);
            setSimTimeScale(0);
          }
        }}
        className="p-1.5 coarse:p-2 rounded-xl text-slate-200 hover:bg-slate-800 cursor-pointer"
        title={paused ? t.play : t.pause}
        aria-label={paused ? t.play : t.pause}
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>

      {/* The date: hover shows the season, click opens the date picker */}
      <div className="relative group">
        <button
          type="button"
          id="sky-date-button"
          onClick={openPicker}
          aria-expanded={open}
          aria-label={t.date}
          className={`flex items-center gap-1 px-1.5 py-1 coarse:min-h-9 rounded-xl text-[11px] font-mono tabular-nums cursor-pointer transition ${
            open ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{sky.label}</span>
          <span aria-hidden className="text-[11px]">{SEASON_ICON[sky.season.north]}</span>
        </button>

        {!open && (
          <div
            id="sky-season-tooltip"
            role="tooltip"
            className="hidden can-hover:group-hover:block absolute bottom-full start-0 mb-2 w-72 p-3 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl pointer-events-none"
          >
            <div className="text-[11px] font-bold text-slate-200 mb-2">
              {ar ? 'فصول الأرض في هذا التاريخ' : "Earth's seasons on this date"}
            </div>
            <SeasonInfo season={sky.season} language={language} />
            <div className="mt-2 text-[10px] text-slate-500">{ar ? 'انقر لاختيار تاريخ' : 'Click to pick a date'}</div>
          </div>
        )}

        {open && (
          <div
            id="sky-date-picker"
            className="absolute bottom-full start-0 mb-2 w-[19rem] max-w-[calc(100vw-1.5rem)] p-3 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl space-y-3 select-text"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-100">
                <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                {ar ? 'انتقل إلى تاريخ' : 'Go to a date'}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 coarse:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label={ar ? 'إغلاق' : 'Close'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form
              className="flex items-end gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                goToDraft();
              }}
            >
              <label className="flex-1 min-w-0">
                <span className="block text-[9px] uppercase tracking-wide text-slate-500 mb-0.5">{ar ? 'التاريخ' : 'Date'}</span>
                <input
                  id="sky-date-input"
                  type="date"
                  min={MIN_DATE}
                  max={MAX_DATE}
                  value={draftDate}
                  onChange={(e) => {
                    setDraftDate(e.target.value);
                    goToDraft(e.target.value, draftTime);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[12px] text-slate-100 font-mono [color-scheme:dark] focus:outline-none focus:border-cyan-500"
                />
              </label>
              <label className="w-[5.5rem] shrink-0">
                <span className="block text-[9px] uppercase tracking-wide text-slate-500 mb-0.5">{ar ? 'الوقت (UTC)' : 'Time (UTC)'}</span>
                <input
                  id="sky-time-input"
                  type="time"
                  value={draftTime}
                  onChange={(e) => {
                    setDraftTime(e.target.value);
                    goToDraft(draftDate, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[12px] text-slate-100 font-mono [color-scheme:dark] focus:outline-none focus:border-cyan-500"
                />
              </label>
              <button
                id="sky-date-go"
                type="submit"
                className="shrink-0 px-3 py-1.5 coarse:min-h-10 rounded-lg bg-cyan-500 text-slate-950 text-[12px] font-bold hover:bg-cyan-400 cursor-pointer"
              >
                {ar ? 'انتقال' : 'Go'}
              </button>
            </form>

            {/* Quick jumps: today and this sky-year's equinoxes and solstices */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => go(Date.now())}
                className="px-2 py-1 coarse:min-h-9 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                {ar ? 'اليوم' : 'Today'}
              </button>
              {EVENTS.map((ev, i) => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => go(seasonEventDate(skyYear, i as 0 | 1 | 2 | 3))}
                  className="px-2 py-1 coarse:min-h-9 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:border-cyan-600 hover:text-white cursor-pointer"
                >
                  {EVENT_TEXT[ev][language]} {skyYear}
                </button>
              ))}
            </div>

            <SeasonInfo season={sky.season} language={language} />
            <div className="text-[9px] text-slate-500">
              {ar
                ? 'المواقع من عناصر المدارات الحقيقية (JPL) واتجاهات محاور الكواكب (IAU)، بين 1800 و2200.'
                : 'Positions from real orbital elements (JPL) and planet axes (IAU), 1800–2200.'}
            </div>
          </div>
        )}
      </div>

      {isCompact ? (
        <button
          type="button"
          onClick={() => setSimTimeScale(SPEEDS[(SPEEDS.indexOf(scale) + 1) % SPEEDS.length] ?? 1)}
          className="px-2.5 py-1 min-h-9 min-w-10 rounded-xl text-[11px] font-mono font-bold bg-slate-900/80 text-cyan-300 cursor-pointer"
          aria-label={t.speed}
        >
          {paused ? '0×' : `${scale}×`}
        </button>
      ) : (
        SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSimTimeScale(s)}
            className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold cursor-pointer transition ${
              scale === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900/80 text-slate-400 hover:text-white'
            }`}
            title={`${t.speed}: ${s}×`}
          >
            {s}×
          </button>
        ))
      )}
    </div>
  );
};
