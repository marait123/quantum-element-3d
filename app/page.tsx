'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuantumStore, WORLD_PREFERENCE_KEY, ActiveWorld } from '@/stores/useQuantumStore';
import { WorldChooser } from '@/components/ui/WorldChooser';
import { audioSynth } from '@/lib/audioSynth';
import { UrlStateSynchronizer } from '@/components/navigation/UrlStateSynchronizer';

import { Header } from '@/components/hud/Header';
import { ElementBadge } from '@/components/hud/ElementBadge';
import { ScaleDock } from '@/components/hud/ScaleDock';
import { ParticleFilterBar } from '@/components/hud/ParticleFilterBar';
import { MobileElementStrip } from '@/components/hud/MobileElementStrip';

import { CosmicScaleDock } from '@/components/universe/hud/CosmicScaleDock';
import { CelestialInspectorTooltip } from '@/components/universe/hud/CelestialInspectorTooltip';
import { CosmicLoadingScreen } from '@/components/ui/CosmicLoadingScreen';
import { ScienceToolsDock } from '@/components/universe/hud/ScienceToolsDock';
import { GalaxyExplorerPanel } from '@/components/universe/hud/GalaxyExplorerPanel';

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

// Lazy-loaded On-Demand Modals and Drawers (Split into separate asynchronous chunks)
const CosmicDatabaseModal = dynamic(
  () =>
    import('@/components/universe/hud/CosmicDatabaseModal').then(
      (mod) => mod.CosmicDatabaseModal
    ),
  { ssr: false }
);

const UniverseCinemaModal = dynamic(
  () =>
    import('@/components/universe/hud/UniverseCinemaModal').then(
      (mod) => mod.UniverseCinemaModal
    ),
  { ssr: false }
);

const CosmicElementDrawer = dynamic(
  () =>
    import('@/components/universe/hud/CosmicElementDrawer').then(
      (mod) => mod.CosmicElementDrawer
    ),
  { ssr: false }
);

const Element118GridModal = dynamic(
  () =>
    import('@/components/hud/Element118GridModal').then(
      (mod) => mod.Element118GridModal
    ),
  { ssr: false }
);

const ResearchDrawer = dynamic(
  () =>
    import('@/components/dossier/ResearchDrawer').then(
      (mod) => mod.ResearchDrawer
    ),
  { ssr: false }
);

const QuantumCinemaModal = dynamic(
  () =>
    import('@/components/hud/QuantumCinemaModal').then(
      (mod) => mod.QuantumCinemaModal
    ),
  { ssr: false }
);

const InteractiveGuidedTour = dynamic(
  () =>
    import('@/components/tutorial/InteractiveGuidedTour').then(
      (mod) => mod.InteractiveGuidedTour
    ),
  { ssr: false }
);

export default function QuantumElementApp() {
  const [isMounted, setIsMounted] = useState(false);
  // First visit (no remembered world and no ?world= link): ask where to begin
  const [chooserChecked, setChooserChecked] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(WORLD_PREFERENCE_KEY);
      const linkedWorld = new URLSearchParams(window.location.search).get('world');
      if (!stored && !linkedWorld) setChooserOpen(true);
    } catch {
      // storage unavailable: skip the chooser and use the default world
    }
    setChooserChecked(true);
  }, []);

  const language = useQuantumStore((s) => s.language);
  const activeWorld = useQuantumStore((s) => s.activeWorld);
  const effectiveWorld = isMounted ? activeWorld : 'subatomic';

  // Modal Visibility Selectors
  const isCosmicDatabaseOpen = useQuantumStore((s) => s.isCosmicDatabaseOpen);
  const isCosmicElementDrawerOpen = useQuantumStore((s) => s.isCosmicElementDrawerOpen);
  const isUniverseVideoModalOpen = useQuantumStore((s) => s.isUniverseVideoModalOpen);
  const isGridModalOpen = useQuantumStore((s) => s.isGridModalOpen);
  const isDossierOpen = useQuantumStore((s) => s.isDossierOpen);
  const isVideoModalOpen = useQuantumStore((s) => s.isVideoModalOpen);
  const isTutorialOpen = useQuantumStore((s) => s.isTutorialOpen);
  const setTutorialOpen = useQuantumStore((s) => s.setTutorialOpen);
  const setActiveWorld = useQuantumStore((s) => s.setActiveWorld);

  // Remember the current world (after the first-visit choice), so a refresh reopens it
  useEffect(() => {
    if (!isMounted || chooserOpen) return;
    try {
      localStorage.setItem(WORLD_PREFERENCE_KEY, activeWorld);
    } catch {
      // storage unavailable
    }
  }, [activeWorld, isMounted, chooserOpen]);

  const handleWorldChosen = useCallback(
    (world: ActiveWorld) => {
      setActiveWorld(world);
      try {
        localStorage.setItem(WORLD_PREFERENCE_KEY, world); // remembered right away, even if the page reloads now
      } catch {
        // storage unavailable
      }
      // The chooser finishes its zoom-out animation before it unmounts
      setTimeout(() => setChooserOpen(false), 900);
    },
    [setActiveWorld]
  );

  // Sync document direction and language on mount & update
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // First-visit onboarding tutorial auto-launch (after the world has been chosen)
  useEffect(() => {
    if (!chooserChecked || chooserOpen) return;
    try {
      const hasCompleted = localStorage.getItem('science_lab_tutorial_completed');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setTutorialOpen(true, 0);
        }, 1400);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, [setTutorialOpen, chooserChecked, chooserOpen]);

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
    <main className="relative w-screen h-screen h-dvh overflow-hidden bg-[#020617]">
      {/* Universal Deep Linking & View Refresh Synchronizer */}
      <Suspense fallback={null}>
        <UrlStateSynchronizer />
      </Suspense>

      {/* Atmospheric Cosmic Loading Screen with Semantic Progress Tracking */}
      <CosmicLoadingScreen />

      {/* 3D WebGL Canvas Viewport (Subatomic or Universe) */}
      {activeWorld === 'subatomic' ? (
        <CanvasContainer />
      ) : (
        <UniverseCanvasContainer />
      )}

      {/* Top Header with World Switcher, Brand, Sound, and Language */}
      <Header />

      {/* Consolidated Science & Research Tools Command Dock (Active in Both Worlds) */}
      <ScienceToolsDock />

      {/* Subatomic World HUD & Lazy-Loaded Modals */}
      {effectiveWorld === 'subatomic' && (
        <>
          <ElementBadge />
          <ParticleFilterBar />
          <ScaleDock />
          <MobileElementStrip />

          {isGridModalOpen && <Element118GridModal />}
          {isDossierOpen && <ResearchDrawer />}
          {isVideoModalOpen && <QuantumCinemaModal />}
        </>
      )}

      {/* Cosmic Universe World HUD & Lazy-Loaded Modals */}
      {effectiveWorld === 'universe' && (
        <>
          <CosmicScaleDock />
          <GalaxyExplorerPanel />
          <CelestialInspectorTooltip />
          {isCosmicElementDrawerOpen && <CosmicElementDrawer />}
          {isCosmicDatabaseOpen && <CosmicDatabaseModal />}
          {isUniverseVideoModalOpen && <UniverseCinemaModal />}
          {isDossierOpen && <ResearchDrawer />}
        </>
      )}

      {/* Global Interactive On-Site Guided Tour Overlay */}
      {isTutorialOpen && <InteractiveGuidedTour />}

      {/* First-visit world chooser (above the loading screen) */}
      {chooserOpen && <WorldChooser onChoose={handleWorldChosen} />}
    </main>
  );
}
