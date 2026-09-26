'use client';

import React, { useEffect, useRef } from 'react';
import { useQuantumStore, ScaleLevel, DossierTab, ParticleFilter } from '@/stores/useQuantumStore';
import { ELEMENTS } from '@/data/elementsData';
import { CELESTIAL_BODIES, CosmicScaleLevel } from '@/data/universeData';

export const UrlStateSynchronizer: React.FC = () => {
  const isHydratedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand Store Selectors
  const activeWorld = useQuantumStore((s) => s.activeWorld);
  const scaleLevel = useQuantumStore((s) => s.scaleLevel);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const cosmicScaleLevel = useQuantumStore((s) => s.cosmicScaleLevel);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const isCosmicElementDrawerOpen = useQuantumStore((s) => s.isCosmicElementDrawerOpen);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);
  const isDossierOpen = useQuantumStore((s) => s.isDossierOpen);
  const activeDossierTab = useQuantumStore((s) => s.activeDossierTab);
  const particleFilter = useQuantumStore((s) => s.particleFilter);
  const navigationMode = useQuantumStore((s) => s.navigationMode);
  const language = useQuantumStore((s) => s.language);

  // Setters
  const setActiveWorld = useQuantumStore((s) => s.setActiveWorld);
  const setScaleLevel = useQuantumStore((s) => s.setScaleLevel);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const setCosmicScaleLevel = useQuantumStore((s) => s.setCosmicScaleLevel);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setCosmicElementDrawerOpen = useQuantumStore((s) => s.setCosmicElementDrawerOpen);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setDossierOpen = useQuantumStore((s) => s.setDossierOpen);
  const setActiveDossierTab = useQuantumStore((s) => s.setActiveDossierTab);
  const setParticleFilter = useQuantumStore((s) => s.setParticleFilter);
  const setNavigationMode = useQuantumStore((s) => s.setNavigationMode);
  const setLanguage = useQuantumStore((s) => s.setLanguage);

  // Helper to parse element parameter (supports symbol "Fe", name "Iron", or atomic number "26")
  const parseElementParam = (val: string | null): number | null => {
    if (!val) return null;
    const trimmed = val.trim().toLowerCase();
    const asNum = parseInt(trimmed, 10);
    if (!isNaN(asNum) && asNum >= 1 && asNum <= 118) {
      return asNum;
    }
    const found = ELEMENTS.find(
      (e) =>
        e.sym.toLowerCase() === trimmed ||
        e.nameEn.toLowerCase() === trimmed ||
        e.nameAr === trimmed
    );
    return found ? found.num : null;
  };

  // 1. Initial Hydration from URL on Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // World
    const worldParam = params.get('world');
    if (worldParam === 'universe' || worldParam === 'subatomic') {
      setActiveWorld(worldParam);
    }

    // Language
    const langParam = params.get('lang');
    if (langParam === 'ar' || langParam === 'en') {
      setLanguage(langParam);
    }

    // Universe Specific Parameters
    if (worldParam === 'universe') {
      const bodyParam = params.get('body');
      if (bodyParam && CELESTIAL_BODIES[bodyParam]) {
        setSelectedCosmicBodyId(bodyParam);
        const bodyObj = CELESTIAL_BODIES[bodyParam];
        if (bodyObj && bodyObj.scaleLevel) {
          setCosmicScaleLevel(bodyObj.scaleLevel as CosmicScaleLevel);
        }
      } else {
        const cosmicScaleParam = parseInt(params.get('scale') || '', 10);
        if (!isNaN(cosmicScaleParam) && cosmicScaleParam >= 1 && cosmicScaleParam <= 5) {
          setCosmicScaleLevel(cosmicScaleParam as CosmicScaleLevel);
        }
      }

      const drawerParam = params.get('drawer');
      if (drawerParam === 'cosmic_elements') {
        setCosmicElementDrawerOpen(true);
      }

      const cosmicElParam = parseElementParam(params.get('element') || params.get('z'));
      if (cosmicElParam) {
        setHighlightedCosmicElementNum(cosmicElParam);
      }

      const modeParam = params.get('mode');
      if (modeParam === 'fly' || modeParam === 'orbit') {
        setNavigationMode(modeParam);
      }
    } else {
      // Subatomic Specific Parameters
      const elNum = parseElementParam(params.get('element') || params.get('z'));
      if (elNum) {
        setActiveElement(elNum);
      }

      const subScaleParam = parseInt(params.get('scale') || '', 10);
      if (!isNaN(subScaleParam) && subScaleParam >= 1 && subScaleParam <= 5) {
        setScaleLevel(subScaleParam as ScaleLevel);
      }

      const drawerParam = params.get('drawer');
      if (drawerParam) {
        const validTabs: DossierTab[] = ['overview', 'shells', 'qcd', 'strings', 'papers'];
        if (validTabs.includes(drawerParam as DossierTab)) {
          setDossierOpen(true);
          setActiveDossierTab(drawerParam as DossierTab);
        } else if (drawerParam === 'open' || drawerParam === 'true') {
          setDossierOpen(true);
        }
      }

      const filterParam = params.get('filter');
      const validFilters: ParticleFilter[] = ['all', 'protons', 'neutrons', 'electrons'];
      if (filterParam && validFilters.includes(filterParam as ParticleFilter)) {
        setParticleFilter(filterParam as ParticleFilter);
      }
    }

    // Mark initial hydration as completed
    setTimeout(() => {
      isHydratedRef.current = true;
    }, 150);

    // Popstate Listener for Browser Back/Forward buttons
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const currentParams = new URLSearchParams(window.location.search);
      const w = currentParams.get('world') || 'subatomic';
      setActiveWorld(w as 'subatomic' | 'universe');

      if (w === 'universe') {
        const b = currentParams.get('body');
        setSelectedCosmicBodyId(b && CELESTIAL_BODIES[b] ? b : null);
        const s = parseInt(currentParams.get('scale') || '', 10);
        if (!isNaN(s) && s >= 1 && s <= 5) {
          setCosmicScaleLevel(s as CosmicScaleLevel);
        }
      } else {
        const el = parseElementParam(currentParams.get('element') || currentParams.get('z'));
        if (el) setActiveElement(el);
        const s = parseInt(currentParams.get('scale') || '', 10);
        if (!isNaN(s) && s >= 1 && s <= 5) {
          setScaleLevel(s as ScaleLevel);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 2. Debounced URL Reflection on Store Changes
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      // World
      if (activeWorld === 'universe') {
        params.set('world', 'universe');

        // Focused Celestial Body
        if (selectedCosmicBodyId && CELESTIAL_BODIES[selectedCosmicBodyId]) {
          params.set('body', selectedCosmicBodyId);
        } else {
          params.set('scale', cosmicScaleLevel.toString());
        }

        // Cosmic Drawer
        if (isCosmicElementDrawerOpen) {
          params.set('drawer', 'cosmic_elements');
        }

        // Highlighted Element
        if (highlightedCosmicElementNum) {
          const el = ELEMENTS.find((e) => e.num === highlightedCosmicElementNum);
          params.set('element', el ? el.sym : highlightedCosmicElementNum.toString());
        }

        // Navigation Mode
        if (navigationMode === 'fly') {
          params.set('mode', 'fly');
        }
      } else {
        // Subatomic World
        params.set('world', 'subatomic');

        // Active Element Symbol
        const el = ELEMENTS.find((e) => e.num === activeElementNum);
        params.set('element', el ? el.sym : activeElementNum.toString());

        // Scale Level (1..5)
        params.set('scale', scaleLevel.toString());

        // Research Dossier Drawer
        if (isDossierOpen) {
          params.set('drawer', activeDossierTab);
        }

        // Particle Filter
        if (particleFilter !== 'all') {
          params.set('filter', particleFilter);
        }
      }

      // Language (if Arabic)
      if (language === 'ar') {
        params.set('lang', 'ar');
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/?${queryString}` : '/';

      // Update URL silently without full reload or scroll jump
      if (window.location.search !== `?${queryString}`) {
        window.history.replaceState(null, '', newUrl);
      }
    }, 80);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    activeWorld,
    scaleLevel,
    activeElementNum,
    cosmicScaleLevel,
    selectedCosmicBodyId,
    isCosmicElementDrawerOpen,
    highlightedCosmicElementNum,
    isDossierOpen,
    activeDossierTab,
    particleFilter,
    navigationMode,
    language,
  ]);

  return null;
};
