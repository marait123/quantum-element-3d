'use client';

import React, { useRef, useEffect } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENTS, CATEGORY_COLORS } from '@/data/elementsData';

const RANGES = [
  { label: '1-10', start: 1, end: 10 },
  { label: '11-20', start: 11, end: 20 },
  { label: '21-36', start: 21, end: 36 },
  { label: '37-54', start: 37, end: 54 },
  { label: '55-86', start: 55, end: 86 },
  { label: '87-118', start: 87, end: 118 },
];

export const MobileElementStrip: React.FC = () => {
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Publish the strip's height as --strip-h so the scale dock sits just above it (0 when hidden)
  const isHidden = scaleLevel === 5;
  useEffect(() => {
    const el = rootRef.current;
    const root = document.documentElement;
    if (!el || isHidden) {
      root.style.setProperty('--strip-h', '0px');
      return;
    }
    const publish = () => root.style.setProperty('--strip-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--strip-h', '0px');
    };
  }, [isHidden]);

  // Auto-scroll strip to active element
  useEffect(() => {
    if (activeBtnRef.current && containerRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeElementNum]);

  // Keep it compact or hidden during Planck scale if desired, but good to have everywhere
  if (scaleLevel === 5) return null;

  return (
    <div ref={rootRef} className="md:hidden absolute bottom-0 inset-x-0 z-20 pointer-events-auto flex flex-col gap-1 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]">
      {/* Fast Jump Section Chips (centred when they fit, scrolling when they don't) */}
      <div className="overflow-x-auto no-scrollbar py-0.5">
      <div className="flex items-center gap-1.5 w-max mx-auto">
        {RANGES.map((r) => {
          const isCurrentRange =
            activeElementNum >= r.start && activeElementNum <= r.end;
          return (
            <button
              key={r.label}
              onClick={() => setActiveElement(r.start)}
              className={`px-2.5 min-h-[30px] rounded-full text-[11px] font-mono font-bold transition whitespace-nowrap ${
                isCurrentRange
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      </div>

      {/* Horizontal Scroll Strip */}
      <div
        ref={containerRef}
        className="glass-panel p-1 rounded-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none snap-x"
      >
        {ELEMENTS.map((el) => {
          const isActive = el.num === activeElementNum;
          const catMeta = CATEGORY_COLORS[el.cat];

          return (
            <button
              key={el.num}
              ref={isActive ? activeBtnRef : null}
              onClick={() => setActiveElement(el.num)}
              className={`snap-center flex-shrink-0 w-11 h-12 rounded-lg flex flex-col items-center justify-center transition relative ${
                isActive
                  ? 'bg-slate-800 border-2 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/60 border border-white/5 hover:bg-slate-800/80'
              }`}
            >
              <div
                className="absolute top-0 inset-x-0 h-1 rounded-t-lg"
                style={{ backgroundColor: catMeta?.hex || '#ffffff' }}
              />
              <span className="text-[9px] text-slate-400 font-mono">
                {el.num}
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                {el.sym}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
