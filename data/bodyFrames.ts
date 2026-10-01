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
  // 'equator': the orbit lies in the parent's real equatorial plane (its IAU pole, lib/ephemeris.ts) instead of
  // inclinationDeg/nodeDeg. Regular moons orbit there (Saturn's moons in the ring plane, Uranus's tipped over…).
  plane?: 'equator';
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

// A probe's real route: launch from Earth, through its planetary flybys (where those planets really were on the
// flyby dates), to its escape heading; then straight out along that heading (the Voyagers, Pioneers, New Horizons)
export interface TrajectoryFrame {
  kind: 'trajectory';
  parent: 'sun';
  lonDeg: number; // ecliptic longitude of the heading
  latDeg: number; // ecliptic latitude of the heading
  distance: number; // scene units from the Sun on TRAJECTORY_REFERENCE_UTC
  unitsPerYear: number; // outward speed in scene units per year
  // Launch (first entry, Earth) and flybys: [body, UTC ms]
  route: [string, number][];
}

/** The date the trajectory `distance` values refer to */
export const TRAJECTORY_REFERENCE_UTC = Date.UTC(2026, 9, 1);

/** Launch dates: spacecraft are not shown before them */
export const LAUNCH_UTC: Record<string, number> = {
  pioneer_10: Date.UTC(1972, 2, 3),
  pioneer_11: Date.UTC(1973, 3, 6),
  voyager_2: Date.UTC(1977, 7, 20),
  voyager_1: Date.UTC(1977, 8, 5),
  hubble: Date.UTC(1990, 3, 24),
  new_horizons: Date.UTC(2006, 0, 19),
  jwst: Date.UTC(2021, 11, 25),
};

export type BodyFrame = OrbitFrame | LagrangeFrame | TrajectoryFrame;

// Planets (and the Moon) are placed by real orbital elements for the sky date (lib/ephemeris.ts): true direction,
// eccentric orbit, distance scaled to `radius`. Their periods and J2000 mean longitudes below are kept for reference
// and for bodies without elements. Periods: sidereal, days.
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
  phobos: { kind: 'orbit', parent: 'mars', radius: 1.8, periodDays: 0.31891, phaseDeg: 0, plane: 'equator', minPeriodSeconds: 8 },
  europa: { kind: 'orbit', parent: 'jupiter', radius: 5.2, periodDays: 3.5512, phaseDeg: 120, plane: 'equator', minPeriodSeconds: 8 },
  // Moons orbit in their planet's equatorial plane (Saturn's rings plane, Uranus tipped over, Pluto's tilt)
  titan: { kind: 'orbit', parent: 'saturn', radius: 6.8, periodDays: 15.945, phaseDeg: 200, plane: 'equator', minPeriodSeconds: 8 },
  enceladus: { kind: 'orbit', parent: 'saturn', radius: 5.8, periodDays: 1.370, phaseDeg: 60, plane: 'equator', minPeriodSeconds: 8 },
  deimos: { kind: 'orbit', parent: 'mars', radius: 2.5, periodDays: 1.263, phaseDeg: 200, plane: 'equator', minPeriodSeconds: 8 },
  io: { kind: 'orbit', parent: 'jupiter', radius: 4.4, periodDays: 1.769, phaseDeg: 30, plane: 'equator', minPeriodSeconds: 8 },
  ganymede: { kind: 'orbit', parent: 'jupiter', radius: 6.8, periodDays: 7.155, phaseDeg: 250, plane: 'equator', minPeriodSeconds: 8 },
  callisto: { kind: 'orbit', parent: 'jupiter', radius: 8.8, periodDays: 16.689, phaseDeg: 80, plane: 'equator', minPeriodSeconds: 8 },
  titania: { kind: 'orbit', parent: 'uranus', radius: 3.8, periodDays: 8.706, phaseDeg: 140, plane: 'equator', minPeriodSeconds: 8 },
  // Triton: retrograde (a captured Kuiper-belt object)
  triton: { kind: 'orbit', parent: 'neptune', radius: 3.2, periodDays: 5.877, phaseDeg: 100, inclinationDeg: 23, retrograde: true, minPeriodSeconds: 8 },
  charon: { kind: 'orbit', parent: 'pluto', radius: 1.4, periodDays: 6.387, phaseDeg: 0, plane: 'equator', minPeriodSeconds: 8 },

  // ---- Spacecraft
  // Hubble: low Earth orbit, 95.4 min, inclined 28.5° to the equator (shown at the 8 s floor)
  hubble: { kind: 'orbit', parent: 'earth', radius: 1.95, periodDays: 95.42 / 1440, phaseDeg: 60, inclinationDeg: 28.5, minPeriodSeconds: 8 },
  // JWST: halo orbit around Sun–Earth L2, on the far side of Earth from the Sun, moving with Earth
  // (4 units: just beyond the Moon's orbit; the real L2 is ~4 lunar distances out, but the scene squeezes Earth-Mars)
  jwst: { kind: 'lagrange', parent: 'earth', primary: 'sun', point: 'L2', distance: 4.2 },

  // ---- Interstellar probes: NASA headings (35° north / 48° south of the ecliptic), 3.6 and 3.3 AU/year (~170 and ~142 AU in 2026;
  // the scene compresses distance beyond the planets, ~0.69 units per AU out here)
  voyager_1: { kind: 'trajectory', parent: 'sun', lonDeg: 255.9, latDeg: 34.9, distance: 117.6, unitsPerYear: 2.46,
    route: [['earth', Date.UTC(1977, 8, 5)], ['jupiter', Date.UTC(1979, 2, 5)], ['saturn', Date.UTC(1980, 10, 12)]] },
  voyager_2: { kind: 'trajectory', parent: 'sun', lonDeg: 288.6, latDeg: -48.0, distance: 99.8, unitsPerYear: 2.28,
    route: [['earth', Date.UTC(1977, 7, 20)], ['jupiter', Date.UTC(1979, 6, 9)], ['saturn', Date.UTC(1981, 7, 25)], ['uranus', Date.UTC(1986, 0, 24)], ['neptune', Date.UTC(1989, 7, 25)]] },
  // Pioneer 10 (towards Aldebaran in Taurus), Pioneer 11 (towards Aquila) and New Horizons (towards Sagittarius): headings
  // from each probe's position on the sky; ~142, ~122 and ~66 AU in late 2026 at 2.5, 2.4 and 3.0 AU/year, mapped
  // to scene units between Pluto's orbit and the Voyagers
  pioneer_10: { kind: 'trajectory', parent: 'sun', lonDeg: 79.0, latDeg: 2.8, distance: 99.8, unitsPerYear: 1.75,
    route: [['earth', Date.UTC(1972, 2, 3)], ['jupiter', Date.UTC(1973, 11, 4)]] },
  pioneer_11: { kind: 'trajectory', parent: 'sun', lonDeg: 283.5, latDeg: 14.2, distance: 92.8, unitsPerYear: 1.64,
    route: [['earth', Date.UTC(1973, 3, 6)], ['jupiter', Date.UTC(1974, 11, 3)], ['saturn', Date.UTC(1979, 8, 1)]] },
  new_horizons: { kind: 'trajectory', parent: 'sun', lonDeg: 288.0, latDeg: 1.6, distance: 73.3, unitsPerYear: 2.04,
    route: [['earth', Date.UTC(2006, 0, 19)], ['jupiter', Date.UTC(2007, 1, 28)], ['pluto', Date.UTC(2015, 6, 14)]] },
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
