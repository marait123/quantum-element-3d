import * as THREE from 'three';
import { CELESTIAL_BODIES } from '@/data/universeData';
import { BODY_FRAMES, BodyFrame, OrbitFrame, TrajectoryFrame, DEFAULT_MIN_PERIOD_SECONDS, ORBITAL_PERIOD_DAYS, LAUNCH_UTC, TRAJECTORY_REFERENCE_UTC } from '@/data/bodyFrames';
import { daysSinceJ2000, hasEphemeris, moonEcliptic, planetScenePosition, poleQuaternion } from '@/lib/ephemeris';
import { EARTH_YEAR_SECONDS, simClock, skyDaysSinceJ2000 } from '@/lib/simClock';

// Frame graph: where a body is at a given simulation time, derived from its parent and its placement (see
// data/bodyFrames.ts). Pure functions: usable by renderers, visibility rules, the camera and tests alike.
//
// Scene axes vs the ecliptic: scene y is ecliptic north; ecliptic (X, Y) maps to scene (x, -z), so orbits run
// counter-clockwise seen from the north, as they really do.

const DEG = Math.PI / 180;

export const getBodyFrame = (id: string): BodyFrame | undefined => BODY_FRAMES[id];
export const hasFrame = (id: string) => id in BODY_FRAMES;

/** Seconds (at ×1) for one orbit on screen: real period scaled so an Earth year is EARTH_YEAR_SECONDS, clamped */
export function screenPeriodSeconds(f: OrbitFrame) {
  const scaled = (f.periodDays / 365.25) * EARTH_YEAR_SECONDS;
  const min = f.minPeriodSeconds ?? DEFAULT_MIN_PERIOD_SECONDS;
  return Math.min(f.maxPeriodSeconds ?? Infinity, Math.max(min, scaled));
}

/** Angle (radians) of a star-system orbit at time t, from its real period (ORBITAL_PERIOD_DAYS). Bodies with no known
 *  period fall back to `fallbackRadPerSecond`. The start phase is fixed per body (a hash of its id). */
export function systemOrbitAngle(id: string, t: number = simClock.time, fallbackRadPerSecond = 0.5) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const phase = ((hash >>> 0) % 6283) / 1000;
  const days = ORBITAL_PERIOD_DAYS[id];
  if (days === undefined) return phase + fallbackRadPerSecond * t;
  const period = Math.max(DEFAULT_MIN_PERIOD_SECONDS, (days / 365.25) * EARTH_YEAR_SECONDS);
  return phase + (2 * Math.PI * t) / period;
}

/** True when the on-screen period had to be slowed down or sped up from the real ratio */
export function isMotionScaled(id: string) {
  const days = ORBITAL_PERIOD_DAYS[id];
  if (days !== undefined) return (days / 365.25) * EARTH_YEAR_SECONDS < DEFAULT_MIN_PERIOD_SECONDS;
  const f = BODY_FRAMES[id];
  if (!f || f.kind !== 'orbit') return false;
  const scaled = (f.periodDays / 365.25) * EARTH_YEAR_SECONDS;
  return Math.abs(screenPeriodSeconds(f) - scaled) > 1e-6;
}

/** Angle along the orbit (radians, ecliptic longitude for Sun-centred orbits) at simulation time t */
export function orbitAngleAt(f: OrbitFrame, t: number = simClock.time) {
  const period = screenPeriodSeconds(f);
  let start: number;
  if (f.meanLongitudeJ2000 !== undefined) {
    // Where the body really is today: J2000 mean longitude advanced by the real days elapsed at the epoch
    const days = skyDaysSinceJ2000(0);
    start = (f.meanLongitudeJ2000 + (360 * days) / f.periodDays) * DEG;
  } else {
    start = (f.phaseDeg ?? 0) * DEG;
  }
  const sign = f.retrograde ? -1 : 1;
  return start + (sign * 2 * Math.PI * t) / period;
}

const _tilt = new THREE.Quaternion();
const _axis = new THREE.Vector3();

/** Unit vector toward an ecliptic longitude/latitude (degrees) in scene axes */
export function eclipticDirection(lonDeg: number, latDeg: number, out = new THREE.Vector3()) {
  const l = lonDeg * DEG;
  const b = latDeg * DEG;
  return out.set(Math.cos(b) * Math.cos(l), Math.sin(b), -Math.cos(b) * Math.sin(l));
}

