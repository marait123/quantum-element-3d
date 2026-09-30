'use client';

import React, { useRef, useEffect, useMemo, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame, events as createPointerEvents } from '@react-three/fiber';
import { OrbitControls, Stars, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useQuantumStore } from '@/stores/useQuantumStore';
import { COSMIC_SCALES, CELESTIAL_BODIES, CosmicScaleLevel } from '@/data/universeData';
import {
  getCelestialWorldPosition,
  getCelestialObject,
  calculateFramingCameraPosition,
  calculateFramingDistance,
} from '@/lib/celestialRegistry';
import { computeScaleVisibility, maskHas, ScaleVisibilityState, SCALE_LEVELS, navigationScale } from '@/lib/scaleVisibility';
import {
  GALAXY_INTERIORS,
  INSIDE_RADII,
  GalaxyViewLevel,
  galaxyEntryPose,
  starNeighbourhoodPose,
  getStarNeighbourhood,
  isInFeaturedSystem,
} from '@/lib/galaxyInteriors';

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
import { TimeControl } from './hud/TimeControl';
import { ConstellationOverlay } from './constellations/ConstellationOverlay';
import { ConstellationInspectorTooltip } from './hud/ConstellationInspectorTooltip';
import { UniverseDebugProbe } from './debug/UniverseDebugProbe';
import { LightPool } from './rendering/LightPool';
import { LayerVisibilityProvider, isObjectRendered } from './rendering/LayerVisibility';
import { isLowQuality } from '@/lib/deviceQuality';
import { advanceSimClock } from '@/lib/simClock';

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
  // Two fingers on the screen: pinching flies, so the one-finger look pauses
  const pinchActiveRef = useRef(false);

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
      if (pinchActiveRef.current) return;
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

  // Touch gestures (phones/tablets). With nothing selected, a two-finger pinch flies forward/back along the gaze,
  // with the same distance-aware step as the mouse wheel (while a body is selected, OrbitControls' pinch zooms on
  // it). A double tap shows the selected body's card at once: iOS does not fire dblclick reliably for touch.
  useEffect(() => {
    const canvasElement = gl.domElement;
    const root: HTMLElement = canvasElement.closest('[data-universe-root]') ?? canvasElement;
    const touches = new Map<number, { x: number; y: number }>();
    let pinchDistance = 0;
    let lastTap: { x: number; y: number; t: number } | null = null;
    let tapStart: { x: number; y: number; t: number; id: number } | null = null;

    const spread = () => {
      const [a, b] = Array.from(touches.values());
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tapStart = touches.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId } : null;
      if (touches.size === 2) {
        pinchActiveRef.current = true;
        isDraggingRef.current = false;
        pinchDistance = spread();
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || !touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size !== 2 || !pinchActiveRef.current) return;
      const d = spread();
      if (pinchDistance <= 0 || d <= 0) return;
      const ratio = d / pinchDistance;
      pinchDistance = d;
      if (useQuantumStore.getState().selectedCosmicBodyId || isTweeningRef.current) return;
      _scratchVecA.set(0, 0, -1).applyQuaternion(camera.quaternion);
      const currentDist = navigationScale(camera.position);
      const adaptiveBaseSpeed = Math.min(Math.max(currentDist * 0.12, 1.8), 25000);
      // Spreading the fingers flies forward; about one wheel tick per 25% change in finger spread
      const step = Math.log(ratio) * 6 * adaptiveBaseSpeed * useQuantumStore.getState().movementSpeedMultiplier;
      camera.position.addScaledVector(_scratchVecA, step);
      if (controlsRef.current) {
        controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecA, 50.0);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      touches.delete(e.pointerId);
      if (touches.size < 2) pinchActiveRef.current = false;
      // A quick, still, single-finger touch is a tap; two taps close together are a double tap
      if (tapStart && tapStart.id === e.pointerId && touches.size === 0) {
        const now = performance.now();
        const still = Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 10;
        if (still && now - tapStart.t < 350) {
          if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
            lastTap = null;
            // Let the second tap's selection land first (tapping a new body selects it)
            setTimeout(() => useQuantumStore.getState().showCosmicCardNow(), 0);
          } else {
            lastTap = { x: e.clientX, y: e.clientY, t: now };
          }
        }
      }
      tapStart = null;
    };

    root.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      root.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      pinchActiveRef.current = false;
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
      // Step scales with the local environment (nearest body), not with distance from the Milky Way
      const currentDist = navigationScale(camera.position);
      const adaptiveBaseSpeed = Math.min(Math.max(currentDist * 0.12, 1.8), 25000);
      const scrollStep = -Math.sign(e.deltaY) * adaptiveBaseSpeed * movementSpeedMultiplier * 1.5;

      camera.position.addScaledVector(_scratchVecA, scrollStep);

      if (controlsRef.current) {
        controlsRef.current.target.copy(camera.position).addScaledVector(_scratchVecA, 50.0);
      }
    };

    // Listen on the whole universe view: in-scene labels and map pins are DOM overlays next to the canvas, and
    // scrolling over one of them must still fly the camera
    const wheelTarget: HTMLElement = canvasElement.closest('[data-universe-root]') ?? canvasElement;
    wheelTarget.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      wheelTarget.removeEventListener('wheel', handleWheel);
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
        // Speed scales with the local environment (nearest body), not with distance from the Milky Way
        const currentDist = navigationScale(camera.position);
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

