'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LayerVisibilityProvider } from './LayerVisibility';

const HIDE_HYSTERESIS = 1.2; // shown at < radius, hidden again only beyond radius × 1.2

/**
 * Distance-based level of detail for a cluster of sub-objects (e.g. the systems inside Andromeda).
 * Children mount the first time the camera comes within `radius` of `center` (or when `forceActive`, e.g. one
 * of them is selected) and afterwards are only shown/hidden, so re-entering is free. Visibility depends on where
 * the camera is, never on where it looks, so nothing pops while orbiting or looking around.
 */
export const ProximityLod: React.FC<{
  center: [number, number, number];
  radius: number;
  forceActive?: boolean;
  children: React.ReactNode;
}> = ({ center, radius, forceActive = false, children }) => {
  const centerVec = useMemo(() => new THREE.Vector3(...center), [center]);
  const [active, setActive] = useState(forceActive);
  const [mounted, setMounted] = useState(forceActive);
  const activeRef = useRef(active);

  useFrame(({ camera }) => {
    const d = camera.position.distanceTo(centerVec);
    const next = forceActive || (activeRef.current ? d < radius * HIDE_HYSTERESIS : d < radius);
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
      if (next) setMounted(true);
    }
  });

  if (!mounted) return null;
  return (
    <group visible={active}>
      <LayerVisibilityProvider visible={active}>{children}</LayerVisibilityProvider>
    </group>
  );
};
