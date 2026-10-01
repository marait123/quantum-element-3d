// Real placement for the "Stars & Relics" scale: each star sits in its true direction on the sky (J2000 right
// ascension / declination, converted to the ecliptic frame the scene uses: y = ecliptic north, ecliptic (X, Y) →
// scene (x, −z)) at a distance that grows with the logarithm of its real distance. A log scale is needed to fit
// Proxima (4.2 ly) and GRO J1655−40 (11,000 ly) in one view; it keeps the order of distances exact, so nearer
// stars are always nearer. Proxima lands at 200 units (just beyond the Voyagers), the farthest at ~2,250.

const DEG = Math.PI / 180;
const OBLIQUITY = 23.4393 * DEG;

// scene units = A + B · log10(light-years)
const A = -177.2;
const B = 600.6;

export const neighbourhoodDistance = (lightYears: number) => A + B * Math.log10(lightYears);

export function skyPosition(raDeg: number, decDeg: number, lightYears: number): [number, number, number] {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  // Equatorial unit vector
  const xe = Math.cos(dec) * Math.cos(ra);
  const ye = Math.cos(dec) * Math.sin(ra);
  const ze = Math.sin(dec);
  // Rotate about the x axis by the obliquity: equatorial → ecliptic
  const X = xe;
  const Y = ye * Math.cos(OBLIQUITY) + ze * Math.sin(OBLIQUITY);
  const Z = -ye * Math.sin(OBLIQUITY) + ze * Math.cos(OBLIQUITY);
  const d = neighbourhoodDistance(lightYears);
  const r = (v: number) => Math.round(v * d * 10) / 10;
  return [r(X), r(Z), r(-Y)];
}

/** A companion placed `dx` scene units from its star along +x (where its orbit starts) */
export const offsetFrom = (p: [number, number, number], dx: number, dy = 0, dz = 0): [number, number, number] => [
  p[0] + dx,
  p[1] + dy,
  p[2] + dz,
];
