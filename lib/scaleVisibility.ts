import * as THREE from 'three';
import { CELESTIAL_BODIES, CosmicScaleLevel } from '@/data/universeData';
import { calculateFramingDistance, getCelestialWorldPosition } from '@/lib/celestialRegistry';
import { GALAXY_INTERIORS, INSIDE_RADII } from '@/lib/galaxyInteriors';
import { hasFrame, worldPositionAt } from '@/lib/frames';
import { simClock } from '@/lib/simClock';

/**
 * Decides, every frame, which of the five cosmic scale layers are visible and which scale the HUD reports.
 *
 * All five scales share one coordinate space but are authored as separate "worlds" (distances are compressed,
 * so e.g. Andromeda would be a huge object in the Solar System sky). A layer is therefore shown only when it is
 * relevant to where the camera is. The rules are direction-agnostic on purpose: turning the camera never changes
 * what is shown, only moving does.
 *
 *  1. Home band     – camera distance from the origin picks a home scale; the overlap zones between bands also
 *                     show the neighbouring scale so continuous zoom cross-fades instead of popping.
 *  2. Proximity     – any body the camera is close to (within its sphere of influence, see BodyLod.influence)
 *                     keeps its scale visible and wins the HUD. Needed for bodies placed outside their own band
 *                     (M87* and Centaurus A sit in the scale-5 band, the Magellanic Clouds at the 3/4 border…).
 *  3. Regions       – Solar System (1), Stellar Neighborhood (2) and Milky Way (3) form the home-galaxy region;
 *                     Extragalactic (4) and Cosmic Web (5) the deep-space region. All scales of the current region
 *                     stay visible (larger ones as backdrop, smaller ones shrinking with distance), so switching
 *                     between neighbours never makes planets, orbits, nebulae, stars or the cosmic web vanish. Between the two regions nothing is toggled while
 *                     visible: the galaxies and the cosmic web fade with distance (GALAXIES_FADE_*,
 *                     COSMIC_WEB_FADE_*, rendering/useDistanceFade) and are fully transparent when their layer turns off.
 *  4. Inner linger  – smaller scales stay visible while their bodies still cover a few pixels, so they shrink
 *                     away to dots instead of vanishing (e.g. the galaxies of scale 4 seen from scale 5).
 *  5. Selection     – the selected body's scale is always visible (the camera flies to / tracks it).
 */

export const SCALE_LEVELS: CosmicScaleLevel[] = [1, 2, 3, 4, 5];
export const scaleBit = (level: number) => 1 << level;
export const maskHas = (mask: number, level: number) => (mask & scaleBit(level)) !== 0;

const PROXIMITY_FACTOR = 1.25;
const INFLUENCE_ORIGIN_FRACTION = 0.6;
const TRACKING_BREAKAWAY_FACTOR = 40; // mirrors UniverseCameraManager's follow breakaway distance
// Low on purpose: a layer should only ever appear/disappear while its biggest body is barely a dot
const LINGER_ON_PX = 3; // an inner scale re-appears when one of its bodies is at least this big (radius, px)
const LINGER_OFF_PX = 2; // …and disappears once all of them are smaller than this (hysteresis)
// Deep space around the Milky Way is faded, not toggled (distances from the origin):
// the neighbouring galaxies (scale 4) fade in between these two distances…
export const GALAXIES_FADE_START = 20000;
export const GALAXIES_FADE_FULL = 45000;
// The detailed Milky Way (scale 3) cross-fades into its scale-4 stand-in disk between these…
export const MILKY_WAY_CROSSFADE_START = 45000;
export const MILKY_WAY_CROSSFADE_END = 90000;
// …and the cosmic web (scale 5) fades in between these, so it is invisible when the deep-space region ends at 48,000
export const COSMIC_WEB_FADE_START = 48000;
export const COSMIC_WEB_FADE_FULL = 110000;

// Scales sharing one region of space; the larger ones stay visible as the backdrop of the smaller ones
const SCALE_REGIONS: CosmicScaleLevel[][] = [
  [1, 2, 3], // home galaxy
  [4, 5], // deep space
];

