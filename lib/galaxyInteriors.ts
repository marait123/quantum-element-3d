import * as THREE from 'three';
import { CELESTIAL_BODIES } from '@/data/universeData';
import { getCelestialObject } from '@/lib/celestialRegistry';

// Disk inclination per galaxy (Euler XYZ, applied under the galaxy's spin). Shared by the renderer, the scene
// (objects placed in a disk) and the camera (entry viewpoints), so all three agree on where the disk is.
export function getGalaxyDiskRotation(id: string): [number, number, number] {
  if (id === 'andromeda_galaxy') return [Math.PI * 0.38, 0, Math.PI * 0.15];
  if (id === 'triangulum_galaxy') return [-Math.PI * 0.28, 0, Math.PI * 0.3];
  if (id === 'large_magellanic_cloud') return [Math.PI * 0.2, 0, -Math.PI * 0.25];
  if (id === 'small_magellanic_cloud') return [-Math.PI * 0.25, 0, Math.PI * 0.15];
  if (id === 'centaurus_a') return [Math.PI * 0.18, 0, -Math.PI * 0.35];
  if (id === 'messier_82') return [Math.PI * 0.48, 0, Math.PI * 0.12]; // Almost edge-on
  return [Math.PI * 0.3, 0, 0];
}

// How the star field inside each enterable galaxy is laid out (see GalaxyInterior)
export type InteriorStyle =
  | 'grand_spiral' // Andromeda: two arms, bright bulge, its star-forming "ring of fire"
  | 'flocculent_spiral' // Triangulum: patchy, fragmented arms rich in H II regions
  | 'barred_magellanic' // LMC: off-centre bar with a single spiral arm
  | 'irregular_dwarf' // SMC: elongated body with the star-forming Wing
  | 'starburst_disk' // M82: thin edge-on disk, starburst core and galactic superwind
  | 'elliptical_with_lane'; // Centaurus A: giant elliptical crossed by a young, star-forming disk

export const GALAXY_INTERIORS: Record<string, InteriorStyle> = {
  andromeda_galaxy: 'grand_spiral',
  triangulum_galaxy: 'flocculent_spiral',
  large_magellanic_cloud: 'barred_magellanic',
  small_magellanic_cloud: 'irregular_dwarf',
  messier_82: 'starburst_disk',
  centaurus_a: 'elliptical_with_lane',
};

export const isEnterableGalaxy = (id: string | null | undefined) =>
  !!id && (id === 'milky_way_galaxy' || id in GALAXY_INTERIORS);

// Interior detail fades in inside INTERIOR_FULL × radius and is gone beyond INTERIOR_START × radius; the far-away
// billboard look of the galaxy does the opposite, so entering a galaxy is a smooth hand-off.
export const INTERIOR_FULL = 1.8;
export const INTERIOR_START = 3.0;
// "Inside" (for the HUD location chip) = within this many radii of the centre
export const INSIDE_RADII = 2.0;

export const interiorFade = (distanceToCentre: number, radius: number) =>
  1 - THREE.MathUtils.smoothstep(distanceToCentre, radius * INTERIOR_FULL, radius * INTERIOR_START);

// ---------------------------------------------------------------------------------------------------------------
// Navigating inside a galaxy, the same three levels as our own: galaxy → its stars → one star system
// (Milky Way → Stars & Relics → Solar System). Only real, catalogued systems: outside the Milky Way the only known
// planet (candidate) is PA-99-N2 b in Andromeda, so the other galaxies' "system" level is a real star system.
// ---------------------------------------------------------------------------------------------------------------
export type GalaxyViewLevel = 1 | 2 | 3;