/** Where a Sun-orbiting body was on a given calendar date (real elements for the planets) */
export function heliocentricPositionOnDate(id: string, dateUtcMs: number, out = new THREE.Vector3()) {
  const f = BODY_FRAMES[id];
  if (!f || f.kind !== 'orbit') return out.set(0, 0, 0);
  const days = daysSinceJ2000(dateUtcMs);
  if (hasEphemeris(id) && f.parent === 'sun') return planetScenePosition(id, days, f.radius, out);
  if (f.meanLongitudeJ2000 === undefined) return out.set(0, 0, 0);
  const angle = (f.meanLongitudeJ2000 + (360 * days) / f.periodDays) * DEG;
  return orbitPointAtAngle(f, angle, out);
}

/** Days since J2000 shown by the sky at simulation time t */
export const skyDaysAt = (t: number = simClock.time) => skyDaysSinceJ2000(t);

/** Spacecraft are only shown once launched */
export function isLaunched(id: string, t: number = simClock.time) {
  const launch = LAUNCH_UTC[id];
  return launch === undefined || daysSinceJ2000(launch) <= skyDaysSinceJ2000(t);
}

/** Offset from the parent (scene units) for an orbit at time t */
export function orbitOffsetAt(f: OrbitFrame, t: number, out: THREE.Vector3, id?: string) {
  if (id && hasEphemeris(id)) {
    const days = skyDaysSinceJ2000(t);
    if (id === 'moon') {
      const m = moonEcliptic(days);
      return eclipticDirection(m.lonDeg, m.latDeg, out).multiplyScalar(f.radius);
    }
    if (f.parent === 'sun') return planetScenePosition(id, days, f.radius, out);
  }
  return orbitPointAtAngle(f, orbitAngleAt(f, t), out);
}

/** A point on the orbit at a given angle (for drawing the orbit path) */
export function orbitPointAtAngle(f: OrbitFrame, angle: number, out: THREE.Vector3) {
  out.set(Math.cos(angle) * f.radius, 0, -Math.sin(angle) * f.radius);
  if (f.plane === 'equator') return out.applyQuaternion(poleQuaternion(f.parent));
  if (f.inclinationDeg) {
    const node = (f.nodeDeg ?? 0) * DEG;
    _axis.set(Math.cos(node), 0, -Math.sin(node));
    _tilt.setFromAxisAngle(_axis, f.inclinationDeg * DEG);
    out.applyQuaternion(_tilt);
  }
  return out;
}

/** Points along a body's orbit for its guide line: the real (eccentric, tilted) orbit for bodies with elements */
export function orbitPathPoints(id: string, segments = 180): THREE.Vector3[] {
  const f = BODY_FRAMES[id];
  if (!f || f.kind !== 'orbit') return [];
  const pts: THREE.Vector3[] = [];
  const d0 = skyDaysSinceJ2000(0);
  for (let i = 0; i <= segments; i++) {
    if (hasEphemeris(id) && f.parent === 'sun') pts.push(planetScenePosition(id, d0 + (i / segments) * f.periodDays, f.radius, new THREE.Vector3()));
    else pts.push(orbitPointAtAngle(f, (i / segments) * Math.PI * 2, new THREE.Vector3()));
  }
  return pts;
}

// Probe routes: launch at Earth, through the flybys, to the escape heading, then straight out
const routeCurves = new Map<string, { curve: THREE.CatmullRomCurve3; days: number[] }>();
function routeCurve(id: string, f: TrajectoryFrame) {
  let c = routeCurves.get(id);
  if (c) return c;
  const pts = f.route.map(([body, date]) => heliocentricPositionOnDate(body, date));
  const days = f.route.map(([, date]) => daysSinceJ2000(date));
  pts.push(eclipticDirection(f.lonDeg, f.latDeg).multiplyScalar(f.distance));
  days.push(daysSinceJ2000(TRAJECTORY_REFERENCE_UTC));
  c = { curve: new THREE.CatmullRomCurve3(pts, false, 'centripetal'), days };
  routeCurves.set(id, c);
  return c;
}

function trajectoryPositionOnDays(id: string, f: TrajectoryFrame, d: number, out: THREE.Vector3) {
  const { curve, days } = routeCurve(id, f);
  const last = days[days.length - 1];
  if (d >= last) {
    const dist = f.distance + (f.unitsPerYear * (d - last)) / 365.25;
    return eclipticDirection(f.lonDeg, f.latDeg, out).multiplyScalar(dist);
  }
  if (d <= days[0]) return out.copy(curve.points[0]);
  let k = 0;
  while (k < days.length - 2 && d > days[k + 1]) k++;
  const frac = (d - days[k]) / (days[k + 1] - days[k]);
  return curve.getPoint((k + frac) / (days.length - 1), out);
}

