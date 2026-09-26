import * as THREE from 'three';

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
 * Calibrated close-up camera distances and viewing offsets.
 * Designed so that looking at planets focuses on the planet's illuminated surface
 * and does NOT stare into the blinding Sun at (0,0,0).
 */
export interface CloseUpFraming {
  distance: number;
  elevation: number; // Y offset relative to distance
  lateralAngle: number; // Angle relative to sun-to-planet vector (radians)
}

export const CELESTIAL_FRAMING: Record<string, CloseUpFraming> = {
  // Solar System Bodies
  earth: { distance: 2.1, elevation: 0.35, lateralAngle: Math.PI * 0.25 },
  moon: { distance: 1.2, elevation: 0.25, lateralAngle: Math.PI * 0.2 },
  mars: { distance: 1.8, elevation: 0.3, lateralAngle: Math.PI * 0.25 },
  jupiter: { distance: 5.5, elevation: 0.4, lateralAngle: Math.PI * 0.25 },
  saturn: { distance: 6.2, elevation: 0.55, lateralAngle: Math.PI * 0.3 }, // Frames rings cleanly
  sun: { distance: 16.0, elevation: 0.3, lateralAngle: 0 },

  // Spacecraft & Satellites (Close inspection distances)
  voyager_1: { distance: 2.2, elevation: 0.4, lateralAngle: Math.PI * 0.35 },
  jwst: { distance: 2.4, elevation: 0.45, lateralAngle: Math.PI * 0.25 },
  hubble: { distance: 2.0, elevation: 0.35, lateralAngle: Math.PI * 0.25 },

  // Stellar & High-Energy Relics
  crab_pulsar: { distance: 8.0, elevation: 0.4, lateralAngle: Math.PI * 0.3 },
  cygnus_x1: { distance: 10.0, elevation: 0.5, lateralAngle: Math.PI * 0.25 },
  betelgeuse: { distance: 15.0, elevation: 0.35, lateralAngle: 0 },
  sirius: { distance: 9.0, elevation: 0.35, lateralAngle: 0 },

  // Galactic & Extragalactic
  sagittarius_a: { distance: 24.0, elevation: 0.45, lateralAngle: Math.PI * 0.2 },
  andromeda_galaxy: { distance: 60.0, elevation: 0.6, lateralAngle: Math.PI * 0.2 },
  m87_black_hole: { distance: 40.0, elevation: 0.5, lateralAngle: Math.PI * 0.3 },
  laniakea_supercluster: { distance: 120.0, elevation: 0.5, lateralAngle: 0 },
};

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
  const framing = CELESTIAL_FRAMING[bodyId] || { distance: 4.0, elevation: 0.4, lateralAngle: 0.3 };
  const dist = framing.distance;

  // Vector from origin (Sun at 0,0,0) to planet
  const sunToBody = _tempVec.copy(bodyWorldPos);
  const sunDist = sunToBody.length();

  if (sunDist < 0.1) {
    // If body is at origin (e.g. the Sun itself)
    outCamPos.set(dist * 0.8, dist * framing.elevation, dist * 0.8);
    return;
  }

  sunToBody.normalize();

  // Lateral perpendicular vector (in the XZ plane)
  const perp = new THREE.Vector3(-sunToBody.z, 0, sunToBody.x).normalize();

  // Combine sun-to-body vector and perpendicular vector based on lateralAngle
  const viewDir = new THREE.Vector3()
    .copy(sunToBody)
    .multiplyScalar(Math.cos(framing.lateralAngle))
    .addScaledVector(perp, Math.sin(framing.lateralAngle))
    .normalize();

  // Position camera at bodyWorldPos + viewDir * dist + Y offset
  outCamPos.copy(bodyWorldPos)
    .addScaledVector(viewDir, dist)
    .setY(bodyWorldPos.y + dist * framing.elevation);
}
