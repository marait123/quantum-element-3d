'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CELESTIAL_BODIES } from '@/data/universeData';
import {
  getCelestialWorldPosition,
  calculateFramingCameraPosition,
  calculateFramingDistance,
} from '@/lib/celestialRegistry';
import { SolarSystemScene } from './SolarSystemScene';
import { StellarNeighborhoodScene } from './StellarNeighborhoodScene';
import { MilkyWayScene } from './MilkyWayScene';
import { ExtragalacticScene } from './ExtragalacticScene';
import { CosmicWebScene } from './CosmicWebScene';

import { SpeedMultiplierWidget } from './hud/SpeedMultiplierWidget';

// Unified Free-Flight Spaceship Controls with Concurrent OrbitControls Integration
interface FreeFlightProps {
  controlsRef: React.RefObject<OrbitControlsImpl>;
  onUserFlight: () => void;
}

const FreeFlightControls: React.FC<FreeFlightProps> = ({ controlsRef, onUserFlight }) => {
  const { camera } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});
  const movementSpeedMultiplier = useQuantumStore((s) => s.movementSpeedMultiplier);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
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

    // W/S or ArrowUp/ArrowDown: Forward / Backward in camera look direction
    if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveVector.z -= 1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveVector.z += 1;

    // A/D or ArrowLeft/ArrowRight: Left / Right strafe
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveVector.x -= 1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveVector.x += 1;

    // E / R / PageUp: Ascend
    if (keysPressed.current['e'] || keysPressed.current['r'] || keysPressed.current['pageup']) moveVector.y += 1;
    // Q / F / PageDown / Space: Descend / Hover
    if (keysPressed.current['q'] || keysPressed.current['f'] || keysPressed.current['pagedown']) moveVector.y -= 1;

    if (moveVector.lengthSq() > 0) {
      onUserFlight();

      moveVector.normalize();
      moveVector.applyQuaternion(camera.quaternion);

      const isShift = keysPressed.current['shift'];
      const sprintFactor = isShift ? 3.5 : 1.0;

      // Adaptive speed scaling based on distance from center
      const currentDist = Math.max(camera.position.length(), 5);
      const adaptiveBaseSpeed = Math.min(Math.max(currentDist * 0.45, 3.5), 85000);
      const finalSpeed = adaptiveBaseSpeed * movementSpeedMultiplier * sprintFactor;

      const translation = moveVector.clone().multiplyScalar(finalSpeed * delta);
      camera.position.add(translation);

      if (controlsRef.current) {
        controlsRef.current.target.add(translation);
      }
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
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const scaleNavigationRequest = useQuantumStore((s) => s.scaleNavigationRequest);
  const continuousZoomRequest = useQuantumStore((s) => s.continuousZoomRequest);

  const prevScaleRef = useRef(cosmicScaleLevel);
  const isTweeningRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const isTrackingRef = useRef(false);
  const lastTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Real-time continuous zoom distance tracker and HUD synchronization + Live Orbit Following
  useFrame(() => {
    if (!controlsRef.current) return;

    // 1. DYNAMIC CELESTIAL FOLLOW & SEAMLESS BREAKAWAY:
    if (isTrackingRef.current && !isTweeningRef.current && selectedCosmicBodyId) {
      const currentLivePos = new THREE.Vector3();
      if (getCelestialWorldPosition(selectedCosmicBodyId, currentLivePos)) {
        const distToBody = camera.position.distanceTo(currentLivePos);
        const framingDist = calculateFramingDistance(selectedCosmicBodyId);

        // If the user zooms out far enough away from the body, gently break away into free cosmic exploration!
        if (distToBody > framingDist * 2.2) {
          isTrackingRef.current = false;
          setSelectedCosmicBodyId(null);
        } else {
          const deltaMove = currentLivePos.clone().sub(lastTargetPosRef.current);
          camera.position.add(deltaMove);
          controlsRef.current.target.copy(currentLivePos);
          lastTargetPosRef.current.copy(currentLivePos);
        }
      }
    }

    // 2. Real-time continuous zoom distance tracker and HUD synchronization
    if (isTweeningRef.current || selectedCosmicBodyId) return;

    const currentDist = camera.position.length();

    let detectedLevel: 1 | 2 | 3 | 4 | 5 = 1;
    if (currentDist < 350) {
      detectedLevel = 1;
    } else if (currentDist < 4500) {
      detectedLevel = 2;
    } else if (currentDist < 45000) {
      detectedLevel = 3;
    } else if (currentDist < 220000) {
      detectedLevel = 4;
    } else {
      detectedLevel = 5;
    }

    if (detectedLevel !== prevScaleRef.current) {
      prevScaleRef.current = detectedLevel;
      setCosmicScaleLevel(detectedLevel);
    }

    // 3. Dynamic adaptive zoom sensitivity:
    // Fluidly traverses across 5 orders of magnitude (from 1 unit at Earth to 500,000 at Cosmic Web)
    const dist = camera.position.distanceTo(controlsRef.current.target);
    const adaptiveZoom = Math.min(2.4, Math.max(1.2, 1.1 + Math.log10(Math.max(1, dist)) * 0.22));
    controlsRef.current.zoomSpeed = adaptiveZoom;
  });

  // Smooth camera glide (or instant initial snap) to selected celestial body with Sun-glare avoidance
  useEffect(() => {
    if (!selectedCosmicBodyId) {
      isTrackingRef.current = false;
      // CRITICAL: When deselected, NEVER snap the camera away! User stays exactly where they are!
      return;
    }

    const body = CELESTIAL_BODIES[selectedCosmicBodyId];
    if (!body) return;

    // Retrieve live position from registry if already rendered, else fallback to static definition
    const liveTargetPos = new THREE.Vector3();
    const hasLivePos = getCelestialWorldPosition(selectedCosmicBodyId, liveTargetPos);
    if (!hasLivePos) {
      liveTargetPos.set(...body.position);
    }

    // Calculate intelligent framing position (focusing on illuminated surface, avoiding Sun glare)
    const camPos = new THREE.Vector3();
    calculateFramingCameraPosition(selectedCosmicBodyId, liveTargetPos, camPos);

    // If initial page load/refresh with body param, snap immediately to view!
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      camera.position.copy(camPos);
      if (controlsRef.current) {
        controlsRef.current.target.copy(liveTargetPos);
        controlsRef.current.update();
      }
      lastTargetPosRef.current.copy(liveTargetPos);
      isTrackingRef.current = true;
      return;
    }

    isTweeningRef.current = true;
    isTrackingRef.current = false;
    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          const curPos = new THREE.Vector3();
          if (getCelestialWorldPosition(selectedCosmicBodyId, curPos)) {
            controlsRef.current.target.lerp(curPos, 0.2);
          } else {
            controlsRef.current.target.lerp(liveTargetPos, 0.2);
          }
          controlsRef.current.update();
        }
      },
      onComplete: () => {
        if (controlsRef.current) {
          const finalPos = new THREE.Vector3();
          if (getCelestialWorldPosition(selectedCosmicBodyId, finalPos)) {
            controlsRef.current.target.copy(finalPos);
            lastTargetPosRef.current.copy(finalPos);
          } else {
            controlsRef.current.target.copy(liveTargetPos);
            lastTargetPosRef.current.copy(liveTargetPos);
          }
          controlsRef.current.update();
        }
        isTweeningRef.current = false;
        isTrackingRef.current = true;
      },
    });
  }, [selectedCosmicBodyId, camera]);

  // Initial mount camera placement if not focusing a celestial body
  useEffect(() => {
    if (isInitialMountRef.current && !selectedCosmicBodyId) {
      isInitialMountRef.current = false;
      const scaleConfig = COSMIC_SCALES.find((s) => s.level === cosmicScaleLevel);
      if (scaleConfig) {
        camera.position.set(
          scaleConfig.cameraPosition[0],
          scaleConfig.cameraPosition[1],
          scaleConfig.cameraPosition[2]
        );
        if (controlsRef.current) {
          controlsRef.current.target.copy(new THREE.Vector3(...scaleConfig.cameraTarget));
          controlsRef.current.update();
        }
      }
    }
  }, [cosmicScaleLevel, selectedCosmicBodyId, camera]);

  // Smooth camera glide ONLY when user explicitly clicks a scale milestone in HUD dock
  useEffect(() => {
    if (!scaleNavigationRequest) return;

    isTrackingRef.current = false;
    const { level } = scaleNavigationRequest;
    const scaleConfig = COSMIC_SCALES.find((s) => s.level === level);
    if (!scaleConfig) return;

    const targetPos = new THREE.Vector3(...scaleConfig.cameraTarget);

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
  }, [scaleNavigationRequest, camera]);

  // Continuous Smooth Dolly Zoom (dock buttons +/- and continuous zoom triggers)
  useEffect(() => {
    if (!continuousZoomRequest || !controlsRef.current) return;

    const { factor } = continuousZoomRequest;
    const target = controlsRef.current.target;
    const toCam = camera.position.clone().sub(target);
    const currentDist = toCam.length();

    // Scale distance continuously along current camera view ray
    const newDist = Math.max(1.5, Math.min(1000000, currentDist * factor));
    if (Math.abs(newDist - currentDist) < 0.1) return;

    const targetPos = target.clone().add(toCam.normalize().multiplyScalar(newDist));

    isTweeningRef.current = true;
    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        controlsRef.current?.update();
      },
      onComplete: () => {
        controlsRef.current?.update();
        isTweeningRef.current = false;
      },
    });
  }, [continuousZoomRequest, camera]);

  const handleUserFlight = () => {
    if (isTrackingRef.current || selectedCosmicBodyId) {
      isTrackingRef.current = false;
      setSelectedCosmicBodyId(null);
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.85}
        zoomSpeed={1.3}
        panSpeed={1.1}
        minDistance={0.8}
        maxDistance={1200000}
        enablePan={true}
        enableZoom={true}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <FreeFlightControls controlsRef={controlsRef} onUserFlight={handleUserFlight} />
    </>
  );
};

export const UniverseCanvasContainer: React.FC = () => {
  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#020617]">
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

      {/* On-Screen Speed Multiplier Controller */}
      <SpeedMultiplierWidget />
    </div>
  );
};
