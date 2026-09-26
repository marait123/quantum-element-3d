'use client';

import React, { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { audioSynth } from '@/lib/audioSynth';
import { UrlStateSynchronizer } from '@/components/navigation/UrlStateSynchronizer';

import { Header } from '@/components/hud/Header';
import { ElementBadge } from '@/components/hud/ElementBadge';
import { ScaleDock } from '@/components/hud/ScaleDock';
import { ParticleFilterBar } from '@/components/hud/ParticleFilterBar';
import { MobileElementStrip } from '@/components/hud/MobileElementStrip';
import { Element118GridModal } from '@/components/hud/Element118GridModal';
import { ResearchDrawer } from '@/components/dossier/ResearchDrawer';
import { QuantumCinemaModal } from '@/components/hud/QuantumCinemaModal';

import { CosmicScaleDock } from '@/components/universe/hud/CosmicScaleDock';
import { CelestialInspectorTooltip } from '@/components/universe/hud/CelestialInspectorTooltip';
import { CosmicElementDrawer } from '@/components/universe/hud/CosmicElementDrawer';
import { UniverseCinemaModal } from '@/components/universe/hud/UniverseCinemaModal';
import { InteractiveGuidedTour } from '@/components/tutorial/InteractiveGuidedTour';

// Dynamically import Subatomic 3D Canvas with SSR disabled
const CanvasContainer = dynamic(
  () =>
    import('@/components/3d/CanvasContainer').then(
      (mod) => mod.CanvasContainer
    ),
  { ssr: false }
);

// Dynamically import Cosmic Universe 3D Canvas with SSR disabled
const UniverseCanvasContainer = dynamic(
  () =>
    import('@/components/universe/UniverseCanvasContainer').then(
      (mod) => mod.UniverseCanvasContainer
    ),
  { ssr: false }
);

export default function QuantumElementApp() {
  const language = useQuantumStore((s) => s.language);
  const activeWorld = useQuantumStore((s) => s.activeWorld);

  // Sync document direction and language on mount & update
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Start subtle zero-point drone on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      audioSynth.startZeroPointDrone();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#020617]">
      {/* Universal Deep Linking & View Refresh Synchronizer */}
      <Suspense fallback={null}>
        <UrlStateSynchronizer />
      </Suspense>

      {/* 3D WebGL Canvas Viewport (Subatomic or Universe) */}
      {activeWorld === 'subatomic' ? (
        <CanvasContainer />
      ) : (
        <UniverseCanvasContainer />
      )}

      {/* Top Header with World Switcher, Brand, Sound, and Language */}
      <Header />

      {/* Subatomic World HUD & Modals */}
      {activeWorld === 'subatomic' && (
        <>
          <ElementBadge />
          <ParticleFilterBar />
          <ScaleDock />
          <MobileElementStrip />

          <Element118GridModal />
          <ResearchDrawer />
          <QuantumCinemaModal />
        </>
      )}

      {/* Cosmic Universe World HUD & Modals */}
      {activeWorld === 'universe' && (
        <>
          <CosmicScaleDock />
          <CelestialInspectorTooltip />
          <CosmicElementDrawer />
          <UniverseCinemaModal />
        </>
      )}

      {/* Global Interactive On-Site Guided Tour Overlay */}
      <InteractiveGuidedTour />
    </main>
  );
}
