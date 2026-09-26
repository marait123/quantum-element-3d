'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { audioSynth } from '@/lib/audioSynth';

import { Header } from '@/components/hud/Header';
import { ElementBadge } from '@/components/hud/ElementBadge';
import { ScaleDock } from '@/components/hud/ScaleDock';
import { ParticleFilterBar } from '@/components/hud/ParticleFilterBar';
import { MobileElementStrip } from '@/components/hud/MobileElementStrip';
import { Element118GridModal } from '@/components/hud/Element118GridModal';
import { ResearchDrawer } from '@/components/dossier/ResearchDrawer';
import { QuantumCinemaModal } from '@/components/hud/QuantumCinemaModal';

// Dynamically import CanvasContainer with SSR disabled for WebGL
const CanvasContainer = dynamic(
  () =>
    import('@/components/3d/CanvasContainer').then(
      (mod) => mod.CanvasContainer
    ),
  { ssr: false }
);

export default function QuantumElementApp() {
  const language = useQuantumStore((s) => s.language);

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
    <main className="relative w-screen h-screen overflow-hidden bg-[#030712]">
      {/* 3D WebGL Canvas Viewport */}
      <CanvasContainer />

      {/* HUD Overlay Layer */}
      <Header />
      <ElementBadge />
      <ParticleFilterBar />
      <ScaleDock />
      <MobileElementStrip />

      {/* Modals & Slide-over Drawers */}
      <Element118GridModal />
      <ResearchDrawer />
      <QuantumCinemaModal />
    </main>
  );
}
