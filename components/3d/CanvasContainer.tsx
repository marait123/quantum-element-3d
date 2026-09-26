'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENTS } from '@/data/elementsData';
import { getElementCardPosition } from '@/lib/mathUtils';
import { PeriodicTableScene } from './PeriodicTableScene';
import { AtomScene } from './AtomScene';
import { NucleusScene } from './NucleusScene';
import { QuarkScene } from './QuarkScene';
import { StringScene } from './StringScene';

// Camera position parameters for each scale
const SCALE_CAMERA_CONFIGS = {
  1: { position: [0, 0, 32], fov: 48, minDistance: 5.2, maxDistance: 45 },
  2: { position: [0, 0, 24], fov: 45, minDistance: 6.5, maxDistance: 38 },
  3: { position: [0, 0, 14], fov: 45, minDistance: 4.5, maxDistance: 26 },
  4: { position: [0, 0, 9.5], fov: 45, minDistance: 3.2, maxDistance: 18 },
  5: { position: [0, 0, 13], fov: 45, minDistance: 3.0, maxDistance: 24 },
};

const CameraAndSceneManager: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const zoomIn = useQuantumStore((s) => s.zoomIn);
  const zoomOut = useQuantumStore((s) => s.zoomOut);

  const isInitialMountRef = useRef(true);
  const prevActiveElementRef = useRef<number>(activeElementNum);

  // Transition camera smoothly whenever scaleLevel changes
  useEffect(() => {
    const config = SCALE_CAMERA_CONFIGS[scaleLevel];
    if (!config) return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      camera.position.set(config.position[0], config.position[1], config.position[2]);
      camera.lookAt(0, 0, 0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = config.fov;
        camera.updateProjectionMatrix();
      }
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
      return;
    }

    gsap.killTweensOf(camera.position);

    // Cinematic zoom warp transition
    gsap.to(camera.position, {
      x: config.position[0],
      y: config.position[1],
      z: config.position[2],
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      },
    });

    if (camera instanceof THREE.PerspectiveCamera) {
      gsap.to(camera, {
        fov: config.fov,
        duration: 1.1,
        ease: 'power3.inOut',
        onUpdate: () => camera.updateProjectionMatrix(),
      });
    }
  }, [scaleLevel, camera]);

  // Focus closely on element card when selected in Scale 1
  useEffect(() => {
    if (scaleLevel !== 1) {
      prevActiveElementRef.current = activeElementNum;
      return;
    }
    // Don't auto-focus on initial mount so user sees the grand table overview first
    if (prevActiveElementRef.current === activeElementNum) return;
    prevActiveElementRef.current = activeElementNum;

    const el = ELEMENTS.find((e) => e.num === activeElementNum);
    if (!el) return;

    const [cardX, cardY] = getElementCardPosition(el.row, el.col, el.cat, el.num);

    gsap.killTweensOf(camera.position);
    if (controlsRef.current) {
      gsap.killTweensOf(controlsRef.current.target);
    }

    gsap.to(camera.position, {
      x: cardX,
      y: cardY,
      z: 8.5,
      duration: 1.0,
      ease: 'power3.out',
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: cardX,
        y: cardY,
        z: 0,
        duration: 1.0,
        ease: 'power3.out',
        onUpdate: () => controlsRef.current?.update(),
      });
    }
  }, [activeElementNum, scaleLevel, camera]);

  // Listen for direct focus event from card clicks
  useEffect(() => {
    const handleFocusCard = (e: Event) => {
      const customEvent = e as CustomEvent<{ num: number; x: number; y: number }>;
      if (!customEvent.detail || scaleLevel !== 1) return;
      const { x, y } = customEvent.detail;

      gsap.killTweensOf(camera.position);
      if (controlsRef.current) {
        gsap.killTweensOf(controlsRef.current.target);
      }

      gsap.to(camera.position, {
        x,
        y,
        z: 8.5,
        duration: 1.0,
        ease: 'power3.out',
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x,
          y,
          z: 0,
          duration: 1.0,
          ease: 'power3.out',
          onUpdate: () => controlsRef.current?.update(),
        });
      }
    };

    window.addEventListener('focus-element-card', handleFocusCard);
    return () => window.removeEventListener('focus-element-card', handleFocusCard);
  }, [scaleLevel, camera]);

  // Continuously check distance for natural pinch/scroll zoom between scales
  const lastZoomTimeRef = useRef(0);

  useFrame(() => {
    if (!controlsRef.current) return;
    const targetPos = controlsRef.current.target;
    const distance = camera.position.distanceTo(targetPos);
    const config = SCALE_CAMERA_CONFIGS[scaleLevel];
    const now = performance.now();

    // Debounce scale jumps by 900ms to allow smooth user interaction
    if (now - lastZoomTimeRef.current > 900) {
      // Zoomed too close -> plunge to next scale
      if (distance < config.minDistance && scaleLevel < 5) {
        lastZoomTimeRef.current = now;
        zoomIn();
      }
      // Zoomed too far away -> zoom out to previous scale
      else if (distance > config.maxDistance && scaleLevel > 1) {
        lastZoomTimeRef.current = now;
        zoomOut();
      }
    }
  });

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.8}
        zoomSpeed={1.0}
        minDistance={2.5}
        maxDistance={50}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      {/* Cosmic background stars */}
      <Stars
        radius={120}
        depth={60}
        count={3500}
        factor={4}
        saturation={0.5}
        fade
        speed={0.8}
      />

      {/* Ambient and Key Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />

      {/* Dynamic Scale Content */}
      {scaleLevel === 1 && <PeriodicTableScene />}
      {scaleLevel === 2 && <AtomScene />}
      {scaleLevel === 3 && <NucleusScene />}
      {scaleLevel === 4 && <QuarkScene />}
      {scaleLevel === 5 && <StringScene />}
    </>
  );
};

export const CanvasContainer: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#030712]">
      <Canvas
        camera={{ position: [0, 0, 32], fov: 48 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <CameraAndSceneManager />
      </Canvas>
    </div>
  );
};
