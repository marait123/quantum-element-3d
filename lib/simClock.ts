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

// A date jump in progress: time glides from `from` to `to` (eased), so planets visibly sweep to their new places
let travel: { from: number; to: number; elapsed: number; duration: number } | null = null;

export function advanceSimClock(deltaSeconds: number) {
  // Clamp huge deltas (tab in background) so bodies don't jump across their orbits
  const dt = Math.min(deltaSeconds, 0.1);
  if (travel) {
    travel.elapsed += dt;
    const k = Math.min(1, travel.elapsed / travel.duration);
    const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    simClock.time = travel.from + (travel.to - travel.from) * eased;
    if (k >= 1) {
      travel = null;
      simClock.scale = 0; // stay on the chosen date; Play resumes from there
      listeners.forEach((l) => l());
    }
    return;
  }
  simClock.time += dt * simClock.scale;
}

/** UTC date (ms) the sky shows at simulation time t */
export const skyDateMs = (t: number = simClock.time) => simClock.epochMs + (t / EARTH_YEAR_SECONDS) * 365.25 * 86400000;
/** Simulation time at which the sky shows a UTC date */
export const simTimeForDate = (utcMs: number) => ((utcMs - simClock.epochMs) / 86400000 / 365.25) * EARTH_YEAR_SECONDS;

/** Glide the sky to a date (short jumps under a second, a century about two), then hold it there (paused) */
export function travelToDate(utcMs: number) {
  const to = simTimeForDate(utcMs);
  const years = Math.abs(to - simClock.time) / EARTH_YEAR_SECONDS;
  const duration = Math.min(2.4, Math.max(0.8, 0.8 + 0.6 * Math.log10(1 + years)));
  travel = { from: simClock.time, to, elapsed: 0, duration };
  listeners.forEach((l) => l());
}

export const isTravellingInTime = () => travel !== null;

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
