import * as THREE from 'three';
import { CELESTIAL_BODIES } from '@/data/universeData';

// Global runtime registry for active celestial 3D Object3D instances.
// One id can be represented by several objects at once (e.g. the detailed Sun in the Solar System scale
// and the Sol stand-in of the Stellar Neighborhood scale), so each id keeps a stack of owners.
// The most recently registered *visible* object wins; unregistering removes only the caller's object.
const registry = new Map<string, THREE.Object3D[]>();

export function registerCelestialObject(id: string, obj: THREE.Object3D) {
  const owners = registry.get(id) ?? [];
  if (!owners.includes(obj)) owners.push(obj);
  registry.set(id, owners);
}

function isAttachedToScene(obj: THREE.Object3D): boolean {
  let o = obj;
  while (o.parent) o = o.parent;
  return (o as THREE.Scene).isScene === true;
}

export function unregisterCelestialObject(id: string, obj?: THREE.Object3D) {
  const owners = registry.get(id);
  if (!owners) return;
  if (obj) {
    const idx = owners.indexOf(obj);
    if (idx >= 0) owners.splice(idx, 1);
  } else {
    // Callers that don't pass their object run in effect cleanups, after React Three Fiber has already
    // detached the unmounted subtree. Drop only detached owners so another scale's object with the same
    // id (still in the scene) keeps its registration. Fall back to the newest owner (id-change cleanups).
    const remaining = owners.filter(isAttachedToScene);
    if (remaining.length < owners.length) owners.splice(0, owners.length, ...remaining);
    else owners.pop();
  }
  if (owners.length === 0) registry.delete(id);
}

function isRenderedInScene(obj: THREE.Object3D): boolean {
  let o: THREE.Object3D | null = obj;
  while (o) {
    if (!o.visible) return false;
    if (!o.parent) return (o as THREE.Scene).isScene === true;
    o = o.parent;
  }
  return false;
}

export function getCelestialObject(id: string): THREE.Object3D | undefined {
  const owners = registry.get(id);
  if (!owners || owners.length === 0) return undefined;
  for (let i = owners.length - 1; i >= 0; i--) {
    if (isRenderedInScene(owners[i])) return owners[i];
  }
  return owners[owners.length - 1];
}

// Debug/diagnostics access to every registered object (used by the dev-only UniverseDebugProbe)
export function getRegisteredCelestialEntries(): [string, THREE.Object3D][] {
  const out: [string, THREE.Object3D][] = [];
  registry.forEach((_, id) => {
    const obj = getCelestialObject(id);
    if (obj) out.push([id, obj]);
  });
  return out;
}

const _tempVec = new THREE.Vector3();

export function getCelestialWorldPosition(id: string, out: THREE.Vector3): boolean {
  const obj = getCelestialObject(id);
  if (!obj) return false;
  obj.updateWorldMatrix(true, false);
  obj.getWorldPosition(out);
  return true;
}

/**
 * Angles and elevations for optimal perspective viewing.
 */
export interface FramingAngle {
  elevation: number; // Y offset relative to distance
  lateralAngle: number; // Angle relative to sun-to-planet vector (radians)
}

