import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Procedural rocky bodies: an icosphere pushed in and out by 3D noise, pocked with bowl craters (raised rims),
// optionally reshaped (Bennu's spinning-top ridge, a two-lobed contact binary, an elongated potato), with albedo
// variation baked into vertex colours. Deterministic per seed, so a body looks the same every visit.

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 3D value noise with a seeded lattice
function makeNoise(seed: number) {
  const perm = new Uint8Array(512);
  const r = mulberry32(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = new Float32Array(256).map(() => r() * 2 - 1);
  const fade = (t: number) => t * t * (3 - 2 * t);
  const hash = (x: number, y: number, z: number) => grad[perm[perm[perm[x & 255] + (y & 255)] + (z & 255)]];
  const noise = (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const x00 = lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u);
    const x10 = lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u);
    const x01 = lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u);
    const x11 = lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u);
    return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
  };
  return (x: number, y: number, z: number, octaves = 4) => {
    let sum = 0, amp = 0.5, freq = 1;
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise(x * freq, y * freq, z * freq);
      amp *= 0.5;
      freq *= 2.1;
    }
    return sum;
  };
}

export interface RockOptions {
  radius: number;
  seed: number;
  detail?: number; // icosphere subdivisions
  relief?: number; // noise displacement as a fraction of the radius
  craters?: number;
  craterSize?: [number, number]; // angular radius range (radians)
  stretch?: [number, number, number];
  shape?: 'none' | 'spinning-top' | 'bilobed';
  color: THREE.ColorRepresentation;
  albedoJitter?: number; // 0..1 brightness variation
  /** A bright patch (e.g. Ceres' Occator salt deposits): direction, angular size, colour */
  brightSpot?: { dir: [number, number, number]; size: number; color: THREE.ColorRepresentation };
  /** One huge crater (e.g. Phobos' Stickney) */
  giantCrater?: { dir: [number, number, number]; size: number; depth: number };
}

export function rockGeometry(o: RockOptions) {
  // Shared vertices (the icosphere comes unindexed) so the displaced surface shades smoothly, not faceted
  const ico = new THREE.IcosahedronGeometry(1, o.detail ?? 4);
  ico.deleteAttribute('normal');
  ico.deleteAttribute('uv');
  const geo = mergeVertices(ico);
  ico.dispose();
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const noise = makeNoise(o.seed);
  const r = mulberry32(o.seed * 7 + 3);
  const relief = o.relief ?? 0.16;
  const [cmin, cmax] = o.craterSize ?? [0.08, 0.35];
  const craters = Array.from({ length: o.craters ?? 14 }, () => {
    const d = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
    return { d, size: cmin + r() * (cmax - cmin), depth: 0.04 + r() * 0.08 };
  });
  if (o.giantCrater) {
    craters.push({ d: new THREE.Vector3(...o.giantCrater.dir).normalize(), size: o.giantCrater.size, depth: o.giantCrater.depth });
  }
  const base = new THREE.Color(o.color);
  const bright = o.brightSpot ? new THREE.Color(o.brightSpot.color) : null;
  const brightDir = o.brightSpot ? new THREE.Vector3(...o.brightSpot.dir).normalize() : null;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();
  const col = new THREE.Color();
  const jitter = o.albedoJitter ?? 0.35;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let h = 1 + noise(v.x * 1.6, v.y * 1.6, v.z * 1.6, 5) * relief * 2;
    let shade = 1;
    for (const c of craters) {
      const ang = v.angleTo(c.d);
      if (ang < c.size * 1.25) {
        const t = ang / c.size;
        // bowl inside, raised rim just outside
        if (t < 1) {
          h -= c.depth * (1 - t * t);
          shade *= 0.85 + 0.15 * t;
        } else {
          h += c.depth * 0.35 * (1 - (t - 1) / 0.25);
        }
      }
    }
    if (o.shape === 'spinning-top') {
      // Bennu/Ryugu: an equatorial ridge, conical towards the poles
      h *= 0.82 + 0.3 * (1 - Math.abs(v.y)) ** 1.6;
    }
    v.multiplyScalar(h);
    if (o.shape === 'bilobed') {
      // Two lobes joined by a narrower neck along x
      const neck = Math.exp(-(v.x * v.x) / 0.08);
      v.y *= 1 - 0.32 * neck;
      v.z *= 1 - 0.32 * neck;
    }
    if (o.stretch) v.set(v.x * o.stretch[0], v.y * o.stretch[1], v.z * o.stretch[2]);
    pos.setXYZ(i, v.x * o.radius, v.y * o.radius, v.z * o.radius);

    const n = noise(v.x * 3 + 11, v.y * 3, v.z * 3, 3);
    col.copy(base).multiplyScalar(Math.max(0.2, (1 + n * jitter * 2) * shade));
    if (bright && brightDir) {
      const d = v.clone().normalize().angleTo(brightDir);
      if (d < o.brightSpot!.size) col.lerp(bright, 1 - d / o.brightSpot!.size);
    }
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