const ENTERABLE_GALAXY_IDS = Object.keys(GALAXY_INTERIORS);
const HOME_REGION_RADIUS = 48000; // the Milky Way region ends at the Milky Way / Extragalactic boundary

// The galaxy the camera is currently inside: the nearest enterable galaxy within INSIDE_RADII of its radius,
// otherwise the Milky Way while in the home region
function detectInsideGalaxy(cameraPosition: THREE.Vector3): string | null {
  let best: string | null = null;
  let bestRatio = Infinity;
  for (const id of ENTERABLE_GALAXY_IDS) {
    const body = CELESTIAL_BODIES[id];
    const ratio = cameraPosition.distanceTo(_scratchVecC.set(...body.position)) / body.size;
    if (ratio < INSIDE_RADII && ratio < bestRatio) {
      best = id;
      bestRatio = ratio;
    }
  }
  if (best) return best;
  return cameraPosition.length() < HOME_REGION_RADIUS ? 'milky_way_galaxy' : null;
}

// Level inside another galaxy (dock highlight): the featured system when it (or its planet) is selected, the star
// neighbourhood when the camera is near it, otherwise the whole galaxy
function detectGalaxyViewLevel(
  insideId: string | null,
  cameraPosition: THREE.Vector3,
  selectedId: string | null
): GalaxyViewLevel | null {
  if (!insideId || insideId === 'milky_way_galaxy') return null;
  if (isInFeaturedSystem(insideId, selectedId)) return 1;
  const { centre, radius } = getStarNeighbourhood(insideId);
  return cameraPosition.distanceTo(centre) < radius * 4 ? 2 : 3;
}

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
  const galaxyEntryRequest = useQuantumStore((s) => s.galaxyEntryRequest);
  const setInsideGalaxyId = useQuantumStore((s) => s.setInsideGalaxyId);
  const setGalaxyViewLevel = useQuantumStore((s) => s.setGalaxyViewLevel);

  const setVisibleScaleMask = useQuantumStore((s) => s.setVisibleScaleMask);
  const size = useThree((s) => s.size);

  const visibilityRef = useRef<ScaleVisibilityState | null>(null);
  const handledRequestTsRef = useRef({ scale: 0, galaxy: 0 });
  const flightKindRef = useRef<'selection' | 'scale' | 'zoom' | 'entry' | null>(null);
  const isTweeningRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const isTrackingRef = useRef(false);
  const lastTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

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

    // 2. Scale layer visibility + HUD scale (rules in lib/scaleVisibility.ts). Evaluated every frame, also
    //    during camera tweens, so what is shown always matches where the camera actually is.
    const vis = computeScaleVisibility(
      {
        cameraPosition: camera.position,
        selectedBodyId: selectedCosmicBodyId,
        viewportHeight: size.height,
        fovDeg: (camera as THREE.PerspectiveCamera).fov ?? 48,
      },
      visibilityRef.current
    );
    visibilityRef.current = vis;
    setVisibleScaleMask(vis.mask);

    // Which galaxy the camera is inside (HUD location chip) and, inside another galaxy, which of its levels
    const insideId = detectInsideGalaxy(camera.position);
    setInsideGalaxyId(insideId);
    setGalaxyViewLevel(detectGalaxyViewLevel(insideId, camera.position, selectedCosmicBodyId));

    // The HUD keeps showing a flight's destination until the camera lands (including the frame between a
    // dock/galaxy request and the flight actually starting)
    const st = useQuantumStore.getState();
    const flightPending =
      (st.scaleNavigationRequest?.timestamp ?? 0) !== handledRequestTsRef.current.scale ||
      (st.galaxyEntryRequest?.timestamp ?? 0) !== handledRequestTsRef.current.galaxy;
    if (!isTweeningRef.current && !isInitialMountRef.current && !flightPending) {
      setCosmicScaleLevel(vis.hudLevel);
      setAdjacentCosmicScaleLevel(vis.adjacent);
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
      // Deselecting mid-flight to a body (Escape, WASD breakaway, clicking empty space) hands control back
      // immediately instead of letting the camera keep flying to the old target. Other flights (scale dock,
      // galaxy entry) are not tied to a selection and keep going.
      if (isTweeningRef.current && flightKindRef.current === 'selection') {
        gsap.killTweensOf(camera.position);
        isTweeningRef.current = false;
      }
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
      useQuantumStore.getState().setArrivedCosmicBodyId(selectedCosmicBodyId);
      return;
    }

    isTweeningRef.current = true;
    flightKindRef.current = 'selection';
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
        // Only if this is still the selection (a newer selection restarts the wait)
        const st = useQuantumStore.getState();
        if (st.selectedCosmicBodyId === selectedCosmicBodyId) st.setArrivedCosmicBodyId(selectedCosmicBodyId);
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
    handledRequestTsRef.current.scale = scaleNavigationRequest.timestamp;

    isTrackingRef.current = false;
    const { level } = scaleNavigationRequest;
    const scaleConfig = COSMIC_SCALES.find((s) => s.level === level);
    if (!scaleConfig) return;

    const targetPos = new THREE.Vector3(...scaleConfig.cameraTarget);

    isTweeningRef.current = true;
    flightKindRef.current = 'scale';
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

  // Enter a galaxy: fly to a vantage point inside it (like the Milky Way scale's view of our own galaxy), then
  // hand control back in free flight so the user can look around and fly through it
  useEffect(() => {
    if (!galaxyEntryRequest) return;
    handledRequestTsRef.current.galaxy = galaxyEntryRequest.timestamp;
    const { id } = galaxyEntryRequest;
    // Deselect first so the selection's follow/orbit doesn't fight the flight (entry always ends in free flight)
    if (useQuantumStore.getState().selectedCosmicBodyId) setSelectedCosmicBodyId(null);
    const entryPos = new THREE.Vector3();
    const entryTarget = new THREE.Vector3();
    if (galaxyEntryRequest.level === 2) starNeighbourhoodPose(id, entryPos, entryTarget);
    else galaxyEntryPose(id, getCelestialObject(id), entryPos, entryTarget);

    isTrackingRef.current = false;
    isTweeningRef.current = true;
    flightKindRef.current = 'entry';
    gsap.killTweensOf(camera.position);

    gsap.to(camera.position, {
      x: entryPos.x,
      y: entryPos.y,
      z: entryPos.z,
      duration: 2.2,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.lerp(entryTarget, 0.15);
          controlsRef.current.update();
        }
      },
      onComplete: () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(entryTarget);
          controlsRef.current.update();
        }
        isTweeningRef.current = false;
        // Free flight inside the galaxy (selection would pin the camera to orbiting a single body)
        if (useQuantumStore.getState().selectedCosmicBodyId) setSelectedCosmicBodyId(null);
      },
    });
  }, [galaxyEntryRequest, camera, setSelectedCosmicBodyId]);

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
    flightKindRef.current = 'zoom';
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