export const CELESTIAL_ANGLES: Record<string, FramingAngle> = {
  // Solar System Bodies
  earth: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  moon: { elevation: 0.25, lateralAngle: Math.PI * 0.2 },
  mars: { elevation: 0.28, lateralAngle: Math.PI * 0.25 },
  jupiter: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  saturn: { elevation: 0.45, lateralAngle: Math.PI * 0.3 }, // Frames rings cleanly from above
  sun: { elevation: 0.3, lateralAngle: 0 },
  pluto: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },

  // Spacecraft & Satellites (Majestic 3/4 angle)
  voyager_1: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  voyager_2: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  pioneer_10: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  pioneer_11: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  new_horizons: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  jwst: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  hubble: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },

  // Stellar & High-Energy Relics
  crab_pulsar: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  cygnus_x1: { elevation: 0.4, lateralAngle: Math.PI * 0.25 },
  betelgeuse: { elevation: 0.3, lateralAngle: 0 },
  sirius: { elevation: 0.3, lateralAngle: 0 },
  sirius_a: { elevation: 0.3, lateralAngle: 0 },
  sirius_b: { elevation: 0.32, lateralAngle: Math.PI * 0.2 },
  proxima_centauri: { elevation: 0.28, lateralAngle: Math.PI * 0.15 },

  // Galactic & Extragalactic
  milky_way_galaxy: { elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  sagittarius_a: { elevation: 0.35, lateralAngle: Math.PI * 0.2 },
  crab_nebula: { elevation: 0.35, lateralAngle: Math.PI * 0.2 },
  pillars_of_creation: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  kilonova_factory: { elevation: 0.35, lateralAngle: Math.PI * 0.2 },
  andromeda_galaxy: { elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  triangulum_galaxy: { elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  large_magellanic_cloud: { elevation: 0.4, lateralAngle: Math.PI * 0.25 },
  m87_black_hole: { elevation: 0.4, lateralAngle: Math.PI * 0.3 },
  laniakea_supercluster: { elevation: 0.4, lateralAngle: 0 },
  bootes_void: { elevation: 0.4, lateralAngle: 0 },
  cmb_sphere: { elevation: 0.35, lateralAngle: 0 },

  // Exoplanetary Systems & Diamond Worlds (Scale 2)
  proxima_centauri_b: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  cancri_55_a: { elevation: 0.3, lateralAngle: 0 },
  cancri_55_e: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  trappist_1: { elevation: 0.3, lateralAngle: 0 },
  trappist_1e: { elevation: 0.3, lateralAngle: Math.PI * 0.25 },
  k2_18: { elevation: 0.3, lateralAngle: 0 },
  k2_18b: { elevation: 0.34, lateralAngle: Math.PI * 0.25 },
  hd_189733: { elevation: 0.3, lateralAngle: 0 },
  hd_189733_b: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  pegasi_51: { elevation: 0.3, lateralAngle: 0 },
  pegasi_51_b: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  toi_700: { elevation: 0.3, lateralAngle: 0 },
  toi_700_d: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },

  // Galactic Exoplanets & Extreme Stars (Scale 3)
  kepler_22: { elevation: 0.3, lateralAngle: 0 },
  kepler_22b: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  kepler_452: { elevation: 0.3, lateralAngle: 0 },
  kepler_452b: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  kepler_186: { elevation: 0.3, lateralAngle: 0 },
  kepler_186f: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  kepler_16_ab: { elevation: 0.35, lateralAngle: 0 },
  kepler_16b: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  kepler_1649c: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  kelt_9: { elevation: 0.35, lateralAngle: 0 },
  kelt_9b: { elevation: 0.38, lateralAngle: Math.PI * 0.35 },
  wasp_12: { elevation: 0.3, lateralAngle: 0 },
  wasp_12b: { elevation: 0.38, lateralAngle: Math.PI * 0.35 },
  stephenson_2_18: { elevation: 0.35, lateralAngle: 0 },
  psr_j1719_1438: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  psr_j1719_1438_b: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },

  // Extragalactic Monster Star (Scale 4)
  r136a1: { elevation: 0.35, lateralAngle: 0 },

  // Minor Bodies (Comets & Asteroids)
  halley_comet: { elevation: 0.38, lateralAngle: Math.PI * 0.4 },
  oumuamua: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  bennu_asteroid: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  psyche_asteroid: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  apophis_asteroid: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },

  // New Exoplanet Systems
  barnard_star: { elevation: 0.3, lateralAngle: 0 },
  barnard_b: { elevation: 0.32, lateralAngle: Math.PI * 0.25 },
  wolf_359: { elevation: 0.3, lateralAngle: 0 },
  gliese_445: { elevation: 0.3, lateralAngle: 0 },
  ross_248: { elevation: 0.3, lateralAngle: 0 },
  tau_ceti: { elevation: 0.3, lateralAngle: 0 },
  tau_ceti_e: { elevation: 0.34, lateralAngle: Math.PI * 0.25 },
  gliese_667c: { elevation: 0.32, lateralAngle: Math.PI * 0.2 },
  gliese_667c_e: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  lhs_1140: { elevation: 0.3, lateralAngle: 0 },
  lhs_1140_b: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  kepler_90: { elevation: 0.3, lateralAngle: 0 },
  kepler_90_h: { elevation: 0.36, lateralAngle: Math.PI * 0.3 },
  wasp_76: { elevation: 0.3, lateralAngle: 0 },
  wasp_76_b: { elevation: 0.38, lateralAngle: Math.PI * 0.35 },

  // Nebulae & Supernovae
  orion_nebula: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  ring_nebula: { elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  carina_nebula: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  sn_1987a: { elevation: 0.42, lateralAngle: Math.PI * 0.3 },
  cas_a_supernova: { elevation: 0.36, lateralAngle: Math.PI * 0.25 },

  // Extragalactic Bodies & Near Galaxies (Scale 4)
  small_magellanic_cloud: { elevation: 0.4, lateralAngle: Math.PI * 0.25 },
  centaurus_a: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  messier_82: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  andromeda_core_black_hole: { elevation: 0.38, lateralAngle: Math.PI * 0.2 },
  hubble_v1_star: { elevation: 0.3, lateralAngle: 0 },
  mayall_ii_cluster: { elevation: 0.35, lateralAngle: Math.PI * 0.2 },
  pa_99_n2_star: { elevation: 0.3, lateralAngle: 0 },
  pa_99_n2_planet: { elevation: 0.34, lateralAngle: Math.PI * 0.25 },
  ngc_604_nebula: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  m33_x7_star: { elevation: 0.32, lateralAngle: 0 },
  m33_x7_black_hole: { elevation: 0.36, lateralAngle: Math.PI * 0.25 },
  tarantula_nebula: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  s_doradus: { elevation: 0.32, lateralAngle: 0 },
  ngc_346_nebula: { elevation: 0.36, lateralAngle: Math.PI * 0.25 },
  smc_x1_star: { elevation: 0.3, lateralAngle: 0 },
  smc_x1_pulsar: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },

  // Ultramassive Quasar (Scale 5)
  ton_618: { elevation: 0.42, lateralAngle: Math.PI * 0.25 },
};

