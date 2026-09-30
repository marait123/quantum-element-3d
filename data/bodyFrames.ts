// Where each moving body sits relative to its parent (see lib/frames.ts and the Cosmic Frame Graph design).
// Bodies without an entry are fixed at their `position` in CELESTIAL_BODIES.
//
// Real values are used wherever they exist: orbital periods (days), J2000 mean longitudes (so bodies start where
// they really are on today's date) and inclinations. Orbit *radii* are scene units: the scene compresses distances
// per scale, so radii keep each body clear of its parent's rendered size rather than following real distances.

export type Vec3 = [number, number, number];

export interface OrbitFrame {
  kind: 'orbit';
  parent: string;
  radius: number; // scene units
  periodDays: number; // real sidereal period
  // Starting angle: a real J2000 mean longitude (degrees, ecliptic) when known, else an arbitrary phase
  meanLongitudeJ2000?: number;
  phaseDeg?: number;
  inclinationDeg?: number; // tilt of the orbit plane
  nodeDeg?: number; // longitude of the ascending node (direction of the tilt axis)
  retrograde?: boolean;
  // Screen period limits (seconds at ×1): very fast orbits are slowed to stay visible
  minPeriodSeconds?: number;
  maxPeriodSeconds?: number;
}

export interface LagrangeFrame {
  kind: 'lagrange';
  parent: string; // the secondary body (e.g. Earth)
  primary: string; // the primary (e.g. the Sun)
  point: 'L2';
  distance: number; // scene units beyond the secondary
}

// Unbound, straight-line escape along a real ecliptic heading (the Voyagers)
export interface TrajectoryFrame {
  kind: 'trajectory';
  parent: 'sun';
  lonDeg: number; // ecliptic longitude of the heading
  latDeg: number; // ecliptic latitude of the heading
  distance: number; // scene units from the Sun when the simulation starts
  unitsPerYear: number; // outward speed in scene units per simulated year
}

export type BodyFrame = OrbitFrame | LagrangeFrame | TrajectoryFrame;