export const FEATURED_SYSTEMS: Record<string, { bodyId: string; en: string; ar: string }> = {
  andromeda_galaxy: { bodyId: 'pa_99_n2_star', en: 'PA-99-N2 System', ar: 'نظام PA-99-N2' },
  triangulum_galaxy: { bodyId: 'm33_x7_star', en: 'M33 X-7 Binary', ar: 'الثنائي M33 X-7' },
  large_magellanic_cloud: { bodyId: 'r136_cluster', en: 'R136 Cluster', ar: 'عنقود R136' },
  small_magellanic_cloud: { bodyId: 'hd_5980', en: 'HD 5980 System', ar: 'نظام HD 5980' },
  centaurus_a: { bodyId: 'cen_a_black_hole', en: 'Centaurus A*', ar: 'قنطورس أ*' },
  messier_82: { bodyId: 'm82_a1', en: 'M82-A1 Cluster', ar: 'عنقود M82-A1' },
};

// Galaxy each body belongs to (following parentBodyId). Milky Way members: the Stellar Neighborhood and Milky
// Way scales (the Solar System is reached through its own level).
const memberCache = new Map<string, string[]>();
export function getGalaxyMembers(galaxyId: string): string[] {
  const cached = memberCache.get(galaxyId);
  if (cached) return cached;
  let members: string[];
  if (galaxyId === 'milky_way_galaxy') {
    members = Object.values(CELESTIAL_BODIES)
      .filter((b) => (b.scaleLevel === 2 || b.scaleLevel === 3) && b.type !== 'moon')
      .map((b) => b.id);
  } else {
    members = Object.keys(CELESTIAL_BODIES).filter((id) => {
      let b = CELESTIAL_BODIES[id];
      for (let hops = 0; b?.parentBodyId && hops < 6; hops++) {
        if (b.parentBodyId === galaxyId) return true;
        b = CELESTIAL_BODIES[b.parentBodyId];
      }
      return false;
    });
  }
  memberCache.set(galaxyId, members);
  return members;
}

export function isInFeaturedSystem(galaxyId: string, bodyId: string | null): boolean {
  const featured = FEATURED_SYSTEMS[galaxyId]?.bodyId;
  if (!featured || !bodyId) return false;
  let b = CELESTIAL_BODIES[bodyId];
  for (let hops = 0; b && hops < 6; hops++) {
    if (b.id === featured) return true;
    b = b.parentBodyId ? CELESTIAL_BODIES[b.parentBodyId] : (undefined as never);
  }
  return false;
}

// "Stars" level: the galaxy's richest neighbourhood — the catalogued object with the most other catalogued objects
// within a quarter of the galaxy radius (the Tarantula region in the LMC, NGC 346 in the SMC, …)
const STAR_LIKE = new Set(['star', 'star_cluster', 'pulsar', 'black_hole', 'nebula', 'supernova', 'supernova_remnant', 'planet']);
const neighbourhoodCache = new Map<string, { centre: THREE.Vector3; radius: number }>();
export function getStarNeighbourhood(galaxyId: string): { centre: THREE.Vector3; radius: number } {
  const cached = neighbourhoodCache.get(galaxyId);
  if (cached) return cached;
  const galaxy = CELESTIAL_BODIES[galaxyId];
  const pts = getGalaxyMembers(galaxyId)
    .map((id) => CELESTIAL_BODIES[id])
    .filter((b) => STAR_LIKE.has(b.type))
    .map((b) => new THREE.Vector3(...b.position));
  const r = galaxy.size * 0.25;
  let best = pts[0] ?? new THREE.Vector3(...galaxy.position);
  let bestCount = -1;
  for (const p of pts) {
    const n = pts.filter((q) => q.distanceTo(p) < r).length;
    if (n > bestCount) {
      best = p;
      bestCount = n;
    }
  }
  const near = pts.filter((q) => q.distanceTo(best) < r);
  const centre = near.reduce((acc, q) => acc.add(q), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, near.length));
  const radius = Math.max(galaxy.size * 0.08, ...near.map((q) => q.distanceTo(centre)));
  const result = { centre, radius };
  neighbourhoodCache.set(galaxyId, result);
  return result;
}

