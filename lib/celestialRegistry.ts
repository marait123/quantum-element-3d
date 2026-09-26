import * as THREE from 'three';
import { CELESTIAL_BODIES } from '@/data/universeData';

// Global runtime registry for active celestial 3D Object3D instances
const registry = new Map<string, THREE.Object3D>();

export function registerCelestialObject(id: string, obj: THREE.Object3D) {
  registry.set(id, obj);
}

export function unregisterCelestialObject(id: string) {
  registry.delete(id);
}

export function getCelestialObject(id: string): THREE.Object3D | undefined {
  return registry.get(id);
}

const _tempVec = new THREE.Vector3();

export function getCelestialWorldPosition(id: string, out: THREE.Vector3): boolean {
  const obj = registry.get(id);
  if (!obj) return false;
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

  // Spacecraft & Satellites (Majestic 3/4 angle)
  voyager_1: { elevation: 0.35, lateralAngle: Math.PI * 0.35 },
  jwst: { elevation: 0.38, lateralAngle: Math.PI * 0.25 },
  hubble: { elevation: 0.35, lateralAngle: Math.PI * 0.25 },

  // Stellar & High-Energy Relics
  crab_pulsar: { elevation: 0.35, lateralAngle: Math.PI * 0.3 },
  cygnus_x1: { elevation: 0.4, lateralAngle: Math.PI * 0.25 },
  betelgeuse: { elevation: 0.3, lateralAngle: 0 },
  sirius: { elevation: 0.3, lateralAngle: 0 },

  // Galactic & Extragalactic
  sagittarius_a: { elevation: 0.35, lateralAngle: Math.PI * 0.2 },
  andromeda_galaxy: { elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  m87_black_hole: { elevation: 0.4, lateralAngle: Math.PI * 0.3 },
  laniakea_supercluster: { elevation: 0.4, lateralAngle: 0 },
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
  else if (body.type === 'spacecraft') margin = 3.6; // High-gain dish, RTG & sensor booms
  else if (body.type === 'galaxy') margin = 2.4; // Galactic spiral discs & outer arms
  else if (body.type === 'supercluster' || body.type === 'cosmic_structure') margin = 2.1;
  else if (body.type === 'nebula' || body.type === 'supernova_remnant') margin = 2.5; // Expanding gas shockwaves
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

