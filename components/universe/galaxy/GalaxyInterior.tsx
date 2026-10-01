'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { InteriorStyle } from '@/lib/galaxyInteriors';
import { starPointSprites } from '@/components/universe/rendering/softPointSprites';
import { isLowQuality } from '@/lib/deviceQuality';

/**
 * Detailed star field of a galaxy seen from inside (the equivalent of the Milky Way's scale-3 spiral arms).
 * Rendered in the galaxy's disk frame (XZ = disk plane) by ExtragalacticScene, faded in as the camera enters.
 * Layouts follow each galaxy's well-known structure; individual star positions are procedural.
 */

const COLORS = {
  core: new THREE.Color('#fde68a'),
  oldStar: new THREE.Color('#fdba74'),
  youngStar: new THREE.Color('#93c5fd'),
  hotStar: new THREE.Color('#e0f2fe'),
  hii: new THREE.Color('#f472b6'),
  wind: new THREE.Color('#f87171'),
};

// Deterministic random so a galaxy looks the same every visit
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Builder {
  rand: () => number;
  gauss: () => number;
  add: (x: number, y: number, z: number, c: THREE.Color, brightness?: number) => void;
}

// Each generator writes stars in units of the galaxy radius (R = 1)
const GENERATORS: Record<InteriorStyle, { count: number; build: (b: Builder) => void }> = {
  // Andromeda: two grand spiral arms, a large bright bulge and the star-forming ring at ~10 kpc
  grand_spiral: {
    count: 45000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 45000; i++) {
        const k = rand();
        if (k < 0.2) {
          const r = Math.abs(gauss()) * 0.17;
          const a = rand() * Math.PI * 2;
          const phi = (rand() - 0.5) * Math.PI;
          add(Math.cos(a) * Math.cos(phi) * r, Math.sin(phi) * r * 0.6, Math.sin(a) * Math.cos(phi) * r, rand() < 0.6 ? COLORS.core : COLORS.oldStar);
        } else if (k < 0.3) {
          // "Ring of fire": star-forming ring at ~45% of the disk radius
          const a = rand() * Math.PI * 2;
          const r = 0.45 + gauss() * 0.025;
          add(Math.cos(a) * r, gauss() * 0.01, Math.sin(a) * r, rand() < 0.35 ? COLORS.hii : COLORS.youngStar, 1.2);
        } else if (k < 0.85) {
          const r = 0.12 + Math.pow(rand(), 0.85) * 0.9;
          const arm = rand() < 0.5 ? 0 : Math.PI;
          const a = arm + Math.log(r / 0.12) / Math.tan(0.26) + gauss() * (0.1 + 0.12 * r);
          const c = rand() < 0.07 && r > 0.25 ? COLORS.hii : new THREE.Color().lerpColors(COLORS.core, COLORS.youngStar, Math.min(1, r * 1.3));
          add(Math.cos(a) * r, gauss() * 0.012 * (1.5 - r), Math.sin(a) * r, c);
        } else {
          // Older stars filling the disk between the arms
          const r = Math.pow(rand(), 0.7) * 1.0;
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.02, Math.sin(a) * r, COLORS.oldStar, 0.5);
        }
      }
    },
  },

  // Triangulum: small bulge, many short patchy arm segments, lots of H II regions (NGC 604, NGC 595…)
  flocculent_spiral: {
    count: 35000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 35000; i++) {
        const k = rand();
        if (k < 0.07) {
          const r = Math.abs(gauss()) * 0.07;
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.03, Math.sin(a) * r, COLORS.core);
        } else if (k < 0.85) {
          const r = 0.08 + Math.pow(rand(), 0.9) * 0.95;
          const arm = Math.floor(rand() * 5) * ((Math.PI * 2) / 5);
          const a = arm + Math.log(r / 0.08) / Math.tan(0.42) + gauss() * (0.25 + 0.2 * r);
          const c = rand() < 0.12 ? COLORS.hii : rand() < 0.5 ? COLORS.youngStar : COLORS.hotStar;
          add(Math.cos(a) * r, gauss() * 0.015, Math.sin(a) * r, c);
        } else {
          const r = Math.pow(rand(), 0.6);
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.02, Math.sin(a) * r, COLORS.oldStar, 0.5);
        }
      }
    },
  },

  // Large Magellanic Cloud: prominent off-centre bar, one spiral arm and scattered star-forming clumps
  barred_magellanic: {
    count: 26000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 26000; i++) {
        const k = rand();
        if (k < 0.38) {
          // Bar, slightly offset from the disk centre
          add(0.1 + gauss() * 0.42, gauss() * 0.05, -0.06 + gauss() * 0.1, rand() < 0.7 ? COLORS.oldStar : COLORS.core);
        } else if (k < 0.62) {
          // Single spiral arm leaving one end of the bar
          const t = rand();
          const a = -0.4 + t * Math.PI * 1.1;
          const r = 0.45 + t * 0.45;
          add(Math.cos(a) * r + gauss() * 0.07, gauss() * 0.04, Math.sin(a) * r + gauss() * 0.07, rand() < 0.15 ? COLORS.hii : COLORS.youngStar);
        } else if (k < 0.72) {
          // Star-forming clumps (the Tarantula region sits at the bar's eastern end)
          const cx = rand() < 0.4 ? -0.3 : (rand() - 0.5) * 1.4;
          const cz = rand() < 0.4 ? 0.12 : (rand() - 0.5) * 1.4;
          add(cx + gauss() * 0.05, gauss() * 0.03, cz + gauss() * 0.05, rand() < 0.6 ? COLORS.hii : COLORS.hotStar, 1.2);
        } else {
          const r = Math.pow(rand(), 0.6) * 1.0;
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.05, Math.sin(a) * r * 0.85, COLORS.youngStar, 0.55);
        }
      }
    },
  },

  // Small Magellanic Cloud: elongated irregular body with the star-forming Wing extending to one side
  irregular_dwarf: {
    count: 18000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 18000; i++) {
        const k = rand();
        if (k < 0.62) {
          const t = gauss() * 0.45;
          add(t * 0.9 + gauss() * 0.12, gauss() * 0.12, t * 0.45 + gauss() * 0.12, rand() < 0.5 ? COLORS.oldStar : COLORS.youngStar);
        } else if (k < 0.85) {
          // The Wing (home of NGC 602)
          const t = rand();
          add(0.35 + t * 0.55 + gauss() * 0.08, gauss() * 0.06, 0.25 + t * 0.3 + gauss() * 0.1, rand() < 0.2 ? COLORS.hii : COLORS.hotStar);
        } else {
          add(gauss() * 0.3, gauss() * 0.08, gauss() * 0.3, rand() < 0.3 ? COLORS.hii : COLORS.youngStar, 1.2);
        }
      }
    },
  },

  // M82: thin disk, intense central starburst and the bipolar superwind rising out of the plane
  starburst_disk: {
    count: 30000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 30000; i++) {
        const k = rand();
        if (k < 0.3) {
          const r = Math.abs(gauss()) * 0.13;
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.03, Math.sin(a) * r, rand() < 0.5 ? COLORS.hotStar : COLORS.hii, 1.3);
        } else if (k < 0.82) {
          const r = -Math.log(1 - rand() * 0.95) * 0.3;
          const a = rand() * Math.PI * 2;
          add(Math.cos(a) * r, gauss() * 0.025, Math.sin(a) * r, rand() < 0.6 ? COLORS.oldStar : COLORS.youngStar);
        } else {
          // Superwind filaments: cones above and below the starburst core
          const up = rand() < 0.5 ? 1 : -1;
          const h = rand() * 0.9;
          const spread = 0.05 + h * 0.35;
          add(gauss() * spread, up * h, gauss() * spread * 0.6, COLORS.wind, 0.8);
        }
      }
    },
  },

  // Centaurus A: giant elliptical of old stars crossed by a warped disk of young stars and star formation
  elliptical_with_lane: {
    count: 32000,
    build: ({ rand, gauss, add }) => {
      for (let i = 0; i < 32000; i++) {
        if (rand() < 0.72) {
          const s = Math.abs(gauss());
          const a = rand() * Math.PI * 2;
          const phi = Math.acos(rand() * 2 - 1);
          const r = s * 0.32;
          add(r * Math.sin(phi) * Math.cos(a), r * Math.cos(phi) * 0.85, r * Math.sin(phi) * Math.sin(a), rand() < 0.6 ? COLORS.oldStar : COLORS.core);
        } else {
          const r = 0.15 + rand() * 0.45;
          const a = rand() * Math.PI * 2;
          const warp = Math.sin(a * 2) * 0.04 * r;
          add(Math.cos(a) * r, warp + gauss() * 0.01, Math.sin(a) * r, rand() < 0.3 ? COLORS.hii : COLORS.youngStar, 1.1);
        }
      }
    },
  },
};

