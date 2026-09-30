'use client';

import { useEffect, useState } from 'react';

/**
 * Reactive CSS media query. Returns false during server render and the first client paint, then follows the query
 * (resize, rotation, zoom). Use the helpers below rather than ad-hoc `innerWidth` checks.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Phone layouts: narrow portrait screens and short landscape screens (a phone on its side is ~800px wide but only
// ~375px tall, too short for the desktop HUD)
export const COMPACT_QUERY = '(max-width: 767px), (max-height: 500px)';
// Finger input (phones, tablets): no hover, larger tap targets, gestures instead of keyboard/wheel
export const TOUCH_QUERY = '(pointer: coarse)';

export const useIsCompact = () => useMediaQuery(COMPACT_QUERY);
export const useIsTouch = () => useMediaQuery(TOUCH_QUERY);

// Non-hook check for code that runs once (store init, event handlers)
export const matchesQuery = (query: string) =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
