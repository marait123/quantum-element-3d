import * as THREE from 'three';

// Real positions and orientations of the Solar System bodies for any date.
//
// Planets: E. M. Standish, "Keplerian Elements for Approximate Positions of the Major Planets" (JPL), Table 1
// (valid 1800–2050, a few arcminutes; still close to a degree a couple of centuries outside). Earth uses the
// Earth–Moon barycentre. The Moon: the main terms of its longitude and latitude (Meeus, ~0.5°).
// Spin axes and rotation: IAU Working Group on Cartographic Coordinates and Rotational Elements (pole RA/Dec and
// prime-meridian angle W = W0 + Ẇ·d).
//
// Scene axes: y = ecliptic north, ecliptic (X, Y) → scene (x, −z). Scene distances are compressed, so a planet is
// placed in its true direction at `sceneRadius × r / a`: the orbit keeps its real shape (eccentricity, perihelion
// direction and tilt) at the scene's scale.

const DEG = Math.PI / 180;
const OBLIQUITY = 23.4393 * DEG;
const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

export const daysSinceJ2000 = (utcMs: number) => (utcMs - J2000_MS) / 86400000;
export const dateFromDays = (days: number) => J2000_MS + days * 86400000;

// a (AU), e, I, L, ϖ (longitude of perihelion), Ω (node), each with its rate per Julian century
type Elements = [number, number, number, number, number, number];
const ELEMENTS: Record<string, { at: Elements; rate: Elements }> = {
  mercury: { at: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
  venus: { at: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], rate: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418] },
  earth: { at: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0] },
  mars: { at: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
  jupiter: { at: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
  saturn: { at: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], rate: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] },
  uranus: { at: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], rate: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589] },
  neptune: { at: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], rate: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664] },
  pluto: { at: [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684], rate: [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482] },
};

export const hasEphemeris = (id: string) => id in ELEMENTS || id === 'moon';
export const semiMajorAxisAu = (id: string) => ELEMENTS[id]?.at[0] ?? 1;

/** Heliocentric ecliptic (J2000) position in AU */
export function heliocentricEcliptic(id: string, days: number, out = new THREE.Vector3()) {
  const el = ELEMENTS[id];
  if (!el) return out.set(0, 0, 0);
  const T = days / 36525;
  const [a, e, I, L, peri, node] = el.at.map((v, k) => v + el.rate[k] * T);
  const w = (peri - node) * DEG;
  const O = node * DEG;
  const inc = I * DEG;
  let M = ((L - peri) % 360) * DEG;
  if (M > Math.PI) M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;
  // Kepler's equation, Newton iterations
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 8; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(inc), sI = Math.sin(inc);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = sw * sI * xp + cw * sI * yp;
  return out.set(x, y, z);
}

/** Ecliptic (X, Y, Z) → scene axes */
export const eclipticToScene = (v: THREE.Vector3, out = new THREE.Vector3()) => out.set(v.x, v.z, -v.y);

const _au = new THREE.Vector3();
/** Planet position in the scene: true direction, distance = sceneRadius × r / a */
export function planetScenePosition(id: string, days: number, sceneRadius: number, out = new THREE.Vector3()) {
  heliocentricEcliptic(id, days, _au);
  const scale = sceneRadius / semiMajorAxisAu(id);
  return eclipticToScene(_au, out).multiplyScalar(scale);
}

/** The Moon's geocentric ecliptic longitude and latitude (degrees), main periodic terms */
export function moonEcliptic(days: number) {
  const L = 218.316 + 13.176396 * days; // mean longitude
  const M = (134.963 + 13.064993 * days) * DEG; // mean anomaly
  const F = (93.272 + 13.22935 * days) * DEG; // argument of latitude
  const D = (297.85 + 12.190749 * days) * DEG; // mean elongation from the Sun
  const Ms = (357.529 + 0.98560028 * days) * DEG; // Sun's mean anomaly
  const lon = L + 6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D) + 0.214 * Math.sin(2 * M) - 0.186 * Math.sin(Ms);
  const lat = 5.128 * Math.sin(F);
  return { lonDeg: lon, latDeg: lat };
}

/** Equatorial (RA/Dec, degrees) direction → scene unit vector */
export function equatorialToScene(raDeg: number, decDeg: number, out = new THREE.Vector3()) {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const xe = Math.cos(dec) * Math.cos(ra);
  const ye = Math.cos(dec) * Math.sin(ra);
  const ze = Math.sin(dec);
  const X = xe;
  const Y = ye * Math.cos(OBLIQUITY) + ze * Math.sin(OBLIQUITY);
  const Z = -ye * Math.sin(OBLIQUITY) + ze * Math.cos(OBLIQUITY);
  return out.set(X, Z, -Y);
}

