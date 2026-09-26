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

// Free-Flight / First-Person Spaceship Walk-Around Controls with Dynamic Speed Scaling
const FreeFlightControls: React.FC = () => {
  const { camera } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});

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

      // Adaptive speed scaling based on distance from center
      const currentDist = Math.max(camera.position.length(), 5);
      const adaptiveSpeed = Math.min(Math.max(currentDist * 0.45, 2.5), 65000);

      camera.position.addScaledVector(moveVector, adaptiveSpeed * delta);
    }
  });

  return null;
};

// Universe Camera and Target Transition Manager
const UniverseCameraManager: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const setCosmicScaleLevel = useQuantumStore((s) => s.setCosmicScaleLevel);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const navigationMode = useQuantumStore((s) => s.navigationMode);

  const prevScaleRef = useRef(cosmicScaleLevel);
  const isTweeningRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Real-time continuous zoom distance tracker and HUD synchronization
  useFrame(() => {
    if (isTweeningRef.current || !controlsRef.current) return;

    const currentDist = camera.position.distanceTo(controlsRef.current.target);

    let detectedLevel: 1 | 2 | 3 | 4 | 5 = 1;
    if (currentDist < 350) {
      detectedLevel = 1; // Solar System
    } else if (currentDist < 4500) {
      detectedLevel = 2; // Stellar Neighborhood
    } else if (currentDist < 45000) {
      detectedLevel = 3; // Milky Way
    } else if (currentDist < 220000) {
      detectedLevel = 4; // Extragalactic
    } else {
      detectedLevel = 5; // Cosmic Web
    }

    if (detectedLevel !== prevScaleRef.current) {
      prevScaleRef.current = detectedLevel;
      setCosmicScaleLevel(detectedLevel);
    }
  });

  // Smooth camera glide (or instant initial snap) to selected celestial body
  useEffect(() => {
    if (navigationMode === 'fly' || !selectedCosmicBodyId) return;

    const body = CELESTIAL_BODIES[selectedCosmicBodyId];
    if (!body) return;

    const targetPos = new THREE.Vector3(...body.position);
    const offsetDist = Math.max(body.size * 2.8, 4.0);
    const camPos = new THREE.Vector3(
      body.position[0] + offsetDist * 0.7,
      body.position[1] + offsetDist * 0.45,
      body.position[2] + offsetDist
    );

    // If initial page load/refresh with body param, snap immediately to view!
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      camera.position.copy(camPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetPos);
        controlsRef.current.update();
      }
      return;
    }

    isTweeningRef.current = true;
    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetPos, 0.15);
          controlsRef.current.update();
        }
      },
      onComplete: () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetPos);
          controlsRef.current.update();
        }
        isTweeningRef.current = false;
      },
    });
  }, [selectedCosmicBodyId, navigationMode, camera]);

  // Smooth camera glide (or instant initial snap) when clicking scale milestone in HUD dock
  useEffect(() => {
    if (navigationMode === 'fly' || selectedCosmicBodyId) return;

    const scaleConfig = COSMIC_SCALES.find((s) => s.level === cosmicScaleLevel);
    if (!scaleConfig) return;

    const targetPos = new THREE.Vector3(...scaleConfig.cameraTarget);

    // If initial page load/refresh with scale param, snap directly!
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      camera.position.set(
        scaleConfig.cameraPosition[0],
        scaleConfig.cameraPosition[1],
        scaleConfig.cameraPosition[2]
      );
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetPos);
        controlsRef.current.update();
      }
      return;
    }

    isTweeningRef.current = true;
    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: scaleConfig.cameraPosition[0],
      y: scaleConfig.cameraPosition[1],
      z: scaleConfig.cameraPosition[2],
      duration: 1.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetPos, 0.12);
          controlsRef.current.update();
        }
      },
      onComplete: () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetPos);
          controlsRef.current.update();
        }
        isTweeningRef.current = false;
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
          zoomSpeed={1.2}
          minDistance={1.2}
          maxDistance={900000}
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
          position: [0, 50, 75],
          fov: 48,
          near: 0.05,
          far: 2500000,
        }}
        gl={{
          logarithmicDepthBuffer: true,
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
      >
        {/* Deep Space Background Stars */}
        <color attach="background" args={['#020617']} />
        <Stars radius={250000} depth={100000} count={9000} factor={6} saturation={0.5} fade speed={1.0} />

        {/* Global Space Ambient Light */}
        <ambientLight intensity={0.35} />

        {/* Camera and Navigation Controller */}
        <UniverseCameraManager />

        {/* All Scales Mounted Simultaneously in Unified Continuous Coordinate Space */}
        <SolarSystemScene />
        <StellarNeighborhoodScene />
        <MilkyWayScene />
        <ExtragalacticScene />
        <CosmicWebScene />
      </Canvas>
    </div>
  );
};