const SCALE_SCENES: Record<CosmicScaleLevel, React.LazyExoticComponent<React.FC>> = {
  1: SolarSystemScene,
  2: StellarNeighborhoodScene,
  3: MilkyWayScene,
  4: ExtragalacticScene,
  5: CosmicWebScene,
};

const PRELOAD_START_DELAY_MS = 1200;
const PRELOAD_INTERVAL_MS = 700;

// Uploads textures and compiles shaders of a hidden layer ahead of time, so its first appearance doesn't stall.
// Works because the point-light count is constant (LightPool): programs compiled now are the ones used later.
function prewarmLayer(gl: THREE.WebGLRenderer, group: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene) {
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      for (const value of Object.values(mat)) {
        if (value && (value as THREE.Texture).isTexture) gl.initTexture(value as THREE.Texture);
      }
    }
  });
  const wasVisible = group.visible;
  group.visible = true; // compile() only walks visible objects; the traversal is synchronous
  try {
    if (gl.compileAsync) void gl.compileAsync(group, camera, scene);
    else gl.compile(group, camera, scene);
  } finally {
    group.visible = wasVisible;
  }
}

/**
 * One cosmic scale scene. Mounted the first time it is needed (or preloaded in the background) and then kept
 * alive: showing/hiding only flips `visible`, so transitions never remount geometry, recompile shaders, re-run
 * Suspense or churn the celestial registry. Its own Suspense boundary keeps a loading chunk from blanking the
 * other layers.
 */
