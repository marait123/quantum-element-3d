'use client';

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

// Height of each snap point (fractions of the dynamic viewport height; `peek` shows just the title bar)
const SNAP_FRACTION: Record<Exclude<SheetSnap, 'peek'>, number> = { half: 0.46, full: 0.88 };
const PEEK_PX = 68;

interface BottomSheetProps {
  /** Title bar content (left side). The drag handle sits above it. */
  header: React.ReactNode;
  /** Buttons at the end of the title bar (close, etc.) */
  actions?: React.ReactNode;
  children: React.ReactNode;
  initialSnap?: SheetSnap;
  /** Replay the entrance animation when this changes (e.g. the selected body) */
  animationKey?: string | number;
  className?: string;
  ariaLabel?: string;
  zIndexClass?: string;
}

/**
 * Phone presentation for panels that are floating cards on desktop: a sheet docked to the bottom edge, so the 3D
 * object stays visible above it. Drag the handle/title bar (or tap it) to move between peek, half and full height;
 * the body scrolls. Safe-area aware.
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(function BottomSheet(
  { header, actions, children, initialSnap = 'half', animationKey, className = '', ariaLabel, zIndexClass = 'z-40' },
  ref
) {
  const [snap, setSnap] = useState<SheetSnap>(initialSnap);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setSnap(initialSnap), [animationKey, initialSnap]);

  const heightFor = useCallback((s: SheetSnap) => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    return s === 'peek' ? PEEK_PX : Math.round(vh * SNAP_FRACTION[s]);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    const h = sheetRef.current?.getBoundingClientRect().height ?? heightFor(snap);
    drag.current = { startY: e.clientY, startH: h, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    setDragHeight(Math.min(vh * SNAP_FRACTION.full, Math.max(PEEK_PX, d.startH - dy)));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      // Tap on the handle/title bar: toggle between peek and half (full from half)
      setSnap((s) => (s === 'peek' ? 'half' : s === 'half' ? 'full' : 'half'));
      setDragHeight(null);
      return;
    }
    const h = dragHeight ?? d.startH;
    const snaps: SheetSnap[] = ['peek', 'half', 'full'];
    const nearest = snaps.reduce((best, s) => (Math.abs(heightFor(s) - h) < Math.abs(heightFor(best) - h) ? s : best));
    setSnap(nearest);
    setDragHeight(null);
  };

  const style: React.CSSProperties =
    dragHeight !== null
      ? { height: dragHeight }
      : snap === 'peek'
        ? { height: PEEK_PX }
        : { height: `${SNAP_FRACTION[snap] * 100}dvh` };

  return (
    <div
      ref={(el) => {
        sheetRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      role="dialog"
      aria-label={ariaLabel}
      key={animationKey}
      className={`fixed inset-x-0 bottom-0 ${zIndexClass} flex flex-col rounded-t-3xl bg-slate-950/95 border-t border-x border-slate-700/80 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl text-slate-100 pointer-events-auto animate-slideUp ${
        dragHeight === null ? 'transition-[height] duration-200 ease-out' : ''
      } ${className}`}
      style={style}
    >
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="block w-10 h-1.5 rounded-full bg-slate-600" />
        </div>
        <div className="flex items-center gap-2 px-4 pb-2 min-h-[44px]">
          <div className="flex-1 min-w-0">{header}</div>
          {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y border-t border-slate-800/80 pb-safe">
        {children}
      </div>
    </div>
  );
});
