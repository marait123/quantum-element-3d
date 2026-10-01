import * as THREE from 'three';
import { rotationAngle, rotationRateDegPerDay } from '@/lib/ephemeris';
import { skyDaysSinceJ2000 } from '@/lib/simClock';

// Planet surfaces turn to their real rotation angle for the sky date (lib/ephemeris.ts), so the right side of each
// planet faces the Sun: on Earth, the continent under the Sun matches the time of day. When time runs fast
// (×1 is a day every half second, date jumps are faster still) the true angle would strobe, so the surface spins at
// a capped visual rate instead and settles back onto the true angle as soon as time slows down or stops.

const DEG = Math.PI / 180;
const MAX_VISUAL_RATE = 0.9; // radians per real second
const SETTLE_RATE = 5; // how fast the surface catches up with the true angle (per second)

const wrap = (a: number) => {
  a = (a + Math.PI) % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return a - Math.PI;
};

export function updatePlanetSpin(id: string, mesh: THREE.Object3D, delta: number) {
  const days = skyDaysSinceJ2000();
  const target = rotationAngle(id, days);
  const ud = mesh.userData as { spin?: number; spinDays?: number };
  if (ud.spin === undefined || ud.spinDays === undefined) {
    ud.spin = target;
  } else {
    const turned = rotationRateDegPerDay(id) * DEG * (days - ud.spinDays); // true rotation this frame
    const dt = Math.max(delta, 1e-3);
    if (Math.abs(turned) / dt > MAX_VISUAL_RATE) {
      ud.spin += Math.sign(turned) * MAX_VISUAL_RATE * dt;
    } else {
      const diff = wrap(target - ud.spin);
      // Following the true angle: snap when within this frame's motion, otherwise ease onto it
      ud.spin += Math.abs(diff) <= Math.abs(turned) + 1e-3 ? diff : diff * Math.min(1, dt * SETTLE_RATE);
    }
  }
  ud.spinDays = days;
  mesh.rotation.y = ud.spin;
}