/**
 * Dynamically calculates optimal camera distance based on the object's visual radius,
 * geometric extent (rings, solar panels, nebular clouds), and camera FOV.
 * Guarantees that the camera NEVER enters inside the mesh and frames the object at ~45-55% of the viewport.
 */
export function calculateFramingDistance(bodyId: string): number {
  const body = CELESTIAL_BODIES[bodyId];
  if (!body) return 4.0;

  const visualRadius = Math.max(body.size, 0.2);

  // Geometric multiplier to account for external features:
  let margin = 2.4;
  if (bodyId === 'saturn') margin = 4.2; // Massive ring system
  else if (bodyId === 'ton_618') margin = 3.8; // Quasar multi-zone accretion disk & relativistic jets
  else if (bodyId === 'm87_black_hole') margin = 3.8; // Colossal shadow & 5,000-ly relativistic jet
  else if (bodyId === 'sagittarius_a') margin = 3.4; // Gravitational lensing halo & EHT photon ring
  else if (bodyId === 'cygnus_x1') margin = 3.6; // Binary donor star mass-transfer stream & microquasar jets
  else if (bodyId === 'crab_pulsar' || bodyId === 'psr_j1719_1438') margin = 3.4; // Dipolar magnetic loops & sweeping lighthouse beams
  else if (bodyId === 'sn_1987a') margin = 3.8; // Circumstellar pearl ring & bipolar reflection loops
  else if (bodyId === 'halley_comet' || bodyId === 'oumuamua') margin = 4.8; // Dual ion & dust tails
  else if (bodyId === 'ring_nebula') margin = 3.2; // Toroidal ring & outer spires
  else if (bodyId === 'pillars_of_creation' || bodyId === 'orion_nebula') margin = 3.4; // Expansive elephant trunks & ionization fronts
  else if (bodyId === 'wasp_12b' || bodyId === 'wasp_76_b') margin = 3.2; // Vapor envelope / tidal stream
  else if (bodyId === 'kelt_9b') margin = 3.2; // Blazing hot vapor envelope
  else if (bodyId === 'kepler_16_ab') margin = 3.4; // Binary suns pair
  else if (bodyId === 'pluto') margin = 2.8; // Pluto & Charon system
  else if (bodyId === 'centaurus_a') margin = 3.6; // Relativistic jets & warped dust belt
  else if (bodyId === 'm87_hst1') margin = 5.0; // Knot sits inside M87's jet: frame it from outside the jet
  else if (bodyId === 'andromeda_giant_stream') margin = 0.5; // ~21,700-unit stream: view it from inside Andromeda's halo
  else if (bodyId === 'messier_82') margin = 3.2; // Bipolar superwind chimneys
  else if (body.type === 'star_cluster') margin = 2.6;
  else if (body.type === 'spacecraft') margin = 3.6; // High-gain dish, RTG & sensor booms
  else if (body.type === 'galaxy') margin = 2.4; // Galactic spiral discs & outer arms
  else if (body.type === 'supercluster' || body.type === 'cosmic_structure') margin = 2.1;
  else if (body.type === 'nebula' || body.type === 'supernova_remnant' || body.type === 'supernova') margin = 2.8; // Expanding gas shockwaves
  else if (body.type === 'comet') margin = 4.2;
  else if (bodyId === 'sun') margin = 3.2; // Corona & prominence flares
  else if (body.type === 'star') margin = 2.8;

  // Camera vertical FOV is 48 degrees:
  const fovHalfAngle = (48 * 0.5 * Math.PI) / 180;
  const optimalDist = (visualRadius * margin) / Math.tan(fovHalfAngle);

  return Math.max(optimalDist, 1.8);
}