export const GalaxyInterior: React.FC<{ body: CelestialBody; style: InteriorStyle }> = ({ body, style }) => {
  const texture = useMemo(() => getGlowPointTexture(), []);

  const [positions, colors] = useMemo(() => {
    const gen = GENERATORS[style];
    const pos = new Float32Array(gen.count * 3);
    const col = new Float32Array(gen.count * 3);
    let n = 0;
    let seed = 0;
    for (const ch of body.id) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    const rand = mulberry32(seed);
    const gauss = () => {
      // Box–Muller, clamped so no star lands absurdly far out
      const g = Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());
      return Math.max(-3, Math.min(3, g));
    };
    const R = body.size;
    // Phones draw half the stars (a little larger, see the material) to keep the frame rate up
    const keep = isLowQuality() ? 0.5 : 1;
    const add = (x: number, y: number, z: number, c: THREE.Color, brightness = 1) => {
      if (n >= gen.count) return;
      if (keep < 1 && rand() > keep) return;
      pos.set([x * R, y * R, z * R], n * 3);
      const b = Math.min(1.6, brightness * 1.15) * (0.75 + rand() * 0.25);
      col.set([c.r * b, c.g * b, c.b * b], n * 3);
      n++;
    };
    gen.build({ rand, gauss, add });
    return [pos.subarray(0, n * 3), col.subarray(0, n * 3)];
  }, [body.id, body.size, style]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={starPointSprites}
        size={body.size * 0.0045 * (isLowQuality() ? 1.35 : 1)}
        map={texture}
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
