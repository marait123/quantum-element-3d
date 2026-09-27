'use client';

import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CELESTIAL_BODIES, CosmicScaleLevel } from '@/data/universeData';
import {
  getCelestialWorldPosition,
  calculateFramingCameraPosition,
  calculateFramingDistance,
} from '@/lib/celestialRegistry';

// Lazy-loaded 3D Cosmic Scale Scenes (loaded asynchronously into WebGL)
const SolarSystemScene = React.lazy(() =>
  import('./SolarSystemScene').then((m) => ({ default: m.SolarSystemScene }))
);
const StellarNeighborhoodScene = React.lazy(() =>
  import('./StellarNeighborhoodScene').then((m) => ({ default: m.StellarNeighborhoodScene }))
);
const MilkyWayScene = React.lazy(() =>
  import('./MilkyWayScene').then((m) => ({ default: m.MilkyWayScene }))
);
const ExtragalacticScene = React.lazy(() =>
  import('./ExtragalacticScene').then((m) => ({ default: m.ExtragalacticScene }))
);
const CosmicWebScene = React.lazy(() =>
  import('./CosmicWebScene').then((m) => ({ default: m.CosmicWebScene }))
);

import { SpeedMultiplierWidget } from './hud/SpeedMultiplierWidget';
import { ConstellationOverlay } from './constellations/ConstellationOverlay';
import { ConstellationInspectorTooltip } from './hud/ConstellationInspectorTooltip';

// Unified Free-Flight Spaceship Controls with In-Place Look-Around & OrbitControls Integration
// Module-level static scratch objects to eliminate per-frame GC allocations during navigation
const _scratchVecA = new THREE.Vector3();
const _scratchVecB = new THREE.Vector3();
const _scratchVecC = new THREE.Vector3();
const _scratchEuler = new THREE.Euler(0, 0, 0, 'YXZ');

interface FreeFlightProps {
  controlsRef: React.RefObject<OrbitControlsImpl>;
  isTweeningRef: React.RefObject<boolean>;
  onUserFlight: () => void;
}

