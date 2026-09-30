'use client';

import React from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { maskHas } from '@/lib/scaleVisibility';
import { LayerVisibilityProvider } from './LayerVisibility';

/**
 * Coarse stand-in for content that is modelled in detail by another scale (e.g. the Sol beacon of the Stellar
 * Neighborhood stands in for the Solar System scale). It is shown only while that detailed layer is hidden,
 * so the two versions never overlap during a transition.
 */
export const ScaleStandIn: React.FC<{ replacesScale: number; children: React.ReactNode }> = ({
  replacesScale,
  children,
}) => {
  const detailedVisible = useQuantumStore((s) => maskHas(s.visibleScaleMask, replacesScale));
  return (
    <group visible={!detailedVisible}>
      <LayerVisibilityProvider visible={!detailedVisible}>{children}</LayerVisibilityProvider>
    </group>
  );
};
