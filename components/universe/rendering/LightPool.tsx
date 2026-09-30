'use client';

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { isObjectRendered } from './LayerVisibility';
import { isLowQuality } from '@/lib/deviceQuality';

/**
 * Fixed-size point-light pool.
 *
 * three.js bakes the number of point lights into every lit shader, so each time a scale layer or LoD group with
 * lights was shown or hidden, every MeshStandardMaterial on screen recompiled — hundreds of ms of freeze at
 * scale transitions on ANGLE/D3D. Scenes now declare <PooledPointLight> (same props as <pointLight>), which only
 * registers a *virtual* light. The pool owns LIGHT_POOL_SIZE real PointLights (the count never changes) and each
 * frame hands them to the most relevant rendered virtual lights; spare slots sit at intensity 0.
 */

export const LIGHT_POOL_SIZE = 24;
// Phones (low quality tier) compile lit shaders for half as many lights. Decided once at load, so it never changes
// mid-session and never triggers a recompile.
export const lightPoolSize = () => (isLowQuality() ? 12 : LIGHT_POOL_SIZE);
const RERANK_EVERY_N_FRAMES = 6;
const KEEP_BONUS = 1.3; // hysteresis: an assigned light must be clearly beaten before it loses its slot

interface VirtualLight {
  anchor: THREE.Object3D | null;
  color: THREE.Color;
  intensity: number;
  distance: number;
  decay: number;
}

const virtualLights = new Set<VirtualLight>();

interface PooledPointLightProps {
  color?: THREE.ColorRepresentation;
  intensity?: number;
  distance?: number;
  decay?: number;
  position?: [number, number, number];
}

export const PooledPointLight: React.FC<PooledPointLightProps> = ({
  color = 0xffffff,
  intensity = 1,
  distance = 0,
  decay = 2,
  position,
}) => {
  const anchorRef = useRef<THREE.Object3D>(null);
  const light = useMemo<VirtualLight>(
    () => ({ anchor: null, color: new THREE.Color(), intensity: 1, distance: 0, decay: 2 }),
    []
  );
  // Props are mirrored into the virtual light; the pool copies them to its real light every frame
  light.color.set(color);
  light.intensity = intensity;
  light.distance = distance;
  light.decay = decay;

  useLayoutEffect(() => {
    light.anchor = anchorRef.current;
    virtualLights.add(light);
    return () => {
      virtualLights.delete(light);
      light.anchor = null;
    };
  }, [light]);

  return <object3D ref={anchorRef} position={position} />;
};

const _camPos = new THREE.Vector3();
const _lightPos = new THREE.Vector3();

export const LightPool: React.FC<{ size?: number }> = ({ size = lightPoolSize() }) => {
  const { camera } = useThree();
  const lights = useMemo(
    () => Array.from({ length: size }, () => new THREE.PointLight(0xffffff, 0, 0, 2)),
    [size]
  );
  const slots = useRef<(VirtualLight | null)[]>(new Array(size).fill(null));
  const frame = useRef(0);

  const rerank = () => {
    camera.getWorldPosition(_camPos);
    const current = new Set(slots.current);
    const ranked: { v: VirtualLight; score: number }[] = [];
    virtualLights.forEach((v) => {
      if (!v.anchor || v.intensity <= 0 || !isObjectRendered(v.anchor)) return;
      v.anchor.getWorldPosition(_lightPos);
      // A light matters while the camera is inside (or near) its range; beyond that its lit surfaces shrink
      // on screen quadratically. Direction-agnostic so turning the camera never swaps lights.
      const range = v.distance > 0 ? v.distance : Infinity;
      const ratio = Math.max(1, _camPos.distanceTo(_lightPos) / range);
      let score = v.intensity / (ratio * ratio);
      if (current.has(v)) score *= KEEP_BONUS;
      ranked.push({ v, score });
    });
    ranked.sort((a, b) => b.score - a.score);
    const winners = new Set(ranked.slice(0, size).map((r) => r.v));

    // Keep winners in the slot they already occupy (no flicker), then fill free slots with newcomers
    const next = slots.current.map((v) => (v && winners.has(v) ? v : null));
    const placed = new Set(next);
    let free = 0;
    winners.forEach((v) => {
      if (placed.has(v)) return;
      while (free < size && next[free]) free++;
      if (free < size) next[free] = v;
    });
    slots.current = next;
  };

  useFrame(() => {
    if (frame.current++ % RERANK_EVERY_N_FRAMES === 0) rerank();
    for (let i = 0; i < size; i++) {
      const v = slots.current[i];
      const l = lights[i];
      if (!v || !v.anchor || !virtualLights.has(v) || !isObjectRendered(v.anchor)) {
        l.intensity = 0;
        if (v && (!v.anchor || !virtualLights.has(v))) slots.current[i] = null;
        continue;
      }
      v.anchor.getWorldPosition(l.position);
      l.color.copy(v.color);
      l.intensity = v.intensity;
      l.distance = v.distance;
      l.decay = v.decay;
    }
  });

  return (
    <group name="light-pool">
      {lights.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
};

// Diagnostics for the dev probe
export function getLightPoolStats() {
  let rendered = 0;
  virtualLights.forEach((v) => {
    if (v.anchor && isObjectRendered(v.anchor)) rendered++;
  });
  return { virtual: virtualLights.size, rendered };
}