const ScaleLayer: React.FC<{ level: CosmicScaleLevel; preload: boolean }> = ({ level, preload }) => {
  const visible = useQuantumStore((s) => maskHas(s.visibleScaleMask, level));
  const [mounted, setMounted] = useState(visible);
  const groupRef = useRef<THREE.Group>(null);
  const prewarmedRef = useRef(false);
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    if ((visible || preload) && !mounted) setMounted(true);
  }, [visible, preload, mounted]);

  // Once preloaded content has resolved (lazy chunk loaded, children present), prewarm it while hidden
  useFrame(() => {
    const g = groupRef.current;
    if (prewarmedRef.current || !g || g.visible) {
      if (g?.visible) prewarmedRef.current = true; // rendered for real: nothing left to warm
      return;
    }
    if (g.children.length === 0 || g.children[0].children.length === 0) return;
    prewarmedRef.current = true;
    try {
      prewarmLayer(gl, g, camera, scene);
    } catch (err) {
      console.warn(`Scale ${level} prewarm skipped:`, err);
    }
  });

  if (!mounted && !visible) return null;
  const Scene = SCALE_SCENES[level];
  return (
    <group ref={groupRef} name={`universe-scale-${level}`} visible={visible}>
      <LayerVisibilityProvider visible={visible}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </LayerVisibilityProvider>
    </group>
  );
};

// Pointer events ignore hidden objects (three's raycaster doesn't check `visible`), so hidden layers and LoD
// groups can't be hovered or clicked and never pop up labels.
// From inside an enterable galaxy its own disk, halo and bulge surround the camera and fill the whole view. They
// must not be pickable there: a click between stars would select the galaxy itself (whose framing is outside it,
// so the camera flew out), and a disk plane in front of a star would steal the click meant for that star.
const _pickGalaxyCentre = new THREE.Vector3();
function isShellOfGalaxyAroundCamera(obj: THREE.Object3D, camera: THREE.Camera): boolean {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    const id = o.userData.galaxyId as string | undefined;
    if (!id) continue;
    const body = CELESTIAL_BODIES[id];
    if (!body || !(id in GALAXY_INTERIORS)) return false;
    return camera.position.distanceTo(o.getWorldPosition(_pickGalaxyCentre)) < body.size * INSIDE_RADII;
  }
  return false;
}

// Diffuse features (objects with userData.pickLast, e.g. M31's Giant Stellar Stream) are only picked when nothing
// compact is under the pointer, so a star seen through them stays clickable.
// Phones: while the object card is open as a bottom sheet (covering the lower ~46% of the screen), shift the
// rendered view so the object the camera frames sits in the middle of the visible area above the sheet instead
// of under its top edge. A view offset moves the image without moving the camera, and raycasting/projection use
// the same matrix, so taps and labels stay aligned.
const SimClockDriver: React.FC = () => {
  useFrame((_, delta) => advanceSimClock(delta));
  return null;
};

const SHEET_VIEW_SHIFT = 0.22; // fraction of the screen height
const SheetViewOffset: React.FC = () => {
  const { camera, size } = useThree();
  const shift = useRef(0);
  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const target = useQuantumStore.getState().isCardSheetOpen ? SHEET_VIEW_SHIFT : 0;
    if (target === 0 && shift.current === 0) return;
    shift.current += (target - shift.current) * Math.min(1, delta * 6);
    if (target === 0 && shift.current < 0.001) {
      shift.current = 0;
      cam.clearViewOffset();
      return;
    }
    cam.setViewOffset(size.width, size.height, 0, shift.current * size.height, size.width, size.height);
  });
  return null;
};

const visibleOnlyEvents: typeof createPointerEvents = (store) => ({
  ...createPointerEvents(store),
  filter: (hits, state) => {
    const kept = hits.filter(
      (hit) => isObjectRendered(hit.object) && !isShellOfGalaxyAroundCamera(hit.object, state.camera)
    );
    const last = kept.filter((hit) => hit.object.userData.pickLast);
    return last.length ? [...kept.filter((hit) => !hit.object.userData.pickLast), ...last] : kept;
  },
});