/**
 * Direction from a galaxy's disk towards the camera for a *level* view. The camera keeps world-up, so a disk
 * looked at from an arbitrary side appears rolled or upside down. Viewing from within the plane that contains
 * the disk normal and world-up puts the disk's tilt axis horizontal on screen, like the Milky Way scale's view,
 * ~26° above the disk.
 */
const VIEW_ELEVATION = (26 * Math.PI) / 180;
export function levelViewDirection(galaxyId: string): THREE.Vector3 {
  const up = new THREE.Vector3(0, 1, 0);
  const normal = up.clone().applyEuler(new THREE.Euler(...getGalaxyDiskRotation(galaxyId))).normalize();
  if (normal.y < 0) normal.negate();
  const inPlane = up.clone().addScaledVector(normal, -up.dot(normal));
  if (inPlane.lengthSq() < 1e-6) inPlane.set(0, 0, 1);
  inPlane.normalize();
  // Offsetting towards −inPlane (not +inPlane) keeps the disk's own "up" pointing up on screen: from the other
  // side the same level view comes out upside down (far edge at the bottom), which reads as a flipped galaxy
  return normal.multiplyScalar(Math.sin(VIEW_ELEVATION)).addScaledVector(inPlane, -Math.cos(VIEW_ELEVATION)).normalize();
}

/**
 * Where a point given in world coordinates at spin 0 (how catalogued members are stored) is now, after the galaxy
 * has turned within its disk plane. Mirrors RealisticGalaxy / GalaxyDiskFrame: position → inclination → spin.
 */
const _diskEuler = new THREE.Euler();
const _diskQ = new THREE.Quaternion();
const _spinQ = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
export function spunPosition(galaxyId: string, pointAtSpin0: THREE.Vector3, out = new THREE.Vector3()) {
  const galaxy = CELESTIAL_BODIES[galaxyId];
  const root = getCelestialObject(galaxyId);
  const spin = (root?.userData.spin as number | undefined) ?? 0;
  const g = new THREE.Vector3(...galaxy.position);
  if (root) root.getWorldPosition(g);
  _diskQ.setFromEuler(_diskEuler.set(...getGalaxyDiskRotation(galaxyId)));
  _spinQ.setFromAxisAngle(_yAxis, spin);
  // local (disk frame) = inverse(disk) · (P − G0); now = G + disk · spin · local
  out.copy(pointAtSpin0).sub(new THREE.Vector3(...galaxy.position)).applyQuaternion(_diskQ.clone().invert());
  return out.applyQuaternion(_spinQ).applyQuaternion(_diskQ).add(g);
}

// Viewpoint for the "Stars" level: a level view of the star neighbourhood (following the galaxy's spin)
export function starNeighbourhoodPose(galaxyId: string, outPosition: THREE.Vector3, outTarget: THREE.Vector3) {
  const { centre: centreAtSpin0, radius } = getStarNeighbourhood(galaxyId);
  const centre = spunPosition(galaxyId, centreAtSpin0);
  outTarget.copy(centre);
  outPosition.copy(centre).addScaledVector(levelViewDirection(galaxyId), radius * 3.4);
}

// Entry viewpoint: a level view of the whole disk from ~1.34 radii, the same vantage point the Milky Way scale uses
const ENTRY_DISTANCE_RADII = 1.34;

/**
 * World-space entry viewpoint for a galaxy, following its live spin (`galaxyObject` is its registered root).
 */
export function galaxyEntryPose(
  id: string,
  galaxyObject: THREE.Object3D | undefined,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3
) {
  const body = CELESTIAL_BODIES[id];
  if (galaxyObject) galaxyObject.getWorldPosition(outTarget);
  else outTarget.set(...body.position);
  outPosition.copy(outTarget).addScaledVector(levelViewDirection(id), body.size * ENTRY_DISTANCE_RADII);
}
