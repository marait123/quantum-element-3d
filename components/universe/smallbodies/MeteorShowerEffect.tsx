'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MeteorData {
  pos: THREE.Vector3;
  velocity: THREE.Vector3;
  length: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export const MeteorShowerEffect: React.FC<{ active?: boolean }> = ({ active = true }) => {
  const count = 18;
  const linesRef = useRef<THREE.LineSegments>(null);

  const meteors = useMemo<MeteorData[]>(() => {
    const list: MeteorData[] = [];
    const colors = [
      new THREE.Color('#38bdf8'), // Ionized oxygen/nitrogen cyan
      new THREE.Color('#34d399'), // Magnesium green
      new THREE.Color('#fbbf24'), // Sodium yellow/gold
      new THREE.Color('#f87171'), // Atmospheric nitrogen red
    ];

    for (let i = 0; i < count; i++) {
      list.push(spawnMeteor(colors[i % colors.length], true));
    }
    return list;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 6), [count]);
  const colorsArray = useMemo(() => new Float32Array(count * 6), [count]);

  useFrame((_, delta) => {
    if (!active || !linesRef.current) return;

    for (let i = 0; i < count; i++) {
      const m = meteors[i];
      m.life += delta;

      if (m.life >= m.maxLife) {
        // Respawn meteor
        Object.assign(m, spawnMeteor(m.color, false));
      } else {
        // Move meteor along hypersonic trajectory
        m.pos.addScaledVector(m.velocity, delta);
      }

      const head = m.pos;
      const tail = head.clone().sub(m.velocity.clone().normalize().multiplyScalar(m.length));

      const idx = i * 6;
      // Vertex 0: Head
      positions[idx] = head.x;
      positions[idx + 1] = head.y;
      positions[idx + 2] = head.z;

      // Vertex 1: Tail
      positions[idx + 3] = tail.x;
      positions[idx + 4] = tail.y;
      positions[idx + 5] = tail.z;

      // Fade out at end of life
      const alpha = Math.sin((m.life / m.maxLife) * Math.PI);
      const c = m.color;

      colorsArray[idx] = c.r * alpha * 1.5;
      colorsArray[idx + 1] = c.g * alpha * 1.5;
      colorsArray[idx + 2] = c.b * alpha * 1.5;

      colorsArray[idx + 3] = c.r * alpha * 0.15;
      colorsArray[idx + 4] = c.g * alpha * 0.15;
      colorsArray[idx + 5] = c.b * alpha * 0.15;
    }

    const geo = linesRef.current.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorsArray, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

function spawnMeteor(color: THREE.Color, randomStart = false): MeteorData {
  // Radiant around Earth orbit (~15.5 units from Sun)
  const angle = Math.random() * Math.PI * 2;
  const radius = 12.0 + Math.random() * 8.0;
  const height = (Math.random() - 0.5) * 5.0;

  const pos = new THREE.Vector3(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius
  );

  // High-velocity hypersonic vector (direction towards inner system)
  const dir = new THREE.Vector3(-Math.sin(angle) - 0.3, -0.2, Math.cos(angle) - 0.3).normalize();
  const speed = 25.0 + Math.random() * 20.0;
  const velocity = dir.multiplyScalar(speed);

  const maxLife = 0.6 + Math.random() * 0.8;
  const life = randomStart ? Math.random() * maxLife : 0;

  return {
    pos,
    velocity,
    length: 1.8 + Math.random() * 2.2,
    life,
    maxLife,
    color,
  };
}
