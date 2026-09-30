import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Shared parts for the spacecraft models (Hubble, JWST, Voyager): a reflection environment so metal and foil
// actually reflect instead of rendering near-black, procedural surface textures (no downloads), and real
// parabolic dish geometry.

// ---------------------------------------------------------------------------------------------------------------
// Reflections: a neutral studio environment prefiltered once per renderer, assigned per material (spacecraft only)
// ---------------------------------------------------------------------------------------------------------------
let envTexture: THREE.Texture | null = null;
export function useSpacecraftEnvMap() {
  const gl = useThree((s) => s.gl);
  return useMemo(() => {
    if (envTexture) return envTexture;
    const pmrem = new THREE.PMREMGenerator(gl);
    envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return envTexture;
  }, [gl]);
}

// ---------------------------------------------------------------------------------------------------------------
// Procedural textures (canvas): cached per session
// ---------------------------------------------------------------------------------------------------------------
const cache = new Map<string, THREE.CanvasTexture>();
function canvasTexture(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

// Deterministic pseudo-random for stable textures between loads
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hubble's silver multi-layer insulation: a patchwork of slightly different aluminised blanket panels */
export function getMliTexture() {
  return canvasTexture('mli', 512, 512, (g) => {
    const r = rng(7);
    g.fillStyle = '#c9ced6';
    g.fillRect(0, 0, 512, 512);
    const cols = 8;
    const rows = 10;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const x = (i / cols) * 512;
        const y = (j / rows) * 512;
        const shade = 190 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${shade},${shade + 3},${shade + 8})`;
        g.fillRect(x + 1, y + 1, 512 / cols - 2, 512 / rows - 2);
        // crinkle highlights
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.12})`;
          g.beginPath();
          g.moveTo(x + r() * 64, y + r() * 51);
          g.lineTo(x + r() * 64, y + r() * 51);
          g.stroke();
        }
      }
    // panel seams and tape
    g.strokeStyle = 'rgba(90,96,108,0.8)';
    g.lineWidth = 2;
    for (let i = 0; i <= cols; i++) {
      g.beginPath();
      g.moveTo((i / cols) * 512, 0);
      g.lineTo((i / cols) * 512, 512);
      g.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      g.beginPath();
      g.moveTo(0, (j / rows) * 512);
      g.lineTo(512, (j / rows) * 512);
      g.stroke();
    }
  });
}

/** Solar array cells: dark blue cells in a silver grid (Hubble's rigid SA3 arrays, Voyager uses none) */
export function getSolarCellTexture() {
  return canvasTexture('solar-cells', 512, 256, (g) => {
    g.fillStyle = '#9aa3ad';
    g.fillRect(0, 0, 512, 256);
    const cw = 16;
    const ch = 12;
    for (let x = 0; x < 512; x += cw)
      for (let y = 0; y < 256; y += ch) {
        const grad = g.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, '#1a2a5c');
        grad.addColorStop(1, '#0d1838');
        g.fillStyle = grad;
        g.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      }
    // bus bars
    g.fillStyle = '#c0c6cc';
    for (let x = 0; x < 512; x += 128) g.fillRect(x, 0, 3, 256);
  });
}

/** Gold Kapton / foil with crinkles (Voyager bus blankets, JWST parts) */
export function getGoldFoilTexture() {
  return canvasTexture('gold-foil', 256, 256, (g) => {
    const r = rng(11);
    g.fillStyle = '#c99a2e';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 220; i++) {
      const x = r() * 256;
      const y = r() * 256;
      const len = 10 + r() * 40;
      const a = r() * Math.PI;
      g.strokeStyle = r() > 0.5 ? `rgba(255,236,160,${0.15 + r() * 0.25})` : `rgba(90,60,10,${0.15 + r() * 0.2})`;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
  });
}

/** JWST sunshield Kapton: silvery-violet with the fold creases of its five membranes */
export function getSunshieldTexture() {
  return canvasTexture('sunshield', 512, 512, (g) => {
    const r = rng(23);
    const grad = g.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#b9a7d6');
    grad.addColorStop(0.5, '#d7cfe6');
    grad.addColorStop(1, '#a896c9');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(255,255,255,${0.1 + r() * 0.2})`;
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      const y = r() * 512;
      g.moveTo(0, y);
      g.lineTo(512, y + (r() - 0.5) * 60);
      g.stroke();
    }
    // rip-stop grid
    g.strokeStyle = 'rgba(80,60,120,0.15)';
    for (let x = 0; x < 512; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 512);
      g.stroke();
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------------------------------------

/** A parabolic dish (opening along +y): radius r, depth d; lathe of y = d·(x/r)² */
export function parabolicDishGeometry(radius: number, depth: number, segments = 48, rings = 16) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= rings; i++) {
    const x = (i / rings) * radius;
    pts.push(new THREE.Vector2(Math.max(x, 0.0001), depth * (x / radius) ** 2));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/** Regular hexagon (flat-to-flat width w) extruded to thickness t, lying in the XY plane */
export function hexSegmentGeometry(flatWidth: number, thickness: number) {
  const r = flatWidth / Math.sqrt(3); // corner radius
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: thickness * 0.3, bevelThickness: thickness * 0.3, bevelSegments: 1 });
}
