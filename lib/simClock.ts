// One simulation clock for everything that moves in the universe (orbits, binaries, galaxy spin, trajectories).
// Components never accumulate their own angles or read wall-clock time for motion: they ask lib/frames.ts where a
// body is at `simClock.time`, so any code (visibility rules, camera, tests) gets the same answer.
//
// `time` is simulation seconds since the page loaded. `scale` multiplies real frame time (0 = paused). The real
// date the simulation starts at (`epochMs`) lets planets begin where they really are in the sky today.

export const EARTH_YEAR_SECONDS = 180; // one Earth orbit on screen at ×1

export const simClock = {
  time: 0,
  scale: 1,
  epochMs: typeof Date !== 'undefined' ? Date.now() : 0,
};

const listeners = new Set<() => void>();

export function advanceSimClock(deltaSeconds: number) {
  // Clamp huge deltas (tab in background) so bodies don't jump across their orbits
  simClock.time += Math.min(deltaSeconds, 0.1) * simClock.scale;
}

export function setSimTimeScale(scale: number) {
  simClock.scale = Math.max(0, scale);
  listeners.forEach((l) => l());
}

export function onSimClockChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Days elapsed in the real sky: real days since J2000 at the simulation's start plus the simulated time
// (EARTH_YEAR_SECONDS of simulation = one year)
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
export function skyDaysSinceJ2000(simTime: number = simClock.time) {
  return (simClock.epochMs - J2000_MS) / 86400000 + (simTime / EARTH_YEAR_SECONDS) * 365.25;
}
