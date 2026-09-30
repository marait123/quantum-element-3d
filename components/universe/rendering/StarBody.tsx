'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createStarMaterial, getCoronaTexture, kelvinToColor } from './celestialMaterials';

interface StarBodyProps {
  radius: number;
  /** Surface temperature: sets the colour (red dwarf ~3000 K, Sun 5772 K, blue giant 20000+ K) */
  kelvin?: number;
  /** Explicit tint instead of a temperature */
  color?: THREE.ColorRepresentation;
  brightness?: number;
  /** 1 keeps sunspots (Sun-like), 0 smooths them out (hot stars) */
  spots?: number;
  /** Corona/glow size as a multiple of the radius; 0 for none */
  glowScale?: number;
  glowOpacity?: number;
  segments?: number;
  /** Rotation period of the surface pattern in real seconds (visual only) */
  spin?: number;
}

/**
 * A star: the Sun's real photosphere map reused and tinted by temperature, with churning granulation, limb
 * darkening and a soft camera-facing glow. Shared by the Sun and every other star so they all read as stars
 * rather than flat balls (and need no extra textures).
 */
export const StarBody: React.FC<StarBodyProps> = ({
  radius,
  kelvin,
  color,
  brightness,
  spots,
  glowScale = 3.4,
  glowOpacity = 0.6,
  segments = 48,
  spin = 0.02,
}) => {
  const material = useMemo(
    () => createStarMaterial({ kelvin, color, brightness, spots }),
    [kelvin, color, brightness, spots]
  );
  const glowColor = useMemo(
    () => (color !== undefined ? new THREE.Color(color) : kelvinToColor(kelvin ?? 5772)),
    [color, kelvin]
  );
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
    if (meshRef.current) meshRef.current.rotation.y += delta * spin;
  });

  return (
    <group>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[radius, segments, segments]} />
      </mesh>
      {glowScale > 0 && (
        <sprite scale={[radius * glowScale * 2, radius * glowScale * 2, 1]} raycast={() => null}>
          <spriteMaterial
            map={getCoronaTexture()}
            color={glowColor}
            transparent
            opacity={glowOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}
    </group>
  );
};