const FreeFlightControls: React.FC<FreeFlightProps> = ({ controlsRef, isTweeningRef, onUserFlight }) => {
  const { camera, gl } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});
  const isDraggingRef = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const movementSpeedMultiplier = useQuantumStore((s) => s.movementSpeedMultiplier);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);

  // Keyboard navigation & flight controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      // Prevent browser default page scroll when Space is pressed in the 3D viewport
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        onUserFlight();
        return;
      }
      keysPressed.current[e.key.toLowerCase()] = true;
      keysPressed.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      keysPressed.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onUserFlight]);

  // Pointer drag for in-place first-person look-around (yaw and pitch)
  // Camera position remains stationary (Delta P = 0), rotating strictly around its own optical center.
  useEffect(() => {
    const canvasElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      // Don't intercept if an object is selected or tweening; OrbitControls will handle object-centric orbiting
      if (useQuantumStore.getState().selectedCosmicBodyId || isTweeningRef.current) return;
      if (e.button !== 0 && e.button !== 2 && e.pointerType === 'mouse') return;
      if (e.pointerType === 'touch' && !e.isPrimary) return;

      isDraggingRef.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      canvasElement.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      if (useQuantumStore.getState().selectedCosmicBodyId || isTweeningRef.current) {
        isDraggingRef.current = false;
        canvasElement.style.cursor = 'default';
        return;
      }

      const deltaX = e.clientX - lastPointerPos.current.x;
      const deltaY = e.clientY - lastPointerPos.current.y;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      if (deltaX === 0 && deltaY === 0) return;

      // First-person gimbal yaw and pitch without camera translation (Delta P = 0)
      _scratchEuler.set(0, 0, 0, 'YXZ');
      _scratchEuler.setFromQuaternion(camera.quaternion);

      const lookSensitivity = 0.0022;
      _scratchEuler.y -= deltaX * lookSensitivity;
      _scratchEuler.x -= deltaY * lookSensitivity;

      // Clamp vertical pitch between -87.3 deg and +87.3 deg to avoid upside-down gimbal flip
      const maxPitch = Math.PI * 0.485;
      _scratchEuler.x = Math.max(-maxPitch, Math.min(maxPitch, _scratchEuler.x));

      camera.quaternion.setFromEuler(_scratchEuler);

      // Keep OrbitControls target aligned directly along the camera's gaze direction
      if (controlsRef.current) {
        _scratchVecA.set(0, 0, -1).applyQuaternion(camera.quaternion);
        controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecA, 50.0);
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        canvasElement.style.cursor = 'default';
      }
    };

    canvasElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvasElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      canvasElement.style.cursor = 'default';
    };
  }, [gl, camera, controlsRef, isTweeningRef]);

  // Mouse wheel forward/backward cruise navigation in free space
  useEffect(() => {
    const canvasElement = gl.domElement;

    const handleWheel = (e: WheelEvent) => {
      // In object inspection mode, OrbitControls handles distance zooming
      if (useQuantumStore.getState().selectedCosmicBodyId || isTweeningRef.current) return;

      // In free space, cruise forward or backward along current gaze vector
      _scratchVecA.set(0, 0, -1).applyQuaternion(camera.quaternion);
      const currentDist = Math.max(camera.position.length(), 5);
      const adaptiveBaseSpeed = Math.min(Math.max(currentDist * 0.12, 1.8), 25000);
      const scrollStep = -Math.sign(e.deltaY) * adaptiveBaseSpeed * movementSpeedMultiplier * 1.5;

      camera.position.addScaledVector(_scratchVecA, scrollStep);

      if (controlsRef.current) {
        controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecA, 50.0);
      }
    };

    canvasElement.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      canvasElement.removeEventListener('wheel', handleWheel);
    };
  }, [gl, camera, controlsRef, isTweeningRef, movementSpeedMultiplier]);

  useFrame((_, delta) => {
    const isShift = Boolean(keysPressed.current['shift']);
    const sprintFactor = isShift ? 3.5 : 1.0;

    const isElevateUp = Boolean(
      keysPressed.current[' '] ||
      keysPressed.current['space'] ||
      keysPressed.current['e'] ||
      keysPressed.current['r'] ||
      keysPressed.current['pageup']
    );

    const isElevateDown = Boolean(
      keysPressed.current['c'] ||
      keysPressed.current['control'] ||
      keysPressed.current['q'] ||
      keysPressed.current['f'] ||
      keysPressed.current['pagedown']
    );

    const isForward = Boolean(keysPressed.current['w'] || keysPressed.current['arrowup']);
    const isBackward = Boolean(keysPressed.current['s'] || keysPressed.current['arrowdown']);
    const isLeft = Boolean(keysPressed.current['a'] || keysPressed.current['arrowleft']);
    const isRight = Boolean(keysPressed.current['d'] || keysPressed.current['arrowright']);

    // Check if user is currently in Viewing Mode (inspecting a selected celestial body)
    const currentSelectedId = useQuantumStore.getState().selectedCosmicBodyId;

    if (currentSelectedId) {
      // 1. VIEWING MODE:
      // When viewing an object, pressing Space elevates the camera upward relative to the celestial body,
      // raising the viewing perspective while strictly preserving the selection and tracking!
      if (isElevateUp || isElevateDown) {
        const liveTarget = controlsRef.current ? controlsRef.current.target : _scratchVecB.set(0, 0, 0);
        const distToBody = Math.max(camera.position.distanceTo(liveTarget), 1.0);

        // Adaptive elevation velocity scaled to distance from object and user speed multiplier
        const elevationSpeed = Math.max(distToBody * 0.75, 2.5) * movementSpeedMultiplier * sprintFactor;
        const elevationDelta = (isElevateUp ? 1 : -1) * elevationSpeed * delta;

        // Elevate camera along cosmic vertical +Y axis
        camera.position.y += elevationDelta;

        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }

      // If user uses WASD horizontal movement while viewing, they explicitly intend to break away and fly:
      if (isForward || isBackward || isLeft || isRight) {
        onUserFlight();
      }
    } else {
      // 2. FREE-FLIGHT MODE (Zero-Allocation Navigation Loop):
      _scratchVecA.set(0, 0, 0);

      if (isForward) _scratchVecA.z -= 1;
      if (isBackward) _scratchVecA.z += 1;
      if (isLeft) _scratchVecA.x -= 1;
      if (isRight) _scratchVecA.x += 1;

      let verticalMove = 0;
      if (isElevateUp) verticalMove += 1;
      if (isElevateDown) verticalMove -= 1;

      if (_scratchVecA.lengthSq() > 0 || verticalMove !== 0) {
        onUserFlight();

        // Adaptive speed scaling based on distance from center
        const currentDist = Math.max(camera.position.length(), 5);
        const adaptiveBaseSpeed = Math.min(Math.max(currentDist * 0.45, 3.5), 85000);
        const finalSpeed = adaptiveBaseSpeed * movementSpeedMultiplier * sprintFactor;

        // Apply forward/horizontal translation along camera gaze/strafe direction
        if (_scratchVecA.lengthSq() > 0) {
          _scratchVecA.normalize();
          _scratchVecA.applyQuaternion(camera.quaternion);
          camera.position.addScaledVector(_scratchVecA, finalSpeed * delta);
        }

        // Apply pure vertical elevation along World +Y (elevate up / down)
        if (verticalMove !== 0) {
          camera.position.y += verticalMove * finalSpeed * delta;
        }

        if (controlsRef.current) {
          _scratchVecB.set(0, 0, -1).applyQuaternion(camera.quaternion);
          controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecB, 50.0);
        }
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
  const setAdjacentCosmicScaleLevel = useQuantumStore((s) => s.setAdjacentCosmicScaleLevel);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const scaleNavigationRequest = useQuantumStore((s) => s.scaleNavigationRequest);
  const continuousZoomRequest = useQuantumStore((s) => s.continuousZoomRequest);

  const prevScaleRef = useRef(cosmicScaleLevel);
  const isTweeningRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const isTrackingRef = useRef(false);
  const lastTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastActiveBodyIdRef = useRef<string | null>(selectedCosmicBodyId);

  // Real-time continuous zoom distance tracker and HUD synchronization + Live Orbit Following
  useFrame(() => {
    if (!controlsRef.current) return;

    // 1. DYNAMIC CELESTIAL FOLLOW & SEAMLESS BREAKAWAY:
    if (isTrackingRef.current && !isTweeningRef.current && selectedCosmicBodyId) {
      if (getCelestialWorldPosition(selectedCosmicBodyId, _scratchVecA)) {
        const distToBody = camera.position.distanceTo(_scratchVecA);
        const framingDist = calculateFramingDistance(selectedCosmicBodyId);

        // If the user zooms or elevates out far enough away from the body, gently pause tracking without clearing selection
        if (distToBody > framingDist * 40.0) {
          isTrackingRef.current = false;
        } else {
          _scratchVecB.copy(_scratchVecA).sub(lastTargetPosRef.current);
          camera.position.add(_scratchVecB);
          controlsRef.current.target.copy(_scratchVecA);
          lastTargetPosRef.current.copy(_scratchVecA);
        }
      }
    }

    // 2. Real-time continuous zoom distance tracker, body proximity lock, and scale synchronization
    if (isTweeningRef.current || isInitialMountRef.current) return;

    // A. If an object is actively selected, synchronize its scale level and clear adjacent scale:
    if (selectedCosmicBodyId) {
      lastActiveBodyIdRef.current = selectedCosmicBodyId;
      const body = CELESTIAL_BODIES[selectedCosmicBodyId];
      if (body) {
        if (body.scaleLevel !== prevScaleRef.current) {
          prevScaleRef.current = body.scaleLevel;
          setCosmicScaleLevel(body.scaleLevel);
        }
        setAdjacentCosmicScaleLevel(null);
      }
      return;
    }

    // B. Proximity Sphere of Influence check for recently visited or nearby off-center bodies:
    // (Prevents TON 618 from dropping to Scale 4, Kepler/WASP stars from dropping to Scale 2, etc.)
    if (lastActiveBodyIdRef.current) {
      const lastBody = CELESTIAL_BODIES[lastActiveBodyIdRef.current];
      if (lastBody) {
        _scratchVecA.set(...lastBody.position);
        const distToLast = camera.position.distanceTo(_scratchVecA);
        let influenceRadius = Math.max(lastBody.size * 5.0, 50.0);
        if (lastActiveBodyIdRef.current === 'ton_618') {
          influenceRadius = 140000; // Colossal gravitational & cosmic web accretion domain
        } else if (lastBody.scaleLevel === 3) {
          influenceRadius = 16000; // Milky Way local stellar / nebular cluster domain
        } else if (lastBody.scaleLevel === 2) {
          influenceRadius = 1500; // Stellar neighborhood domain
        }

        if (distToLast < influenceRadius) {
          // Retain the celestial body's scale realm while within its sphere of influence
          if (lastBody.scaleLevel !== prevScaleRef.current) {
            prevScaleRef.current = lastBody.scaleLevel;
            setCosmicScaleLevel(lastBody.scaleLevel);
          }
          setAdjacentCosmicScaleLevel(null);
          return;
        }
      }
    }

    // C. Global deep-space navigation with Hysteresis and Continuous Zoom Transition Buffers:
    const currentDist = camera.position.length();

    let detectedLevel: 1 | 2 | 3 | 4 | 5 = prevScaleRef.current;
    let adjacentLevel: CosmicScaleLevel | null = null;

    if (currentDist < 85) {
      detectedLevel = 1;
      adjacentLevel = null;
    } else if (currentDist < 125) {
      // Scale 1 <-> 2 Transition Zone
      detectedLevel = currentDist < 105 ? 1 : 2;
      adjacentLevel = detectedLevel === 1 ? 2 : 1;
    } else if (currentDist < 1900) {
      detectedLevel = 2;
      adjacentLevel = null;
    } else if (currentDist < 2500) {
      // Scale 2 <-> 3 Transition Zone
      detectedLevel = currentDist < 2200 ? 2 : 3;
      adjacentLevel = detectedLevel === 2 ? 3 : 2;
    } else if (currentDist < 42000) {
      detectedLevel = 3;
      adjacentLevel = null;
    } else if (currentDist < 54000) {
      // Scale 3 <-> 4 Transition Zone
      detectedLevel = currentDist < 48000 ? 3 : 4;
      adjacentLevel = detectedLevel === 3 ? 4 : 3;
    } else if (currentDist < 155000) {
      detectedLevel = 4;
      adjacentLevel = null;
    } else if (currentDist < 195000) {
      // Scale 4 <-> 5 Transition Zone (Extragalactic <-> Cosmic Web)
      detectedLevel = currentDist < 175000 ? 4 : 5;
      adjacentLevel = detectedLevel === 4 ? 5 : 4;
    } else {
      detectedLevel = 5;
      adjacentLevel = null;
    }

    if (detectedLevel !== prevScaleRef.current) {
      prevScaleRef.current = detectedLevel;
      setCosmicScaleLevel(detectedLevel);
    }
    setAdjacentCosmicScaleLevel(adjacentLevel);

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
      if (controlsRef.current) {
        _scratchVecA.set(0, 0, -1).applyQuaternion(camera.quaternion);
        controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecA, 50.0);
      }
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
          if (getCelestialWorldPosition(selectedCosmicBodyId, _scratchVecA)) {
            controlsRef.current.target.lerp(_scratchVecA, 0.2);
          } else {
            controlsRef.current.target.lerp(liveTargetPos, 0.2);
          }
          controlsRef.current.update();
        }
      },
      onComplete: () => {
        if (controlsRef.current) {
          if (getCelestialWorldPosition(selectedCosmicBodyId, _scratchVecA)) {
            controlsRef.current.target.copy(_scratchVecA);
            lastTargetPosRef.current.copy(_scratchVecA);
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
        dampingFactor={0.06}
        rotateSpeed={0.85}
        zoomSpeed={1.3}
        minDistance={0.8}
        maxDistance={1200000}
        enabled={Boolean(selectedCosmicBodyId)}
        enableRotate={Boolean(selectedCosmicBodyId)}
        enableZoom={Boolean(selectedCosmicBodyId)}
        enablePan={false}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
      <FreeFlightControls
        controlsRef={controlsRef}
        isTweeningRef={isTweeningRef}
        onUserFlight={handleUserFlight}
      />
    </>
  );
};

const WebGlFirstFrameNotifier: React.FC = () => {
  const notifiedRef = useRef(false);
  const setCanvasReady = useQuantumStore((s) => s.setCanvasReady);
  const { gl, scene, camera } = useThree();

  useFrame(() => {
    if (!notifiedRef.current) {
      notifiedRef.current = true;
      try {
        // Pre-compile visible materials on the first frame while loading screen is still active
        gl.compile(scene, camera);
      } catch (err) {
        console.warn('WebGL pre-compile notice:', err);
      }
      setCanvasReady(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('webgl-canvas-ready', { detail: { world: 'universe' } }));
      }
    }
  });
  return null;
};

export const UniverseCanvasContainer: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const scaleNavigationRequest = useQuantumStore((s) => s.scaleNavigationRequest);

  const adjacentCosmicScaleLevel = useQuantumStore((s) => s.adjacentCosmicScaleLevel);

  // Synchronously compute initial scale camera parameters on frame 0
  const initialScaleConfig = useMemo(() => {
    return COSMIC_SCALES.find((s) => s.level === cosmicScaleLevel) || COSMIC_SCALES[0];
  }, []);

  // Hierarchical Scale LoD Culling with Flight Window Overlap
  const activeScales = useMemo(() => {
    const current = cosmicScaleLevel;
    const targetScale = scaleNavigationRequest?.level ?? (
      selectedCosmicBodyId ? CELESTIAL_BODIES[selectedCosmicBodyId]?.scaleLevel : undefined
    );

    // If transitioning between different scale tiers, mount the transit window
    if (targetScale !== undefined && targetScale !== current) {
      const minScale = Math.min(current, targetScale);
      const maxScale = Math.max(current, targetScale);
      return {
        showScale1: minScale <= 1 && maxScale >= 1,
        showScale2: minScale <= 2 && maxScale >= 2,
        showScale3: minScale <= 3 && maxScale >= 3,
        showScale4: minScale <= 4 && maxScale >= 4,
        showScale5: minScale <= 5 && maxScale >= 5,
      };
    }

    // Mount active scale and neighboring scale during continuous zoom transition buffer:
    const adj = adjacentCosmicScaleLevel;
    return {
      showScale1: current === 1 || adj === 1,
      showScale2: current === 2 || adj === 2,
      showScale3: current === 3 || adj === 3,
      showScale4: current === 4 || adj === 4,
      showScale5: current === 5 || adj === 5,
    };
  }, [cosmicScaleLevel, adjacentCosmicScaleLevel, selectedCosmicBodyId, scaleNavigationRequest]);

  return (
    <div className="w-full h-full relative select-none overflow-hidden bg-[#020617]">
      <Canvas
        performance={{ min: 0.5 }}
        camera={{
          position: initialScaleConfig.cameraPosition,
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
        dpr={[1, 1.5]}
      >
        {/* Deep Space Background Stars */}
        <color attach="background" args={['#020617']} />
        <Stars radius={250000} depth={100000} count={9000} factor={6} saturation={0.5} fade speed={1.0} />

        {/* Global Space Ambient Light */}
        <ambientLight intensity={0.35} />

        {/* Camera and Navigation Controller */}
        <UniverseCameraManager />

        {/* Notifies loading screen upon first rasterized WebGL frame */}
        <WebGlFirstFrameNotifier />

        {/* Hierarchical Scale LoD & Culling: Overlapping Visibility Windows for Seamless Continuous Zoom */}
        {/* Hierarchical Scale LoD & Culling: Conditional Mounting per Active Scale Tier */}
        <Suspense fallback={null}>
          {activeScales.showScale1 && <SolarSystemScene />}
          {activeScales.showScale2 && <StellarNeighborhoodScene />}
          {activeScales.showScale3 && <MilkyWayScene />}
          {activeScales.showScale4 && <ExtragalacticScene />}
          {activeScales.showScale5 && <CosmicWebScene />}
        </Suspense>

        {/* Interactive 3D Constellations System */}
        <ConstellationOverlay />
      </Canvas>

      {/* On-Screen Speed Multiplier Controller */}
      <SpeedMultiplierWidget />

      {/* Interactive Constellation Lore & Star Card */}
      <ConstellationInspectorTooltip />
    </div>
  );
};