/** The flown part of a probe's route up to time t (for its trail) */
export function trajectoryHistory(id: string, t: number = simClock.time, samples = 120): THREE.Vector3[] {
  const f = BODY_FRAMES[id];
  if (!f || f.kind !== 'trajectory') return [];
  const start = daysSinceJ2000(f.route[0][1]);
  const end = skyDaysSinceJ2000(t);
  if (end <= start) return [];
  return Array.from({ length: samples + 1 }, (_, i) => trajectoryPositionOnDays(id, f, start + ((end - start) * i) / samples, new THREE.Vector3()));
}

const _parent = new THREE.Vector3();
const _primary = new THREE.Vector3();

/**
 * World position of a body at simulation time t. Bodies without a frame sit at their catalogued position.
 */
export function worldPositionAt(id: string, t: number = simClock.time, out = new THREE.Vector3(), depth = 0): THREE.Vector3 {
  const f = BODY_FRAMES[id];
  const body = CELESTIAL_BODIES[id];
  if (!f || depth > 8) {
    return body ? out.set(...body.position) : out.set(0, 0, 0);
  }
  if (f.kind === 'orbit') {
    const parent = worldPositionAt(f.parent, t, new THREE.Vector3(), depth + 1);
    orbitOffsetAt(f, t, out, id);
    return out.add(parent);
  }
  if (f.kind === 'trajectory') return trajectoryPositionOnDays(id, f, skyDaysSinceJ2000(t), out);
  // Lagrange L2: beyond the secondary, on the line from the primary
  const secondary = worldPositionAt(f.parent, t, _parent.clone(), depth + 1);
  const primary = worldPositionAt(f.primary, t, _primary.clone(), depth + 1);
  const dir = secondary.clone().sub(primary);
  if (dir.lengthSq() < 1e-9) dir.set(1, 0, 0);
  return out.copy(secondary).addScaledVector(dir.normalize(), f.distance);
}

/** Position relative to the parent (for renderers nested inside the parent's group) */
export function localPositionAt(id: string, t: number = simClock.time, out = new THREE.Vector3()) {
  const f = BODY_FRAMES[id];
  if (!f) return out.set(0, 0, 0);
  if (f.kind === 'orbit') return orbitOffsetAt(f, t, out, id);
  const world = worldPositionAt(id, t, new THREE.Vector3());
  const parent = worldPositionAt(f.parent, t, new THREE.Vector3());
  return out.copy(world).sub(parent);
}

// ---------------------------------------------------------------------------------------------------------------
// Validation (dev): parents exist, no cycles, children clear their parent's rendered size, periods grow outward
// ---------------------------------------------------------------------------------------------------------------
export function validateFrames(): string[] {
  const problems: string[] = [];
  for (const [id, f] of Object.entries(BODY_FRAMES)) {
    if (!CELESTIAL_BODIES[id]) problems.push(`${id}: frame for an unknown body`);
    if (f.parent !== 'sun' && !CELESTIAL_BODIES[f.parent]) problems.push(`${id}: parent ${f.parent} does not exist`);
    // cycle check
    const seen = new Set<string>([id]);
    for (let p: string | undefined = f.parent; p; p = BODY_FRAMES[p]?.parent) {
      if (seen.has(p)) {
        problems.push(`${id}: frame cycle through ${p}`);
        break;
      }
      seen.add(p);
    }
    if (f.kind === 'orbit') {
      const parent = f.parent === 'sun' ? CELESTIAL_BODIES.sun : CELESTIAL_BODIES[f.parent];
      const child = CELESTIAL_BODIES[id];
      if (parent && child) {
        // Clearance: the child's nearest point stays outside the parent's glow (~1.2× its radius)
        const clearance = f.radius - child.size - parent.size * 1.2;
        if (clearance < 0) problems.push(`${id}: orbit radius ${f.radius} is inside ${f.parent} (size ${parent.size})`);
      }
    }
  }
  // Periods grow with distance within each parent (Kepler's third law)
  const byParent = new Map<string, [string, OrbitFrame][]>();
  // (asteroids and spacecraft sit at compressed, illustrative distances, so only planets and moons are compared)
  for (const [id, f] of Object.entries(BODY_FRAMES)) {
    if (f.kind !== 'orbit') continue;
    if (!['planet', 'dwarf_planet', 'moon'].includes(CELESTIAL_BODIES[id]?.type ?? '')) continue;
    byParent.set(f.parent, [...(byParent.get(f.parent) ?? []), [id, f]]);
  }
  byParent.forEach((list) => {
    const sorted = [...list].sort((a, b) => a[1].radius - b[1].radius);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i][1].periodDays < sorted[i - 1][1].periodDays) {
        problems.push(`${sorted[i][0]}: farther out than ${sorted[i - 1][0]} but with a shorter period`);
      }
    }
  });
  return problems;
}