interface BodyLod {
  id: string;
  level: CosmicScaleLevel;
  pos: THREE.Vector3;
  size: number;
  framing: number;
  // Radius of the body's "sphere of influence". Framing distance based, but capped to a fraction of the body's
  // distance from the origin: huge far bodies (Boötes Void, TON 618) have enormous framing distances and would
  // otherwise claim the whole universe.
  influence: number;
  // Bodies that enclose the origin (Milky Way, Laniakea, CMB, the Sun) describe "where you are", not a place
  // you fly to, so they never drive proximity or linger decisions.
  container: boolean;
  topLevel: boolean;
  // Compact bodies (stars, planets, clusters…) set the local flight speed; galaxies and large structures don't
  compact: boolean;
  moving: boolean;
}

let bodyTable: BodyLod[] | null = null;

const NON_COMPACT_TYPES = new Set(['galaxy', 'supercluster', 'cosmic_structure']);
const _navPos = new THREE.Vector3();

function getBodyTable(): BodyLod[] {
  if (bodyTable) return bodyTable;
  bodyTable = Object.values(CELESTIAL_BODIES).map((b) => {
    const pos = new THREE.Vector3(...b.position);
    const framing = calculateFramingDistance(b.id);
    return {
      id: b.id,
      level: b.scaleLevel,
      pos,
      size: b.size,
      framing,
      influence: Math.min(framing * PROXIMITY_FACTOR, pos.length() * INFLUENCE_ORIGIN_FRACTION),
      container: pos.length() < b.size,
      topLevel: !b.parentBodyId,
      compact: !NON_COMPACT_TYPES.has(b.type),
      moving: hasFrame(b.id),
    };
  });
  return bodyTable;
}

// Where a body is now: moving bodies (orbits, trajectories) come from the frame graph, the rest are fixed
const _lodPos = new THREE.Vector3();
function lodPosition(b: BodyLod) {
  return b.moving ? worldPositionAt(b.id, simClock.time, _lodPos) : b.pos;
}

// Home band from distance to the origin. Transition zones return the neighbouring scale as `adjacent`.
export function detectHomeBand(dist: number): { level: CosmicScaleLevel; adjacent: CosmicScaleLevel | null } {
  if (dist < 85) return { level: 1, adjacent: null };
  if (dist < 125) return dist < 105 ? { level: 1, adjacent: 2 } : { level: 2, adjacent: 1 };
  if (dist < 1900) return { level: 2, adjacent: null };
  if (dist < 2500) return dist < 2200 ? { level: 2, adjacent: 3 } : { level: 3, adjacent: 2 };
  if (dist < 42000) return { level: 3, adjacent: null };
  if (dist < 54000) return dist < 48000 ? { level: 3, adjacent: 4 } : { level: 4, adjacent: 3 };
  if (dist < 155000) return { level: 4, adjacent: null };
  if (dist < 195000) return dist < 175000 ? { level: 4, adjacent: 5 } : { level: 5, adjacent: 4 };
  return { level: 5, adjacent: null };
}

export interface ScaleVisibilityState {
  hudLevel: CosmicScaleLevel;
  adjacent: CosmicScaleLevel | null;
  mask: number;
  nearestBodyId: string | null;
  lingering: number; // bitmask of inner scales kept visible by the linger rule (for hysteresis)
}

export interface ScaleVisibilityInput {
  cameraPosition: THREE.Vector3;
  selectedBodyId: string | null;
  viewportHeight: number;
  fovDeg: number;
}

