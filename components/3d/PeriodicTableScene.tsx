'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS, CATEGORY_COLORS, ElementData } from '@/data/elementsData';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { createElementCardTexture } from '@/lib/textureGenerator';

interface CardProps {
  element: ElementData;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: (num: number) => void;
  onZoomIn: () => void;
}

const ElementCardMesh: React.FC<CardProps> = ({
  element,
  x,
  y,
  isSelected,
  onSelect,
  onZoomIn,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const catColor = CATEGORY_COLORS[element.cat]?.hex || '#ffffff';

  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createElementCardTexture(
      element.num,
      element.sym,
      element.nameEn,
      element.nameAr,
      element.mass,
      catColor,
      hovered,
      isSelected
    );
  }, [element, catColor, hovered, isSelected]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetZ = isSelected ? 1.6 : hovered ? 0.9 : 0;
    meshRef.current.position.z = THREE.MathUtils.damp(
      meshRef.current.position.z,
      targetZ,
      12,
      delta
    );

    const targetScale = isSelected ? 1.08 : hovered ? 1.04 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, 1),
      delta * 12
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={[x, y, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.num);
        if (isSelected) {
          onZoomIn();
        }
      }}
    >
      <planeGeometry args={[1.5, 1.5]} />
      {texture ? (
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      ) : (
        <meshStandardMaterial color={catColor} />
      )}
    </mesh>
  );
};

export const PeriodicTableScene: React.FC = () => {
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const zoomIn = useQuantumStore((s) => s.zoomIn);

  // Layout 18 columns, centered around (0,0)
  // Standard spacing: dx = 1.65, dy = 1.65
  const cards = useMemo(() => {
    const colOffset = 9.5;
    const rowOffset = 4.2;
    const dx = 1.68;
    const dy = 1.68;

    return ELEMENTS.map((el) => {
      let r = el.row;
      let c = el.col;

      // Lanthanides & Actinides separated placement at bottom
      if (el.cat === 'lanthanide') {
        r = 8.6;
        c = el.num - 57 + 3;
      } else if (el.cat === 'actinide') {
        r = 9.9;
        c = el.num - 89 + 3;
      }

      const x = (c - colOffset) * dx;
      const y = -(r - rowOffset) * dy;

      return {
        element: el,
        x,
        y,
      };
    });
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {cards.map(({ element, x, y }) => (
        <ElementCardMesh
          key={element.num}
          element={element}
          x={x}
          y={y}
          isSelected={element.num === activeElementNum}
          onSelect={setActiveElement}
          onZoomIn={zoomIn}
        />
      ))}
    </group>
  );
};
