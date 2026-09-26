import * as THREE from 'three';

export interface NucleonPosition {
  index: number;
  position: [number, number, number];
  type: 'proton' | 'neutron';
}

/**
 * Fibonacci Sphere Packing Algorithm for distributing protons and neutrons
 * based on atomic mass number A = Z + N.
 * Formula:
 * y = 1 - (i / (N - 1)) * 2
 * theta = pi * (3 - sqrt(5)) * i
 * r = R_cluster * cbrt(0.2 + 0.8 * (i / N))
 */
export function generateNucleonPositions(
  protonsCount: number,
  neutronsCount: number,
  clusterRadius: number = 3.2
): NucleonPosition[] {
  const totalNucleons = protonsCount + neutronsCount;
  if (totalNucleons <= 0) return [];

  // Single nucleon (e.g. Hydrogen-1: 1 proton, 0 neutrons)
  if (totalNucleons === 1) {
    return [
      {
        index: 0,
        position: [0, 0, 0],
        type: protonsCount > 0 ? 'proton' : 'neutron',
      },
    ];
  }

  // Interleave protons and neutrons evenly to minimize Coulomb repulsion
  const types: ('proton' | 'neutron')[] = [];
  let pLeft = protonsCount;
  let nLeft = neutronsCount;

  for (let i = 0; i < totalNucleons; i++) {
    if (pLeft > 0 && nLeft > 0) {
      if ((pLeft / (pLeft + nLeft)) >= Math.random()) {
        types.push('proton');
        pLeft--;
      } else {
        types.push('neutron');
        nLeft--;
      }
    } else if (pLeft > 0) {
      types.push('proton');
      pLeft--;
    } else {
      types.push('neutron');
      nLeft--;
    }
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const positions: NucleonPosition[] = [];

  // Scale radius based on mass number A^(1/3) according to nuclear physics R = r0 * A^(1/3)
  const effectiveClusterRadius = Math.max(1.8, clusterRadius * Math.cbrt(totalNucleons / 16));

  for (let i = 0; i < totalNucleons; i++) {
    const yNorm = 1 - (i / (totalNucleons - 1)) * 2;
    const theta = goldenAngle * i;
    const radialRatio = Math.cbrt(0.25 + 0.75 * (i / totalNucleons));
    const r = effectiveClusterRadius * radialRatio;

    const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const x = r * radiusAtY * Math.cos(theta);
    const z = r * radiusAtY * Math.sin(theta);
    const y = r * yNorm;

    positions.push({
      index: i,
      position: [x, y, z],
      type: types[i],
    });
  }

  return positions;
}

/**
 * Standing wave solver for 1D Vibrating Planck String
 * y(x, t) = sum_k A_k * sin(k * pi * x / L) * cos(omega_k * t + phi_k)
 */
export function calculateStandingWavePoint(
  x: number,
  t: number,
  harmonicMode: number,
  length: number = 10,
  amplitude: number = 1.2
): number {
  // Harmonic omega = mode * omega_0
  const k = harmonicMode;
  const omega = k * 2.8;
  const spatial = Math.sin((k * Math.PI * (x + length / 2)) / length);
  const temporal = Math.cos(omega * t);

  // Add subtle secondary quantum fluctuations
  const subHarmonic = 0.15 * Math.sin(((k + 1) * Math.PI * (x + length / 2)) / length) * Math.cos((omega * 1.5) * t);

  return amplitude * spatial * temporal + subHarmonic;
}

/**
 * Closed string quadrupolar graviton loop points
 * Evaluates spin-2 elliptical oscillation: r(theta, t) = R * (1 + epsilon * cos(2 * theta - omega * t))
 */
export function calculateGravitonLoopPoints(
  numPoints: number = 128,
  radius: number = 3.5,
  t: number = 0,
  leakHeight: number = 0
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const omega = 3.5;
  const epsilon = 0.35;

  for (let i = 0; i <= numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;
    const r = radius * (1 + epsilon * Math.cos(2 * theta - omega * t));
    const zOscillation = 0.4 * Math.sin(4 * theta + omega * t);

    // Quadrupolar wave shape in 3D + leaking into extra dimension (Y elevation)
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta) + zOscillation;
    const y = leakHeight + 0.3 * Math.sin(2 * theta - omega * t);

    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

/**
 * 6D Calabi-Yau 3-Fold 3D Cross-Section parametric immersion points
 * Real cross-section projection of quintic threefold z1^5 + z2^5 = 1
 */
export function generateCalabiYauPoints(
  uSteps: number = 32,
  vSteps: number = 32,
  scale: number = 2.8,
  alphaParam: number = 0.2
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= uSteps; i++) {
    const u = (i / uSteps) * Math.PI * 2 - Math.PI;
    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps) * Math.PI * 2 - Math.PI;

      // Parametric cross-section mapping complex coordinates to R3
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      const x = scale * (cosU * cosV - sinU * sinV * alphaParam);
      const y = scale * (sinU * cosV + cosU * sinV * alphaParam);
      const z = scale * 0.8 * Math.sin(2 * u) * Math.cos(2 * v);

      points.push(new THREE.Vector3(x, y, z));
    }
  }

  return points;
}

/**
 * Calculates 3D coordinates for an element's card in the standard 18-column Periodic Table
 */
export function getElementCardPosition(
  row: number,
  col: number,
  cat: string,
  num: number
): [number, number] {
  const colOffset = 9.5;
  const rowOffset = 4.2;
  const dx = 1.68;
  const dy = 1.68;

  let r = row;
  let c = col;

  if (cat === 'lanthanide') {
    r = 8.6;
    c = num - 57 + 3;
  } else if (cat === 'actinide') {
    r = 9.9;
    c = num - 89 + 3;
  }

  const x = (c - colOffset) * dx;
  const y = -(r - rowOffset) * dy;
  return [x, y];
}
