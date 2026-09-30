'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FADE_EPSILON = 0.004;

// Adds a `uLayerFade` alpha multiplier to a custom ShaderMaterial (once). Done at mount so the extra compile
// happens during layer prewarm, never mid-zoom.
function injectShaderFade(mat: THREE.ShaderMaterial) {
  if (mat.uniforms.uLayerFade) return;
  mat.uniforms.uLayerFade = { value: 1 };
  const src = mat.fragmentShader;
  const end = src.lastIndexOf('}');
  if (end < 0) return;
  mat.fragmentShader = `uniform float uLayerFade;\n${src.slice(0, end)}  gl_FragColor.a *= uLayerFade;\n${src.slice(end)}`;
  mat.needsUpdate = true;
}

function forEachMaterial(root: THREE.Object3D, fn: (m: THREE.Material) => void) {
  root.traverse((o) => {
    const mat = (o as THREE.Mesh).material;
    if (!mat) return;
    if (Array.isArray(mat)) mat.forEach(fn);
    else fn(mat);
  });
}

// Fade groups can be nested (e.g. a galaxy fading in from the Milky Way, and inside it the far-away billboard
// fading out as you enter). Each group records its own factor on the material; the product is applied.
function applyFade(mat: THREE.Material, groupId: number, fade: number, fadeOpaque: boolean) {
  const factors: Record<number, number> = (mat.userData.fadeFactors ??= {});
  factors[groupId] = fade;
  (mat.userData.fadeSeen ??= {})[groupId] = fade;
  let product = 1;
  for (const k in factors) product *= factors[k];

  const shader = mat as THREE.ShaderMaterial;
  if (shader.isShaderMaterial) {
    injectShaderFade(shader);
    if (shader.uniforms.uLayerFade) shader.uniforms.uLayerFade.value = product;
    return;
  }
  if (!mat.transparent) {
    if (!fadeOpaque) return;
    // Opaque materials become transparent once, at mount (before their first compile), so they can fade too
    mat.transparent = true;
    mat.needsUpdate = true;
  }
  if (mat.userData.baseOpacity === undefined) mat.userData.baseOpacity = mat.opacity;
  mat.opacity = mat.userData.baseOpacity * product;
}

let nextFadeGroupId = 1;

/**
 * Fades everything under `groupRef` from where the camera is, so content dissolves smoothly instead of popping
 * when its scale layer turns off (e.g. the cosmic web and the neighbouring galaxies as you fly into the Milky Way).
 * Materials scale their opacity, custom shaders get an alpha multiplier; once fully faded the group is hidden
 * (which also takes it out of pointer picking).
 */
export function useDistanceFade(
  groupRef: React.RefObject<THREE.Object3D>,
  fadeForCamera: (camera: THREE.Camera) => number,
  fadeOpaque = true
) {
  const lastFade = useRef(-1);
  const groupId = useRef(0);
  if (groupId.current === 0) groupId.current = nextFadeGroupId++;

  useLayoutEffect(() => {
    const g = groupRef.current;
    const id = groupId.current;
    if (g) forEachMaterial(g, (m) => applyFade(m, id, lastFade.current < 0 ? 1 : lastFade.current, fadeOpaque));
  });

  useFrame(({ camera }) => {
    const g = groupRef.current;
    if (!g) return;
    const id = groupId.current;
    const fade = THREE.MathUtils.clamp(fadeForCamera(camera), 0, 1);
    const changed = Math.abs(fade - lastFade.current) >= FADE_EPSILON || (fade === 0 && g.visible);
    if (changed) lastFade.current = fade;
    const current = lastFade.current;
    // Also catches materials mounted later (e.g. LoD sub-systems) before their first render
    forEachMaterial(g, (m) => {
      if (m.userData.fadeSeen?.[id] !== current) applyFade(m, id, current, fadeOpaque);
    });
    if (changed) {
      g.visible = fade > FADE_EPSILON;
      g.userData.fade = fade; // read by the dev probe to know how visible faded content really is
    }
  });
}

/** Group wrapper around useDistanceFade. */
export const DistanceFadeGroup: React.FC<{
  fade: (camera: THREE.Camera) => number;
  // false: leave opaque materials untouched (use for large scenes whose opaque parts are tiny when faded)
  fadeOpaque?: boolean;
  children: React.ReactNode;
}> = ({ fade, fadeOpaque = true, children }) => {
  const ref = useRef<THREE.Group>(null);
  useDistanceFade(ref, fade, fadeOpaque);
  return <group ref={ref}>{children}</group>;
};
