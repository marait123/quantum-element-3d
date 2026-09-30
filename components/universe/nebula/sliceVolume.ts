import * as THREE from 'three';
import { NebulaSliceVertexShader, NebulaSliceFragmentShader } from './shaders/nebulaShaders';

// Shared machinery for volumetric gas clouds (nebulae and supernova remnants): a stack of camera-facing slices in
// one mesh, ordered far → near so a single draw call composites them back to front. See nebulaShaders.ts.

export interface SliceVolumeLook {
  morph: number;
  colA: string;
  colB: string;
  colC: string;
  colD: string;
  dust: number;
  filaments?: number;
  gain?: number;
  core?: [number, number, number];
}

// Deterministic per-object randomness
export function seededRandom(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// N slices through a sphere of radius R; each only as large as the sphere's cross-section at its depth
export function makeSliceGeometry(radius: number, count: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < count; i++) {
    const z = -radius + ((i + 0.5) / count) * radius * 2;
    const h = Math.sqrt(Math.max(radius * radius - z * z, 0)) * 1.02;
    const b = i * 4;
    pos.push(-h, -h, z, h, -h, z, h, h, z, -h, h, z);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.05);
  return g;
}

export function createSliceMaterial(
  look: SliceVolumeLook,
  opts: { id: string; radius: number; sliceCount: number; low: boolean; axis?: THREE.Vector3 }
) {
  const rand = seededRandom(opts.id);
  return new THREE.ShaderMaterial({
    vertexShader: NebulaSliceVertexShader,
    fragmentShader: NebulaSliceFragmentShader,
    defines: { NEB_OCTAVES: opts.low ? 3 : 4 },
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: look.morph },
      uColA: { value: new THREE.Color(look.colA) },
      uColB: { value: new THREE.Color(look.colB) },
      uColC: { value: new THREE.Color(look.colC) },
      uColD: { value: new THREE.Color(look.colD) },
      uDustCol: { value: new THREE.Color('#120a06') },
      uDust: { value: look.dust },
      uFilaments: { value: look.filaments ?? 0 },
      uStep: { value: 2 / opts.sliceCount },
      uGain: { value: look.gain ?? 1 },
      uSeed: { value: new THREE.Vector3(rand() * 40, rand() * 40, rand() * 40) },
      uAxis: { value: opts.axis ?? new THREE.Vector3(0, 1, 0) },
      uCore: { value: new THREE.Vector3(...(look.core ?? [0, 0, 0])) },
      uRadius: { value: opts.radius },
      uSliceToLocal: { value: new THREE.Matrix4() },
      // Declared up front so the distance fade scales emission too (premultiplied blending)
      uLayerFade: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
}

const _qRoot = new THREE.Quaternion();

/** Turns the slice stack (a direct child of `root`) to face the camera and updates the slice → cloud transform. */
export function orientSlices(slices: THREE.Object3D, root: THREE.Object3D, camera: THREE.Camera, material: THREE.ShaderMaterial) {
  root.getWorldQuaternion(_qRoot).invert();
  slices.quaternion.copy(_qRoot.multiply(camera.quaternion));
  slices.updateMatrix();
  material.uniforms.uSliceToLocal.value.copy(slices.matrix);
}
