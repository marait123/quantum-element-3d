'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import {
  calculateStandingWavePoint,
  calculateGravitonLoopPoints,
  generateCalabiYauPoints,
} from '@/lib/mathUtils';

export const StringScene: React.FC = () => {
  const mode = useQuantumStore((s) => s.stringHarmonicMode);

  const calabiYauMeshRef = useRef<THREE.Points>(null);
  const braneLeftRef = useRef<THREE.Mesh>(null);
  const braneRightRef = useRef<THREE.Mesh>(null);

  const numPoints = 180;
  const stringLength = 9.0;

  // Color mapping based on harmonic mode
  const modeColors: Record<number, { core: string; glow: string; name: string }> = {
    1: { core: '#facc15', glow: '#ca8a04', name: 'Electron' },
    2: { core: '#ef4444', glow: '#b91c1c', name: 'Quark' },
    3: { core: '#38bdf8', glow: '#0284c7', name: 'Gauge Photon' },
    4: { core: '#c084fc', glow: '#7e22ce', name: 'Graviton' },
  };

  const currentColor = modeColors[mode] || modeColors[1];

  // Static initial buffers
  const initialPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * stringLength - stringLength / 2;
      pts.push(new THREE.Vector3(x, 0, 0));
    }
    return pts;
  }, [numPoints, stringLength]);

  const openStringGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(initialPoints);
  }, [initialPoints]);

  const openStringGlowGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(initialPoints);
  }, [initialPoints]);

  const openStringLineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#ffffff',
      linewidth: 3,
    });
    return new THREE.Line(openStringGeo, mat);
  }, [openStringGeo]);

  const openStringGlowObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: currentColor.core,
      linewidth: 6,
      transparent: true,
      opacity: 0.8,
    });
    return new THREE.Line(openStringGlowGeo, mat);
  }, [openStringGlowGeo, currentColor.core]);

  const gravitonGeo = useMemo(() => {
    const pts = calculateGravitonLoopPoints(128, 2.5, 0, 0);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const gravitonLoopObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#e879f9',
      linewidth: 4,
    });
    return new THREE.Line(gravitonGeo, mat);
  }, [gravitonGeo]);

  // 6D Calabi-Yau 3-Fold Point Cloud Geometry
  const calabiYauGeo = useMemo(() => {
    const pts = generateCalabiYauPoints(36, 36, 3.4, 0.35);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);

    // Color gradient based on coordinates to represent multi-dimensional projection
    const colors = new Float32Array(pts.length * 3);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      colors[i * 3] = 0.2 + Math.abs(p.x) * 0.2; // R
      colors[i * 3 + 1] = 0.5 + Math.abs(p.y) * 0.15; // G
      colors[i * 3 + 2] = 0.9; // B
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // 1. Animate Open String Standing Wave (Modes 1, 2, 3)
    if (mode !== 4 && openStringLineObj && openStringGlowObj) {
      const linePosAttr = openStringLineObj.geometry.attributes.position;
      const glowPosAttr = openStringGlowObj.geometry.attributes.position;

      for (let i = 0; i <= numPoints; i++) {
        const x = (i / numPoints) * stringLength - stringLength / 2;
        const y = calculateStandingWavePoint(x, time, mode, stringLength, 1.4);
        // Transverse oscillation in Z for Mode 3 (Photon polarization)
        const z = mode === 3 ? 0.8 * Math.cos(mode * 2.8 * time + x) : 0;

        linePosAttr.setXYZ(i, x, y, z);
        glowPosAttr.setXYZ(i, x, y, z);
      }

      linePosAttr.needsUpdate = true;
      glowPosAttr.needsUpdate = true;
    }

    // 2. Animate Closed String Graviton Loop (Mode 4)
    if (mode === 4 && gravitonLoopObj) {
      // Quadrupolar spin-2 oscillation leaking into the extra-dimensional bulk (Y axis drift)
      const leakHeight = Math.sin(time * 1.5) * 1.8;
      const pts = calculateGravitonLoopPoints(128, 2.4, time, leakHeight);
      gravitonLoopObj.geometry.setFromPoints(pts);
    }

    // 3. Rotate 6D Calabi-Yau projection slowly in 3D immersion
    if (calabiYauMeshRef.current) {
      calabiYauMeshRef.current.rotation.x = time * 0.12;
      calabiYauMeshRef.current.rotation.y = time * 0.18;
      calabiYauMeshRef.current.rotation.z = Math.sin(time * 0.2) * 0.15;
    }

    // 4. Subtle D-Brane boundary vibrations
    if (braneLeftRef.current && braneRightRef.current) {
      const wave = Math.sin(time * 3) * 0.04;
      braneLeftRef.current.position.x = -stringLength / 2 + wave;
      braneRightRef.current.position.x = stringLength / 2 - wave;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 6D Calabi-Yau Manifold Projection (Translucent complex geometry in background) */}
      <points ref={calabiYauMeshRef} geometry={calabiYauGeo}>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.38}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* D-Brane Boundary Sheets (Where open strings are anchored) */}
      {mode !== 4 && (
        <>
          {/* Left D-Brane Sheet */}
          <mesh
            ref={braneLeftRef}
            position={[-stringLength / 2, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[6.5, 6.5]} />
            <meshStandardMaterial
              color="#06b6d4"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              wireframe={false}
            />
          </mesh>
          <mesh
            position={[-stringLength / 2, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[6.5, 6.5]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.18}
            />
          </mesh>

          {/* Right D-Brane Sheet */}
          <mesh
            ref={braneRightRef}
            position={[stringLength / 2, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[6.5, 6.5]} />
            <meshStandardMaterial
              color="#06b6d4"
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              wireframe={false}
            />
          </mesh>
          <mesh
            position={[stringLength / 2, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[6.5, 6.5]} />
            <meshBasicMaterial
              color="#38bdf8"
              wireframe
              transparent
              opacity={0.18}
            />
          </mesh>
        </>
      )}

      {/* Mode 1, 2, 3: Open 1D Vibrating Planck String */}
      {mode !== 4 && (
        <group>
          {/* Core high-intensity neon string line */}
          <primitive object={openStringLineObj} />

          {/* Outer glowing halo line */}
          <primitive object={openStringGlowObj} />

          {/* String endpoint anchor sparks on D-Branes */}
          <mesh position={[-stringLength / 2, 0, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
            <pointLight color="#06b6d4" intensity={2} distance={3} />
          </mesh>

          <mesh position={[stringLength / 2, 0, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
            <pointLight color="#06b6d4" intensity={2} distance={3} />
          </mesh>
        </group>
      )}

      {/* Mode 4: Closed Graviton Loop executing Quadrupolar Oscillation */}
      {mode === 4 && (
        <group>
          <primitive object={gravitonLoopObj} />
          <pointLight color="#c084fc" intensity={3} distance={8} />
        </group>
      )}

      {/* Calabi-Yau ambient lighting */}
      <ambientLight intensity={0.5} />
      <pointLight color="#38bdf8" intensity={1.8} position={[0, 4, 4]} />
      <pointLight color="#a855f7" intensity={1.8} position={[0, -4, -4]} />
    </group>
  );
};
