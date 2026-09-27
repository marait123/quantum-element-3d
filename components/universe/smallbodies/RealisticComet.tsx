'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  CometComaVertexShader,
  CometComaFragmentShader,
  CometTailVertexShader,
  CometTailFragmentShader,
} from './shaders/cometShaders';

interface RealisticCometProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

export const RealisticComet: React.FC<RealisticCometProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const comaMatRef = useRef<THREE.ShaderMaterial>(null);
  const ionTailMatRef = useRef<THREE.ShaderMaterial>(null);
  const dustTailMatRef = useRef<THREE.ShaderMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const isOumuamua = body.id === 'oumuamua';
  const orbitAngleRef = useRef<number>(Math.random() * Math.PI * 2);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const comaUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uComaColor: {
        value: isOumuamua ? new THREE.Color('#b45309') : new THREE.Color('#38bdf8'),
      },
      uSublimationIntensity: { value: 1.0 },
    }),
    [isOumuamua]
  );

  const ionTailUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTailColor: { value: new THREE.Color('#0284c7') }, // Fluorescent electric blue CO+
      uTailType: { value: 0.0 },                        // Ion tail
      uLengthFalloff: { value: 1.0 },
    }),
    []
  );

  const dustTailUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTailColor: { value: new THREE.Color('#f59e0b') }, // Golden solar dust
      uTailType: { value: 1.0 },                        // Dust tail
      uLengthFalloff: { value: 0.85 },
    }),
    []
  );

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    if (comaMatRef.current) comaMatRef.current.uniforms.uTime.value = t;
    if (ionTailMatRef.current) ionTailMatRef.current.uniforms.uTime.value = t;
    if (dustTailMatRef.current) dustTailMatRef.current.uniforms.uTime.value = t;

    // Orbital dynamics
    if (rootRef.current) {
      if (!isOumuamua) {
        // Halley's Comet: Highly eccentric orbit (e ~ 0.75) around Sun at [0,0,0]
        orbitAngleRef.current += (body.orbitalSpeed || 0.035) * delta * 0.8;
        const a = body.orbitalRadius || 21.0;
        const e = 0.65;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(orbitAngleRef.current));

        const x = Math.cos(orbitAngleRef.current) * r;
        const z = Math.sin(orbitAngleRef.current) * r;
        const y = Math.sin(orbitAngleRef.current * 0.8) * 4.0; // 18 degree inclination
        rootRef.current.position.set(x, y, z);

        // Sun vector points away from origin (Sun is at 0,0,0)
        const sunDir = new THREE.Vector3(x, y, z).normalize();
        if (tailGroupRef.current) {
          // Orient tail directly away from the Sun
          tailGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), sunDir);
        }

        // Sublimation increases closer to perihelion
        const distToSun = Math.max(r, 6.0);
        const subInt = clampVal((18.0 / distToSun) * 1.2, 0.4, 1.8);
        if (comaMatRef.current) comaMatRef.current.uniforms.uSublimationIntensity.value = subInt;
      } else {
        // 'Oumuamua: Hyperbolic passage through inner system
        const oumuamuaX = 12.0 + Math.sin(t * 0.02) * 5.0;
        const oumuamuaY = 7.5 + Math.cos(t * 0.015) * 2.0;
        const oumuamuaZ = 9.0 - (t * 0.5) % 30.0;
        rootRef.current.position.set(oumuamuaX, oumuamuaY, oumuamuaZ);

        if (tailGroupRef.current) {
          const sunDir = new THREE.Vector3(oumuamuaX, oumuamuaY, oumuamuaZ).normalize();
          tailGroupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), sunDir);
        }
      }
    }

    // Nucleus tumbling
    if (nucleusRef.current) {
      nucleusRef.current.rotation.x += delta * (body.rotationSpeed || 0.05);
      nucleusRef.current.rotation.y += delta * (body.rotationSpeed || 0.05) * 1.5;
    }
  });

  return (
    <group
      ref={rootRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Nucleus (Irregular stony/icy body) */}
      <mesh ref={nucleusRef}>
        {isOumuamua ? (
          // Extreme 10:1 elongation cigar shape
          <cylinderGeometry args={[body.size * 0.12, body.size * 0.12, body.size * 1.8, 12]} />
        ) : (
          // Irregular peanut / potato nucleus
          <dodecahedronGeometry args={[body.size * 0.28, 1]} />
        )}
        <meshStandardMaterial
          color={isOumuamua ? '#78350f' : '#334155'}
          roughness={0.95}
        />
      </mesh>

      {/* 2. Sublimating Gas Coma Sphere */}
      <mesh>
        <sphereGeometry args={[body.size * (isOumuamua ? 0.6 : 1.3), 32, 32]} />
        <shaderMaterial
          ref={comaMatRef}
          vertexShader={CometComaVertexShader}
          fragmentShader={CometComaFragmentShader}
          uniforms={comaUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Dual Tails System (Oriented away from the Sun) */}
      <group ref={tailGroupRef}>
        {/* Type I Ion (Plasma) Tail: Narrow, straight, long electric blue */}
        <mesh position={[body.size * 6.0, 0, 0]}>
          <planeGeometry args={[body.size * 12.0, body.size * 0.9]} />
          <shaderMaterial
            ref={ionTailMatRef}
            vertexShader={CometTailVertexShader}
            fragmentShader={CometTailFragmentShader}
            uniforms={ionTailUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Type II Dust Tail: Broad, curved, golden amber dust */}
        <mesh position={[body.size * 4.8, 0, body.size * 0.8]} rotation={[0, -0.22, 0]}>
          <planeGeometry args={[body.size * 9.5, body.size * 2.2]} />
          <shaderMaterial
            ref={dustTailMatRef}
            vertexShader={CometTailVertexShader}
            fragmentShader={CometTailFragmentShader}
            uniforms={dustTailUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.5, body.size * 1.7, 32]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size * 1.6 + 1.5, 0]} center distanceFactor={body.size * 15}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

function clampVal(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}