export const UniverseCanvasContainer: React.FC = () => {
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const isCanvasReady = useQuantumStore((s) => s.isCanvasReady);
  // Rendering quality tier (phones: lower pixel ratio, no MSAA, thinner star fields; see lib/deviceQuality.ts)
  const lowQuality = useMemo(() => isLowQuality(), []);
  const [maxDpr, setMaxDpr] = useState(() => (isLowQuality() ? 1.25 : 1.5));

  // A single click selects and flies to an object, and its card follows once the camera has arrived. A double
  // click (on the object or its label) shows the card straight away. Native listener: in-scene labels are DOM
  // overlays rendered by a separate React root, so React's onDoubleClick on this div would miss them.
  const universeRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = universeRootRef.current;
    if (!root) return;
    const onDoubleClick = () => useQuantumStore.getState().showCosmicCardNow();
    root.addEventListener('dblclick', onDoubleClick);
    return () => root.removeEventListener('dblclick', onDoubleClick);
  }, []);

  // Synchronously compute initial scale camera parameters on frame 0
  const initialScaleConfig = useMemo(() => {
    return COSMIC_SCALES.find((s) => s.level === cosmicScaleLevel) || COSMIC_SCALES[0];
  }, []);

  // After the first frame, quietly mount the remaining layers (nearest scales first) so later transitions
  // are instant. Hidden layers cost no draw calls; they are prewarmed once and then idle.
  const [preloadCount, setPreloadCount] = useState(0);
  const preloadOrder = useMemo(
    () => [...SCALE_LEVELS].sort((a, b) => Math.abs(a - cosmicScaleLevel) - Math.abs(b - cosmicScaleLevel)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => {
    if (!isCanvasReady) return;
    let count = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        count++;
        setPreloadCount(count);
        if (count >= SCALE_LEVELS.length && interval) clearInterval(interval);
      }, PRELOAD_INTERVAL_MS);
    }, PRELOAD_START_DELAY_MS);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [isCanvasReady]);

  return (
    <div ref={universeRootRef} data-universe-root className="w-full h-full relative select-none overflow-hidden bg-[#020617]">
      <Canvas
        performance={{ min: 0.5 }}
        events={visibleOnlyEvents}
        camera={{
          position: initialScaleConfig.cameraPosition,
          fov: 48,
          near: 0.05,
          far: 2500000,
        }}
        gl={{
          logarithmicDepthBuffer: true,
          antialias: !lowQuality,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, maxDpr]}
      >
        {/* Shared simulation clock: advanced first each frame, read by everything that moves (lib/simClock.ts) */}
        <SimClockDriver />

        {/* If frames get slow (phones), drop to a 1:1 pixel ratio. Only the pixel ratio changes, so nothing recompiles. */}
        <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
        <SheetViewOffset />

        {/* Deep Space Background Stars */}
        <color attach="background" args={['#020617']} />
        <Stars radius={250000} depth={100000} count={lowQuality ? 4000 : 9000} factor={6} saturation={0.5} fade speed={1.0} />

        {/* Global Space Ambient Light */}
        {/* Low fill light: the Sun (and each star's own light) decides day and night sides */}
        <ambientLight intensity={0.1} />

        {/* Constant-size point-light pool shared by every scale (see rendering/LightPool.tsx) */}
        <LightPool />

        {/* Camera and Navigation Controller */}
        <UniverseCameraManager />

        {/* Notifies loading screen upon first rasterized WebGL frame */}
        <WebGlFirstFrameNotifier />

        {/* Cosmic scale layers: shown/hidden per lib/scaleVisibility.ts, kept alive once mounted */}
        {SCALE_LEVELS.map((level) => (
          <ScaleLayer key={level} level={level} preload={preloadOrder.indexOf(level) < preloadCount} />
        ))}

        {process.env.NODE_ENV !== 'production' && <UniverseDebugProbe />}

        {/* Interactive 3D Constellations System */}
        <ConstellationOverlay />
      </Canvas>

      {/* On-Screen Speed Multiplier Controller */}
      <SpeedMultiplierWidget />
      <TimeControl />

      {/* Interactive Constellation Lore & Star Card */}
      <ConstellationInspectorTooltip />
    </div>
  );
};