// J2000 mean longitudes: E. M. Standish, "Keplerian Elements for Approximate Positions of the Major Planets"
// (JPL, 1992/2006), degrees. Periods: sidereal, days.
export const BODY_FRAMES: Record<string, BodyFrame> = {
  // ---- Planets around the Sun
  mercury: { kind: 'orbit', parent: 'sun', radius: 7.5, periodDays: 87.969, meanLongitudeJ2000: 252.2503, inclinationDeg: 7.0, nodeDeg: 48.33 },
  venus: { kind: 'orbit', parent: 'sun', radius: 11.0, periodDays: 224.701, meanLongitudeJ2000: 181.9791, inclinationDeg: 3.39, nodeDeg: 76.68 },
  earth: { kind: 'orbit', parent: 'sun', radius: 15.5, periodDays: 365.256, meanLongitudeJ2000: 100.4646 },
  mars: { kind: 'orbit', parent: 'sun', radius: 21.0, periodDays: 686.98, meanLongitudeJ2000: 355.4466, inclinationDeg: 1.85, nodeDeg: 49.56 },
  ceres: { kind: 'orbit', parent: 'sun', radius: 26.5, periodDays: 1680.5, phaseDeg: 160, inclinationDeg: 10.59, nodeDeg: 80.3 }, // phase illustrative
  jupiter: { kind: 'orbit', parent: 'sun', radius: 33.0, periodDays: 4332.59, meanLongitudeJ2000: 34.3964, inclinationDeg: 1.3, nodeDeg: 100.46 },
  saturn: { kind: 'orbit', parent: 'sun', radius: 42.0, periodDays: 10759.22, meanLongitudeJ2000: 49.9542, inclinationDeg: 2.49, nodeDeg: 113.66 },
  uranus: { kind: 'orbit', parent: 'sun', radius: 51.0, periodDays: 30688.5, meanLongitudeJ2000: 313.2381, inclinationDeg: 0.77, nodeDeg: 74.0 },
  neptune: { kind: 'orbit', parent: 'sun', radius: 58.0, periodDays: 60182, meanLongitudeJ2000: 304.88, inclinationDeg: 1.77, nodeDeg: 131.78 },
  pluto: { kind: 'orbit', parent: 'sun', radius: 64.0, periodDays: 90560, meanLongitudeJ2000: 238.9288, inclinationDeg: 17.14, nodeDeg: 110.3 },

  // ---- Near-Earth and belt asteroids (real periods and inclinations; phases are illustrative)
  bennu_asteroid: { kind: 'orbit', parent: 'sun', radius: 23.5, periodDays: 436.6, phaseDeg: 30, inclinationDeg: 6.03, nodeDeg: 2.06 },
  psyche_asteroid: { kind: 'orbit', parent: 'sun', radius: 28.0, periodDays: 1826, phaseDeg: 250, inclinationDeg: 3.1, nodeDeg: 150.0 },
  apophis_asteroid: { kind: 'orbit', parent: 'sun', radius: 19.0, periodDays: 323.6, phaseDeg: 300, inclinationDeg: 3.34, nodeDeg: 204.0 },

  // ---- Moons (the Moon uses its real mean longitude, so its phase in the sky is right)
  moon: { kind: 'orbit', parent: 'earth', radius: 3.2, periodDays: 27.3217, meanLongitudeJ2000: 218.3165, inclinationDeg: 5.14, nodeDeg: 125.04 },
  phobos: { kind: 'orbit', parent: 'mars', radius: 1.8, periodDays: 0.31891, phaseDeg: 0, inclinationDeg: 1.08, minPeriodSeconds: 8 },
  europa: { kind: 'orbit', parent: 'jupiter', radius: 5.2, periodDays: 3.5512, phaseDeg: 120, inclinationDeg: 0.47, minPeriodSeconds: 8 },
  titan: { kind: 'orbit', parent: 'saturn', radius: 6.8, periodDays: 15.945, phaseDeg: 200, inclinationDeg: 0.35, minPeriodSeconds: 8 },

  // ---- Spacecraft
  // Hubble: low Earth orbit, 95.4 min, inclined 28.5° to the equator (shown at the 8 s floor)
  hubble: { kind: 'orbit', parent: 'earth', radius: 1.95, periodDays: 95.42 / 1440, phaseDeg: 60, inclinationDeg: 28.5, minPeriodSeconds: 8 },
  // JWST: halo orbit around Sun–Earth L2, on the far side of Earth from the Sun, moving with Earth
  // (4 units: just beyond the Moon's orbit; the real L2 is ~4 lunar distances out, but the scene squeezes Earth-Mars)
  jwst: { kind: 'lagrange', parent: 'earth', primary: 'sun', point: 'L2', distance: 4.2 },

  // ---- Interstellar probes: NASA headings (35° north / 48° south of the ecliptic), 3.6 and 3.3 AU/year (~170 and ~142 AU in 2026;
  // the scene compresses distance beyond the planets, ~0.69 units per AU out here)
  voyager_1: { kind: 'trajectory', parent: 'sun', lonDeg: 255.9, latDeg: 34.9, distance: 117.6, unitsPerYear: 2.46 },
  voyager_2: { kind: 'trajectory', parent: 'sun', lonDeg: 288.6, latDeg: -48.0, distance: 99.8, unitsPerYear: 2.28 },
};

export const DEFAULT_MIN_PERIOD_SECONDS = 8;

// Real orbital periods (days) for bodies whose renderer draws the orbit inside its star-system group (exoplanets,
// binaries). Renderers turn them into an angle with systemOrbitAngle(id, simClock.time) in lib/frames.ts.
export const ORBITAL_PERIOD_DAYS: Record<string, number> = {
  proxima_centauri_b: 11.186,
  cancri_55_e: 0.7365,
  trappist_1e: 6.101,
  k2_18b: 32.94,
  hd_189733_b: 2.2186,
  pegasi_51_b: 4.2308,
  toi_700_d: 37.42,
  barnard_b: 3.154,
  tau_ceti_e: 162.9,
  gliese_667c_e: 62.24,
  lhs_1140_b: 24.737,
  kepler_22b: 289.86,
  wasp_12b: 1.0914,
  psr_j1719_1438_b: 0.0907,
  kepler_452b: 384.84,
  kepler_186f: 129.94,
  kepler_16b: 228.78,
  kepler_1649c: 19.54,
  kelt_9b: 1.4811,
  kepler_90_h: 331.6,
  wasp_76_b: 1.8099,
  // Binaries (the pair orbits its barycentre)
  sirius_b: 18310, // 50.1 years
  kepler_16_ab: 41.08,
  m33_x7_black_hole: 3.453,
  smc_x1_pulsar: 3.892,
  cygnus_x1: 5.6,
};