export function computeScaleVisibility(
  input: ScaleVisibilityInput,
  prev: ScaleVisibilityState | null
): ScaleVisibilityState {
  const cam = input.cameraPosition;
  const band = detectHomeBand(cam.length());
  const pxPerUnitAtDist = input.viewportHeight / 2 / Math.tan((input.fovDeg * Math.PI) / 360);

  let mask = scaleBit(band.level);
  if (band.adjacent) mask |= scaleBit(band.adjacent);
  // Every scale of the current region stays visible: larger ones as the backdrop, smaller ones shrinking away
  // naturally (the Solar System's orbit rings stay visible far beyond the point where its planets are dots)
  const region = SCALE_REGIONS.find((r) => r.includes(band.level));
  if (region) for (const level of region) mask |= scaleBit(level);
  // Neighbouring galaxies are shown (faded in, see GALAXIES_FADE_*) while leaving the Milky Way
  if (band.level === 3 && cam.length() > GALAXIES_FADE_START) mask |= scaleBit(4);

  // Proximity + linger in a single pass over the ~110 bodies
  let nearest: BodyLod | null = null;
  const maxPx = [0, 0, 0, 0, 0, 0];
  for (const b of getBodyTable()) {
    if (b.container) continue;
    const d = cam.distanceTo(lodPosition(b));
    if (d < b.influence) {
      mask |= scaleBit(b.level);
      // Most specific body wins the HUD (Earth over the Moon's orbit, M87* over TON 618's huge domain)
      if (!nearest || b.framing < nearest.framing) nearest = b;
    }
    if (b.topLevel && b.level < band.level) {
      const px = d > 0 ? (b.size / d) * pxPerUnitAtDist : Infinity;
      if (px > maxPx[b.level]) maxPx[b.level] = px;
    }
  }

  let lingering = 0;
  for (let level = 1; level < band.level; level++) {
    const wasLingering = prev ? maskHas(prev.lingering, level) : false;
    if (maxPx[level] >= (wasLingering ? LINGER_OFF_PX : LINGER_ON_PX)) lingering |= scaleBit(level);
  }
  mask |= lingering;
  // Past the cross-fade the detailed Milky Way is fully transparent (its stand-in has taken over)
  if (cam.length() > MILKY_WAY_CROSSFADE_END) mask &= ~scaleBit(3);

  // Selection: always visible; owns the HUD while the camera is still in its tracking range
  let hudLevel: CosmicScaleLevel = nearest ? nearest.level : band.level;
  const selected = input.selectedBodyId ? CELESTIAL_BODIES[input.selectedBodyId] : undefined;
  if (selected) {
    mask |= scaleBit(selected.scaleLevel);
    const lod = getBodyTable().find((b) => b.id === selected.id);
    if (lod && cam.distanceTo(lodPosition(lod)) < lod.framing * TRACKING_BREAKAWAY_FACTOR) hudLevel = selected.scaleLevel;
  }

  return {
    hudLevel,
    adjacent: nearest && nearest.level !== band.level ? null : band.adjacent,
    mask,
    nearestBodyId: nearest ? nearest.id : null,
    lingering,
  };
}

/**
 * Length scale for free-flight speed and scroll steps.
 *
 * In the Milky Way region (and in the space between galaxies) it is the camera's distance from the origin, as it
 * always was: every scroll moves a fixed fraction of the remaining distance, so zooming converges smoothly onto the
 * Solar System — that is what gives our galaxy its "depth". Inside another galaxy that origin is tens of thousands
 * of units away (one scroll tick crossed a whole galaxy), so there the scale is the distance to the nearest star /
 * cluster / nebula surface instead: zooming converges onto whatever you approach, exactly like home.
 */
export function navigationScale(cameraPosition: THREE.Vector3): number {
  const fromOrigin = Math.max(cameraPosition.length(), 5);
  if (!insideEnterableGalaxy(cameraPosition)) return fromOrigin;
  let nearest = Infinity;
  for (const b of getBodyTable()) {
    if (!b.compact || b.container) continue;
    const pos = getCelestialWorldPosition(b.id, _navPos) ? _navPos : lodPosition(b);
    const d = cameraPosition.distanceTo(pos) - b.size;
    if (d < nearest) nearest = d;
  }
  return Math.max(5, Math.min(fromOrigin, nearest));
}

function insideEnterableGalaxy(cameraPosition: THREE.Vector3): boolean {
  for (const id in GALAXY_INTERIORS) {
    const g = CELESTIAL_BODIES[id];
    if (cameraPosition.distanceTo(_navPos.set(...g.position)) < g.size * INSIDE_RADII) return true;
  }
  return false;
}