/**
 * Calculates a camera placement vector relative to a celestial body's world position.
 * The camera is placed on the illuminated side (looking at the planet with Sun illumination),
 * angled slightly from above to give a majestic, 3D perspective without looking into the Sun.
 */
export function calculateFramingCameraPosition(
  bodyId: string,
  bodyWorldPos: THREE.Vector3,
  outCamPos: THREE.Vector3
) {
  const angle = CELESTIAL_ANGLES[bodyId] || { elevation: 0.35, lateralAngle: 0.25 };
  const dist = calculateFramingDistance(bodyId);

  // Vector from origin (Sun at 0,0,0) to planet
  const sunToBody = _tempVec.copy(bodyWorldPos);
  const sunDist = sunToBody.length();

  if (sunDist < 0.1) {
    // If body is at origin (e.g. the Sun itself)
    outCamPos.set(dist * 0.8, dist * angle.elevation, dist * 0.8);
    return;
  }

  sunToBody.normalize();

  // Lateral perpendicular vector (in the XZ plane)
  const perp = new THREE.Vector3(-sunToBody.z, 0, sunToBody.x).normalize();

  // Solar System bodies are lit by the Sun: look from the sunward side, ~55° off the Sun line, so the planet shows
  // a mostly lit (three-quarter) face with a visible terminator instead of its night side, and the Sun stays out
  // of view behind the camera's shoulder
  // (JWST is the exception: its sunshield faces the Sun, so it is framed from the cold side to show the mirror)
  if (CELESTIAL_BODIES[bodyId]?.scaleLevel === 1 && bodyId !== 'jwst') {
    const phase = (55 * Math.PI) / 180;
    const litDir = new THREE.Vector3()
      .copy(sunToBody)
      .multiplyScalar(-Math.cos(phase))
      .addScaledVector(perp, Math.sin(phase))
      .normalize();
    outCamPos.copy(bodyWorldPos).addScaledVector(litDir, dist).setY(bodyWorldPos.y + dist * angle.elevation);
    return;
  }

  // Combine sun-to-body vector and perpendicular vector based on lateralAngle
  const viewDir = new THREE.Vector3()
    .copy(sunToBody)
    .multiplyScalar(Math.cos(angle.lateralAngle))
    .addScaledVector(perp, Math.sin(angle.lateralAngle))
    .normalize();

  // Position camera at bodyWorldPos + viewDir * dist + Y offset
  outCamPos.copy(bodyWorldPos)
    .addScaledVector(viewDir, dist)
    .setY(bodyWorldPos.y + dist * angle.elevation);
}