// IAU north pole (RA, Dec, J2000) and prime meridian W = W0 + Wdot·d (degrees, degrees/day)
const ROTATION: Record<string, [number, number, number, number]> = {
  mercury: [281.0103, 61.4155, 329.5988, 6.1385108],
  venus: [272.76, 67.16, 160.2, -1.4813688],
  earth: [0, 90, 190.147, 360.9856235],
  moon: [269.9949, 66.5392, 38.3213, 13.17635815],
  mars: [317.68143, 52.8865, 176.63, 350.89198226],
  ceres: [291.418, 66.764, 170.65, 952.1532],
  jupiter: [268.056595, 64.495303, 284.95, 870.536],
  saturn: [40.589, 83.537, 38.9, 810.7939024],
  uranus: [257.311, -15.175, 203.81, -501.1600928],
  neptune: [299.36, 43.46, 249.978, 541.1397757],
  pluto: [132.993, -6.163, 302.695, 56.3625225],
};

export const hasRotation = (id: string) => id in ROTATION;

const poleCache = new Map<string, THREE.Quaternion>();
/**
 * Orientation of a body's equator frame: local +y = its real north pole, local +x = the node of its equator on the
 * Earth's equator (where IAU prime-meridian angles are measured from). Spinning the surface by `rotationAngle` about
 * local y then puts the prime meridian (texture longitude 0, three.js sphere +x) where it really is.
 */
export function poleQuaternion(id: string): THREE.Quaternion {
  let q = poleCache.get(id);
  if (q) return q;
  q = new THREE.Quaternion();
  const r = ROTATION[id];
  if (r) {
    const P = equatorialToScene(r[0], r[1]);
    const N = equatorialToScene(r[0] + 90, 0);
    const Z = new THREE.Vector3().crossVectors(N, P);
    q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(N, P, Z));
  }
  poleCache.set(id, q);
  return q;
}

/** Prime-meridian angle (radians) on a date */
export function rotationAngle(id: string, days: number) {
  const r = ROTATION[id];
  if (!r) return 0;
  return ((r[2] + r[3] * days) % 360) * DEG;
}

/** Rotation rate in degrees per day (sign = direction) */
export const rotationRateDegPerDay = (id: string) => ROTATION[id]?.[3] ?? 0;

// ---------------------------------------------------------------------------------------------------------------
// Seasons: set by where the Sun appears along the ecliptic from Earth (0° March equinox, 90° June solstice…)
// ---------------------------------------------------------------------------------------------------------------
const _earth = new THREE.Vector3();
// Seasons are measured from the equinox of the date: add the precession since J2000 (1.397° per century)
export function sunEclipticLongitude(days: number) {
  heliocentricEcliptic('earth', days, _earth);
  const lon = Math.atan2(-_earth.y, -_earth.x) / DEG + (1.3969713 * days) / 36525;
  return ((lon % 360) + 360) % 360;
}

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
const NORTH: SeasonName[] = ['spring', 'summer', 'autumn', 'winter'];
const SOUTH: SeasonName[] = ['autumn', 'winter', 'spring', 'summer'];
const EVENTS = ['march_equinox', 'june_solstice', 'september_equinox', 'december_solstice'] as const;
export type SeasonEvent = (typeof EVENTS)[number];

export function earthSeason(days: number) {
  const lon = sunEclipticLongitude(days);
  const q = Math.floor(lon / 90) % 4;
  // Days to the next equinox/solstice: step forward until the Sun crosses the next multiple of 90°
  const target = ((q + 1) * 90) % 360;
  let d = days;
  let step = 1;
  for (let i = 0; i < 400; i++) {
    const l = sunEclipticLongitude(d + step);
    const crossed = target === 0 ? l < 90 && sunEclipticLongitude(d) > 270 : l >= target && sunEclipticLongitude(d) < target;
    if (crossed) break;
    d += step;
  }
  return {
    sunLongitudeDeg: lon,
    north: NORTH[q],
    south: SOUTH[q],
    nextEvent: EVENTS[(q + 1) % 4] as SeasonEvent,
    daysToNextEvent: Math.max(0, Math.round(d + 1 - days)),
  };
}

/** UTC date (ms) of a year's equinox or solstice: 0 March equinox, 1 June solstice, 2 September equinox, 3 December solstice */
export function seasonEventDate(year: number, index: 0 | 1 | 2 | 3) {
  const guess = [Date.UTC(year, 2, 20), Date.UTC(year, 5, 21), Date.UTC(year, 8, 22), Date.UTC(year, 11, 21)][index];
  let days = daysSinceJ2000(guess);
  for (let i = 0; i < 6; i++) {
    let diff = index * 90 - sunEclipticLongitude(days);
    diff = ((diff + 540) % 360) - 180;
    days += diff / 0.98564736; // the Sun's mean motion, degrees per day
  }
  return dateFromDays(days);
}
