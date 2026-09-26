'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CELESTIAL_BODIES } from '@/data/universeData';
import { SolarSystemScene } from './SolarSystemScene';
import { StellarNeighborhoodScene } from './StellarNeighborhoodScene';
import { MilkyWayScene } from './MilkyWayScene';
import { ExtragalacticScene } from './ExtragalacticScene';
import { CosmicWebScene } from './CosmicWebScene';

// Free-Flight / First-Person Spaceship Walk-Around Controls
const FreeFlightControls: React.FC = () => {
  const { camera } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});
  const moveSpeed = 22.0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const moveVector = new THREE.Vector3();

    // W/S: Forward / Backward
    if (keysPressed.current['w']) moveVector.z -= 1;
    if (keysPressed.current['s']) moveVector.z += 1;

    // A/D: Left / Right
    if (keysPressed.current['a']) moveVector.x -= 1;
    if (keysPressed.current['d']) moveVector.x += 1;

    // Q/E or Space/Shift: Down / Up
    if (keysPressed.current['e'] || keysPressed.current[' ']) moveVector.y += 1;
    if (keysPressed.current['q'] || keysPressed.current['shift']) moveVector.y -= 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(moveVector, moveSpeed * delta);
    }
  });

  return null;
};

// Universe Camera and Target Transition Manager
const UniverseCameraManager: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const navigationMode = useQuantumStore((s) => s.navigationMode);

  // Transition to selected body or scale center
  useEffect(() => {
    if (navigationMode === 'fly') return;

    gsap.killTweensOf(camera.position);

    // If a celestial body is selected, fly the camera to focus on it
    if (selectedCosmicBodyId && CELESTIAL_BODIES[selectedCosmicBodyId]) {
      const body = CELESTIAL_BODIES[selectedCosmicBodyId];
      const targetPos = new THREE.Vector3(...body.position);
      const offsetDist = Math.max(body.size * 2.8, 4.5);
      const camPos = new THREE.Vector3(
        body.position[0] + offsetDist * 0.7,
        body.position[1] + offsetDist * 0.5,
        body.position[2] + offsetDist
      );

      gsap.to(camera.position, {
        x: camPos.x,
        y: camPos.y,
        z: camPos.z,
        duration: 1.4,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.copy(targetPos);
            controlsRef.current.update();
          }
        },
      });
      return;
    }

    // Default: fly to current cosmic scale overview
    const scaleConfig = COSMIC_SCALES.find((s) => s.level === cosmicScaleLevel);
    if (!scaleConfig) return;

    gsap.to(camera.position, {
      x: scaleConfig.cameraPosition[0],
      y: scaleConfig.cameraPosition[1],
      z: scaleConfig.cameraPosition[2],
      duration: 1.3,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.set(
            scaleConfig.cameraTarget[0],
            scaleConfig.cameraTarget[1],
            scaleConfig.cameraTarget[2]
          );
          controlsRef.current.update();
        }
      },
    });
  }, [cosmicScaleLevel, selectedCosmicBodyId, navigationMode, camera]);

  return (
    <>
      {navigationMode === 'orbit' ? (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.8}
          zoomSpeed={1.0}
          minDistance={3.0}
          maxDistance={180}
        />
      ) : (
        <>
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            enableZoom={false}
            enablePan={false}
          />
          <FreeFlightControls />
        </>
      )}
    </>
  );
};

export const UniverseCanvasContainer: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);

  return (
    <div
      className="w-full h-full relative select-none overflow-hidden bg-[#020617]"
      onPointerDown={(e) => {
        // Deselect if clicking on empty space
        if (e.target === e.currentTarget) {
          setSelectedCosmicBodyId(null);
        }
      }}
    >
      <Canvas
        camera={{
          position: [0, 42, 65],
          fov: 48,
          near: 0.1,
          far: 2000,
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
      >
        {/* Deep Space Background Stars */}
        <color attach="background" args={['#020617']} />
        <Stars radius={180} depth={90} count={7000} factor={4} saturation={0.5} fade speed={1.2} />

        {/* Global Space Ambient Light */}
        <ambientLight intensity={0.25} />

        {/* Camera and Navigation Controller */}
        <UniverseCameraManager />

        {/* Conditionally Render Active Cosmic Scale Scene */}
        {cosmicScaleLevel === 1 && <SolarSystemScene />}
        {cosmicScaleLevel === 2 && <StellarNeighborhoodScene />}
        {cosmicScaleLevel === 3 && <MilkyWayScene />}
        {cosmicScaleLevel === 4 && <ExtragalacticScene />}
        {cosmicScaleLevel === 5 && <CosmicWebScene />}
      </Canvas>
    </div>
  );
};
