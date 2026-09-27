'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  GalacticDiskShader,
  RelativisticAGNJetShader,
  M82SuperwindShader,
} from './shaders/galaxyShaders';

export type GalaxyMorphology =
  | 'spiral'
  | 'flocculent'
  | 'dwarf_irregular'
  | 'active_elliptical'
  | 'starburst';

interface RealisticGalaxyProps {
  body: CelestialBody;
  morphology: GalaxyMorphology;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon?: string;
  badgeLabel?: string;
  glowTexture?: THREE.CanvasTexture;
}

export const RealisticGalaxy: React.FC<RealisticGalaxyProps> = ({
  body,
  morphology,
  isSelected,
  onSelect,
  language,
  icon = '🌀',
  badgeLabel,
  glowTexture,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const diskMeshRef = useRef<THREE.Mesh>(null);
  const jetMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Procedural uniform parameters based on morphology
  const diskUniforms = useMemo(() => {
    let arms = 2.0;
    let pitch = 0.22; // ~13 degrees (Sb spiral)
    let armWidth = 0.24;
    let bulgeRadius = 0.18;
    let dustStrength = 0.85;
    let h2Abundance = 0.9;
    let coreColor = new THREE.Color('#fef08a');
    let armColor = new THREE.Color('#60a5fa');
    let h2Color = new THREE.Color('#f43f5e');
    let dustColor = new THREE.Color('#0f172a');

    if (morphology === 'flocculent') {
      arms = 3.0;
      pitch = 0.38; // ~22 degrees (loose Sc spiral)
      armWidth = 0.32;
      bulgeRadius = 0.08;
      dustStrength = 0.55;
      h2Abundance = 1.35;
      coreColor = new THREE.Color('#e9d5ff');
      armColor = new THREE.Color('#a78bfa');
      h2Color = new THREE.Color('#2dd4bf'); // NGC 604 turquoise
    } else if (morphology === 'dwarf_irregular') {
      arms = 1.0;
      pitch = 0.45;
      armWidth = 0.55;
      bulgeRadius = 0.12;
      dustStrength = 0.4;
      h2Abundance = 1.6;
      coreColor = new THREE.Color('#fed7aa');
      armColor = new THREE.Color('#38bdf8');
      h2Color = new THREE.Color('#fb7185');
    } else if (morphology === 'active_elliptical') {
      arms = 1.0;
      pitch = 0.01;
      armWidth = 0.8;
      bulgeRadius = 0.65;
      dustStrength = 1.2; // Warped dust belt
      h2Abundance = 0.2;
      coreColor = new THREE.Color('#ffedd5');
      armColor = new THREE.Color('#fcd34d');
      dustColor = new THREE.Color('#020617');
    } else if (morphology === 'starburst') {
      arms = 2.0;
      pitch = 0.15;
      armWidth = 0.35;
      bulgeRadius = 0.25;
      dustStrength = 0.95;
      h2Abundance = 2.0;
      coreColor = new THREE.Color('#fee2e2');
      armColor = new THREE.Color('#fbbf24');
      h2Color = new THREE.Color('#ef4444');
    }

    return {
      uTime: { value: 0 },
      uCoreColor: { value: coreColor },
      uArmColor: { value: armColor },
      uH2Color: { value: h2Color },
      uDustColor: { value: dustColor },
      uArms: { value: arms },
      uPitchAngle: { value: pitch },
      uArmWidth: { value: armWidth },
      uBulgeRadius: { value: bulgeRadius },
      uDiskRadius: { value: body.size },
      uDustStrength: { value: dustStrength },
      uH2Abundance: { value: h2Abundance },
    };
  }, [morphology, body.size]);

  // Relativistic Jet Uniforms (for Centaurus A)
  const jetUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uJetColor: { value: new THREE.Color('#38bdf8') },
      uKnotColor: { value: new THREE.Color('#ffffff') },
      uJetSpeed: { value: 1.8 },
    };
  }, []);

  // Superwind Uniforms (for M82)
  const superwindUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uPlumeColor: { value: new THREE.Color('#ef4444') },
      uTurbulence: { value: 1.4 },
    };
  }, []);

  // Dense foreground/background stellar halo particles
  const [haloPositions, haloColors] = useMemo(() => {
    const count = morphology === 'dwarf_irregular' ? 2500 : 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.5) * body.size * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * (morphology === 'active_elliptical' ? 0.8 : 0.25);

      pos[i3] = Math.cos(theta) * Math.cos(phi) * r;
      pos[i3 + 1] = Math.sin(phi) * r * (morphology === 'active_elliptical' ? 0.7 : 0.12);
      pos[i3 + 2] = Math.sin(theta) * Math.cos(phi) * r;

      const c = new THREE.Color();
      if (r < body.size * 0.25) {
        c.set('#fef08a');
      } else if (Math.random() < 0.2) {
        c.set('#f43f5e'); // H II knot
      } else {
        c.set('#93c5fd'); // OB star
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size, morphology]);

  useFrame((_, delta) => {
    if (rootRef.current) {
      rootRef.current.rotation.y += delta * (body.rotationSpeed || 0.003);
    }
    diskUniforms.uTime.value += delta;
    jetUniforms.uTime.value += delta;
    superwindUniforms.uTime.value += delta;
  });

  // Galaxy inclination angles
  const diskRotation: [number, number, number] = useMemo(() => {
    if (body.id === 'andromeda_galaxy') return [Math.PI * 0.38, 0, Math.PI * 0.15];
    if (body.id === 'triangulum_galaxy') return [-Math.PI * 0.28, 0, Math.PI * 0.3];
    if (body.id === 'large_magellanic_cloud') return [Math.PI * 0.2, 0, -Math.PI * 0.25];
    if (body.id === 'small_magellanic_cloud') return [-Math.PI * 0.25, 0, Math.PI * 0.15];
    if (body.id === 'centaurus_a') return [Math.PI * 0.18, 0, -Math.PI * 0.35];
    if (body.id === 'messier_82') return [Math.PI * 0.48, 0, Math.PI * 0.12]; // Almost edge-on
    return [Math.PI * 0.3, 0, 0];
  }, [body.id]);

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
      {/* Central Ambient Core Light */}
      <pointLight color={body.color} intensity={4.5} distance={body.size * 3.5} />

      {/* Galactic Orientation Container */}
      <group rotation={diskRotation}>
        {/* 1. Procedural Logarithmic Density Wave Spiral Disk */}
        <mesh ref={diskMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[body.size * 2, body.size * 2, 64, 64]} />
          <shaderMaterial
            vertexShader={GalacticDiskShader.vertexShader}
            fragmentShader={GalacticDiskShader.fragmentShader}
            uniforms={diskUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
          />
        </mesh>

        {/* 2. Volumetric Bulge Sphere */}
        <mesh>
          <sphereGeometry args={[body.size * 0.15, 24, 24]} />
          <meshBasicMaterial
            color={morphology === 'active_elliptical' ? '#ffedd5' : '#fef08a'}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* 3. Star Cluster Particle Cloud */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[haloPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[haloColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={body.size * 0.014}
            map={glowTexture}
            vertexColors
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>

        {/* 4. Active Galactic Nucleus Relativistic Jets (Centaurus A) */}
        {morphology === 'active_elliptical' && (
          <group>
            {/* North Relativistic Jet */}
            <mesh position={[0, body.size * 1.6, 0]} rotation={[0, 0, 0]}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* South Relativistic Jet */}
            <mesh position={[0, -body.size * 1.6, 0]} rotation={[Math.PI, 0, 0]}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )}

        {/* 5. Explosive Bipolar Superwind Chimneys (Messier 82) */}
        {morphology === 'starburst' && (
          <group>
            {/* Upper Venting Superwind */}
            <mesh position={[0, body.size * 0.75, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[body.size * 0.65, body.size * 1.5, 32, 1, true]} />
              <shaderMaterial
                vertexShader={M82SuperwindShader.vertexShader}
                fragmentShader={M82SuperwindShader.fragmentShader}
                uniforms={superwindUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Lower Venting Superwind */}
            <mesh position={[0, -body.size * 0.75, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[body.size * 0.65, body.size * 1.5, 32, 1, true]} />
              <shaderMaterial
                vertexShader={M82SuperwindShader.vertexShader}
                fragmentShader={M82SuperwindShader.fragmentShader}
                uniforms={superwindUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )}

        {/* 6. Andromeda Satellite Dwarf Galaxies: M32 & M110 (NGC 205) */}
        {body.id === 'andromeda_galaxy' && (
          <group>
            {/* M32: Compact high-density dwarf elliptical */}
            <group position={[body.size * 0.42, body.size * 0.12, body.size * 0.35]}>
              <mesh>
                <sphereGeometry args={[body.size * 0.05, 16, 16]} />
                <meshBasicMaterial color="#fef08a" transparent opacity={0.85} />
              </mesh>
              <points>
                <sphereGeometry args={[body.size * 0.09, 12, 12]} />
                <pointsMaterial size={body.size * 0.01} color="#fef08a" transparent opacity={0.6} />
              </points>
            </group>
            {/* M110 (NGC 205): Elongated dwarf spheroidal */}
            <group position={[-body.size * 0.58, -body.size * 0.18, -body.size * 0.48]}>
              <mesh scale={[1.4, 0.8, 1.0]}>
                <sphereGeometry args={[body.size * 0.065, 16, 16]} />
                <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} />
              </mesh>
            </group>
          </group>
        )}
      </group>

      {/* Interactive Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.15, body.size * 1.25, 48]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Interactive HUD Hover Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.55, 0]} center distanceFactor={body.size * 4.5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-blue-400 text-xs font-black text-blue-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>{icon}</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            {badgeLabel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                {badgeLabel}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
