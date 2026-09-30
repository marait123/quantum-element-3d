import { create } from 'zustand';
import { audioSynth } from '@/lib/audioSynth';
import { CosmicScaleLevel, CELESTIAL_BODIES } from '@/data/universeData';
import { FEATURED_SYSTEMS, GalaxyViewLevel } from '@/lib/galaxyInteriors';

export type ScaleLevel = 1 | 2 | 3 | 4 | 5;
export type ParticleFilter = 'all' | 'protons' | 'neutrons' | 'electrons';
export type DossierTab = 'overview' | 'shells' | 'qcd' | 'strings' | 'papers';

export type ActiveWorld = 'subatomic' | 'universe';
export type NavigationMode = 'orbit' | 'fly';

export interface ContinuousZoomRequest {
  direction: 'in' | 'out';
  factor: number;
  timestamp: number;
}

interface QuantumState {
  // World Selection
  activeWorld: ActiveWorld;

  // Subatomic Navigation & Scale
  activeElementNum: number;
  scaleLevel: ScaleLevel;
  previousScaleLevel: ScaleLevel;

  // Cosmic Universe Navigation & Scale
  cosmicScaleLevel: CosmicScaleLevel;
  previousCosmicScaleLevel: CosmicScaleLevel;
  adjacentCosmicScaleLevel: CosmicScaleLevel | null;
  // Bitmask (bit N = scale N) of the cosmic scale layers currently shown; computed by the camera manager
  visibleScaleMask: number;
  // Fly into a galaxy (camera manager consumes it); and the galaxy the camera is currently inside, for the HUD
  galaxyEntryRequest: { id: string; level: GalaxyViewLevel; timestamp: number } | null;
  insideGalaxyId: string | null;
  // Inside another galaxy: 3 = whole galaxy, 2 = its star neighbourhood, 1 = its featured star system
  galaxyViewLevel: GalaxyViewLevel | null;
  selectedCosmicBodyId: string | null;
  // The selected body the camera has finished flying to (null while the flight is under way). The info card waits
  // for this so it does not cover the view during the flight.
  arrivedCosmicBodyId: string | null;
  // Double-clicking an object shows its card straight away instead of after the flight
  instantCardBodyId: string | null;
  // The card was closed by clicking outside it; the body stays selected (and followed) until another selection
  dismissedCardBodyId: string | null;
  // Phones: the object card is open as a bottom sheet (the camera shifts its view up to keep the object visible)
  isCardSheetOpen: boolean;
  scaleNavigationRequest: { level: CosmicScaleLevel; timestamp: number } | null;
  continuousZoomRequest: ContinuousZoomRequest | null;
  navigationMode: NavigationMode;
  highlightedCosmicElementNum: number | null;
  isCosmicElementDrawerOpen: boolean;
  isCosmicDatabaseOpen: boolean;
  isUniverseVideoModalOpen: boolean;
  activeUniverseVideoKey: string | null;

  // Constellations & Minor Bodies Toggles
  showConstellations: boolean;
  selectedConstellationId: string | null;
  showMinorBodies: boolean;

  // Language & Audio
  language: 'en' | 'ar';
  isAudioMuted: boolean;

  // Visual Filters & View toggles
  particleFilter: ParticleFilter;
  isDossierOpen: boolean;
  activeDossierTab: DossierTab;
  isGridModalOpen: boolean;
  isBadgeCollapsed: boolean;
  isVideoModalOpen: boolean;
  activeVideoType: 'scale' | 'element';

  // Platform Tutorial & Speed Multiplier
  isTutorialOpen: boolean;
  tutorialStep: number;
  movementSpeedMultiplier: number; // 0.5, 1.0, 3.0, 10.0, 25.0 (WARP)

  // Interactive Subatomic Scene States
  selectedNucleonIndex: number | null;
  selectedNucleonType: 'proton' | 'neutron' | null;
  isSeaQuarksActive: boolean;
  isBetaDecaying: boolean;
  stringHarmonicMode: number; // 1: electron, 2: quark, 3: photon, 4: graviton
  isExcitedState: boolean;

  // Subatomic Actions
  setActiveWorld: (world: ActiveWorld) => void;
  setActiveElement: (num: number) => void;
  setScaleLevel: (scale: ScaleLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleLanguage: () => void;
  toggleAudio: () => void;
  setParticleFilter: (filter: ParticleFilter) => void;
  setDossierOpen: (open: boolean) => void;
  setActiveDossierTab: (tab: DossierTab) => void;
  setGridModalOpen: (open: boolean) => void;
  setBadgeCollapsed: (collapsed: boolean) => void;
  setVideoModalOpen: (open: boolean, type?: 'scale' | 'element') => void;
  selectNucleon: (index: number | null, type: 'proton' | 'neutron' | null) => void;
  toggleSeaQuarks: () => void;
  triggerBetaDecay: () => void;
  setStringHarmonicMode: (mode: number) => void;
  triggerQuantumLeap: () => void;

  // Cosmic Universe Actions
  setCosmicScaleLevel: (scale: CosmicScaleLevel) => void;
  setAdjacentCosmicScaleLevel: (scale: CosmicScaleLevel | null) => void;
  setVisibleScaleMask: (mask: number) => void;
  requestGalaxyEntry: (id: string, level?: GalaxyViewLevel) => void;
  setInsideGalaxyId: (id: string | null) => void;
  setGalaxyViewLevel: (level: GalaxyViewLevel | null) => void;
  requestScaleNavigation: (scale: CosmicScaleLevel) => void;
  requestContinuousZoom: (direction: 'in' | 'out', factor?: number) => void;
  cosmicZoomIn: () => void;
  cosmicZoomOut: () => void;
  setSelectedCosmicBodyId: (id: string | null) => void;
  setArrivedCosmicBodyId: (id: string | null) => void;
  showCosmicCardNow: () => void;
  dismissCosmicCard: () => void;
  setCardSheetOpen: (open: boolean) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  toggleNavigationMode: () => void;
  setHighlightedCosmicElementNum: (num: number | null) => void;
  setCosmicElementDrawerOpen: (open: boolean) => void;
  setCosmicDatabaseOpen: (open: boolean) => void;
  setUniverseVideoModalOpen: (open: boolean, videoKey?: string) => void;

  // Tutorial & Speed Actions
  setTutorialOpen: (open: boolean, step?: number) => void;
  setTutorialStep: (step: number) => void;
  setMovementSpeedMultiplier: (mult: number) => void;

  // Constellations & Minor Bodies Actions
  toggleConstellations: () => void;
  setSelectedConstellationId: (id: string | null) => void;
  toggleMinorBodies: () => void;

  // 3D Canvas Lifecycle & Readiness
  isCanvasReady: boolean;
  setCanvasReady: (ready: boolean) => void;
}

// localStorage key of the world the visitor last chose (first-visit chooser, world switcher)
export const WORLD_PREFERENCE_KEY = 'science_lab_world';

// Synchronously read initial URL parameters on client store creation
const getInitialUrlState = () => {
  if (typeof window === 'undefined') {
    return {
      world: 'subatomic' as ActiveWorld,
      cosmicScale: 1 as CosmicScaleLevel,
    };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const worldParam = params.get('world');
    // A link's ?world= wins; otherwise reopen the world the visitor last chose
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(WORLD_PREFERENCE_KEY);
    } catch {
      // storage unavailable (private mode, blocked site data)
    }
    const preferred = worldParam ?? stored;
    const world: ActiveWorld = preferred === 'universe' ? 'universe' : 'subatomic';

    const scaleParam = parseInt(params.get('scale') || '', 10);
    const cosmicScale: CosmicScaleLevel =
      !isNaN(scaleParam) && scaleParam >= 1 && scaleParam <= 5
        ? (scaleParam as CosmicScaleLevel)
        : 1;

    return { world, cosmicScale };
  } catch {
    return {
      world: 'subatomic' as ActiveWorld,
      cosmicScale: 1 as CosmicScaleLevel,
    };
  }
};

const _initialUrl = getInitialUrlState();

export const useQuantumStore = create<QuantumState>((set, get) => ({
  // World Selection (Synchronized with URL on initial mount)
  activeWorld: _initialUrl.world,

  // 3D Canvas Lifecycle & Readiness
  isCanvasReady: false,
  setCanvasReady: (ready: boolean) => set({ isCanvasReady: ready }),

  // Subatomic defaults
  activeElementNum: 6, // Carbon (C, Z=6) by default
  scaleLevel: 1, // Start at Periodic Table (Scale 1)
  previousScaleLevel: 1,

  // Cosmic Universe defaults (Synchronized with URL on initial mount)
  cosmicScaleLevel: _initialUrl.cosmicScale,
  previousCosmicScaleLevel: _initialUrl.cosmicScale,
  adjacentCosmicScaleLevel: null,
  visibleScaleMask: 1 << _initialUrl.cosmicScale,
  galaxyEntryRequest: null,
  insideGalaxyId: null,
  galaxyViewLevel: null,
  selectedCosmicBodyId: null,
  arrivedCosmicBodyId: null,
  instantCardBodyId: null,
  dismissedCardBodyId: null,
  isCardSheetOpen: false,
  scaleNavigationRequest: null,
  continuousZoomRequest: null,
  navigationMode: 'orbit',
  highlightedCosmicElementNum: null,
  isCosmicElementDrawerOpen: false,
  isCosmicDatabaseOpen: false,
  isUniverseVideoModalOpen: false,
  activeUniverseVideoKey: null,

  // Constellations & Minor Bodies defaults
  showConstellations: true,
  selectedConstellationId: null,
  showMinorBodies: true,

  // Platform Tutorial & Speed Multiplier defaults
  isTutorialOpen: false,
  tutorialStep: 0,
  movementSpeedMultiplier: 1.0,

  language: 'en',
  isAudioMuted: false,

  particleFilter: 'all',
  isDossierOpen: false,
  activeDossierTab: 'overview',
  isGridModalOpen: false,
  isBadgeCollapsed: false,
  isVideoModalOpen: false,
  activeVideoType: 'scale',

  selectedNucleonIndex: null,
  selectedNucleonType: null,
  isSeaQuarksActive: false,
  isBetaDecaying: false,
  stringHarmonicMode: 1,
  isExcitedState: false,

  // World Action
  setActiveWorld: (world) => {
    if (get().activeWorld !== world) {
      audioSynth.playScaleWarpSweep('in');
      set({ activeWorld: world, isCanvasReady: false });
    }
  },

  setActiveElement: (num: number) => {
    audioSynth.playClick(1400);
    set({
      activeElementNum: Math.min(118, Math.max(1, num)),
      selectedNucleonIndex: null,
      selectedNucleonType: null,
      isExcitedState: false,
    });
  },

  setScaleLevel: (newScale: ScaleLevel) => {
    const current = get().scaleLevel;
    if (current === newScale) return;

    const direction = newScale > current ? 'in' : 'out';
    audioSynth.playScaleWarpSweep(direction);

    set({
      previousScaleLevel: current,
      scaleLevel: newScale,
    });
  },

  zoomIn: () => {
    const current = get().scaleLevel;
    if (current < 5) {
      get().setScaleLevel((current + 1) as ScaleLevel);
    }
  },

  zoomOut: () => {
    const current = get().scaleLevel;
    if (current > 1) {
      get().setScaleLevel((current - 1) as ScaleLevel);
    }
  },

  setLanguage: (lang) => {
    set({ language: lang });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  },

  toggleLanguage: () => {
    const nextLang = get().language === 'en' ? 'ar' : 'en';
    get().setLanguage(nextLang);
  },

  toggleAudio: () => {
    const newMuted = audioSynth.toggleMute();
    set({ isAudioMuted: newMuted });
  },

  setParticleFilter: (filter) => {
    audioSynth.playClick(1000);
    set({ particleFilter: filter });
  },

  setDossierOpen: (open) => {
    audioSynth.playClick(800);
    set({ isDossierOpen: open });
  },

  setActiveDossierTab: (tab) => {
    audioSynth.playClick(1100);
    set({ activeDossierTab: tab });
  },

  setGridModalOpen: (open) => {
    audioSynth.playClick(900);
    set({ isGridModalOpen: open });
  },

  setBadgeCollapsed: (collapsed) => {
    set({ isBadgeCollapsed: collapsed });
  },

  setVideoModalOpen: (open, type) => {
    audioSynth.playClick(1000);
    set((state) => ({
      isVideoModalOpen: open,
      activeVideoType: type || state.activeVideoType,
    }));
  },

  selectNucleon: (index, type) => {
    set({ selectedNucleonIndex: index, selectedNucleonType: type });
  },

  toggleSeaQuarks: () => {
    audioSynth.playQuarkTriadTone();
    set((state) => ({ isSeaQuarksActive: !state.isSeaQuarksActive }));
  },

  triggerBetaDecay: () => {
    if (get().isBetaDecaying) return;
    audioSynth.playBetaDecayBurst();
    set({ isBetaDecaying: true });

    // Reset after 3.2 seconds
    setTimeout(() => {
      set({ isBetaDecaying: false });
    }, 3200);
  },

  setStringHarmonicMode: (mode) => {
    audioSynth.playStringHarmonic(mode);
    set({ stringHarmonicMode: mode });
  },

  triggerQuantumLeap: () => {
    if (get().isExcitedState) return;
    audioSynth.playQuantumLeapChime();
    set({ isExcitedState: true });

    // Spontaneous emission after 2.4 seconds
    setTimeout(() => {
      audioSynth.playClick(1760);
      set({ isExcitedState: false });
    }, 2400);
  },

  // Cosmic Universe Actions
  setCosmicScaleLevel: (newScale: CosmicScaleLevel) => {
    const current = get().cosmicScaleLevel;
    if (current === newScale) return;

    // Passive update from continuous distance tracker (HUD synchronization)
    // NEVER deselect the active body or trigger a forced camera jump
    set({
      previousCosmicScaleLevel: current,
      cosmicScaleLevel: newScale,
    });
  },

  setAdjacentCosmicScaleLevel: (scale: CosmicScaleLevel | null) => {
    if (get().adjacentCosmicScaleLevel === scale) return;
    set({ adjacentCosmicScaleLevel: scale });
  },

  setVisibleScaleMask: (mask: number) => {
    if (get().visibleScaleMask === mask) return;
    set({ visibleScaleMask: mask });
  },

  requestGalaxyEntry: (id: string, level: GalaxyViewLevel = 3) => {
    // Our own galaxy is entered through its dedicated scales (Milky Way / Stars & Relics / Solar System)
    if (id === 'milky_way_galaxy') {
      get().requestScaleNavigation(level);
      return;
    }
    // Star-system level: fly to (select) the galaxy's featured system, like picking the Solar System
    if (level === 1) {
      const featured = FEATURED_SYSTEMS[id]?.bodyId;
      if (featured) get().setSelectedCosmicBodyId(featured);
      return;
    }
    audioSynth.playScaleWarpSweep('in');
    set({ galaxyEntryRequest: { id, level, timestamp: Date.now() } });
  },

  setGalaxyViewLevel: (level: GalaxyViewLevel | null) => {
    if (get().galaxyViewLevel === level) return;
    set({ galaxyViewLevel: level });
  },

  setInsideGalaxyId: (id: string | null) => {
    if (get().insideGalaxyId === id) return;
    set({ insideGalaxyId: id });
  },

  requestScaleNavigation: (newScale: CosmicScaleLevel) => {
    const current = get().cosmicScaleLevel;
    const direction = newScale > current ? 'in' : 'out';
    audioSynth.playScaleWarpSweep(direction);

    set({
      previousCosmicScaleLevel: current,
      cosmicScaleLevel: newScale,
      selectedCosmicBodyId: null,
      arrivedCosmicBodyId: null,
      scaleNavigationRequest: { level: newScale, timestamp: Date.now() },
    });
  },

  requestContinuousZoom: (direction: 'in' | 'out', factor?: number) => {
    audioSynth.playClick(direction === 'in' ? 1400 : 900);
    const zoomFactor = factor !== undefined ? factor : (direction === 'in' ? 0.45 : 2.2);
    set({
      continuousZoomRequest: { direction, factor: zoomFactor, timestamp: Date.now() },
    });
  },

  cosmicZoomIn: () => {
    get().requestContinuousZoom('in', 0.45);
  },

  cosmicZoomOut: () => {
    get().requestContinuousZoom('out', 2.2);
  },

  setSelectedCosmicBodyId: (id: string | null) => {
    // Re-selecting the current body (e.g. the second click of a double-click) must not restart the card's wait.
    // Once the camera is there, clicking it again brings back a card that was closed.
    if (id && id === get().selectedCosmicBodyId) {
      if (get().arrivedCosmicBodyId === id) get().showCosmicCardNow();
      return;
    }
    if (id) {
      audioSynth.playClick(1200);
      const body = CELESTIAL_BODIES[id];
      if (body) {
        set({
          selectedCosmicBodyId: id,
          arrivedCosmicBodyId: null,
          instantCardBodyId: null,
          dismissedCardBodyId: null,
          cosmicScaleLevel: body.scaleLevel,
        });
        return;
      }
    }
    set({ selectedCosmicBodyId: id, arrivedCosmicBodyId: null, instantCardBodyId: null, dismissedCardBodyId: null });
  },

  setArrivedCosmicBodyId: (id: string | null) => set({ arrivedCosmicBodyId: id }),

  showCosmicCardNow: () => {
    const id = get().selectedCosmicBodyId;
    if (id) set({ instantCardBodyId: id, dismissedCardBodyId: null });
  },

  setCardSheetOpen: (open: boolean) => {
    if (get().isCardSheetOpen !== open) set({ isCardSheetOpen: open });
  },

  dismissCosmicCard: () => {
    const id = get().selectedCosmicBodyId;
    if (id) set({ dismissedCardBodyId: id, instantCardBodyId: null });
  },

  setNavigationMode: (mode: NavigationMode) => {
    audioSynth.playClick(1000);
    set({ navigationMode: mode });
  },

  toggleNavigationMode: () => {
    const nextMode = get().navigationMode === 'orbit' ? 'fly' : 'orbit';
    audioSynth.playClick(1000);
    set({ navigationMode: nextMode });
  },

  setHighlightedCosmicElementNum: (num: number | null) => {
    if (num) {
      audioSynth.playClick(1500);
    }
    set({ highlightedCosmicElementNum: num });
  },

  setCosmicElementDrawerOpen: (open: boolean) => {
    audioSynth.playClick(850);
    set({ isCosmicElementDrawerOpen: open });
  },

  setCosmicDatabaseOpen: (open: boolean) => {
    audioSynth.playClick(880);
    set({ isCosmicDatabaseOpen: open });
  },

  setUniverseVideoModalOpen: (open: boolean, videoKey?: string) => {
    audioSynth.playClick(1000);
    set((state) => ({
      isUniverseVideoModalOpen: open,
      activeUniverseVideoKey: videoKey !== undefined ? videoKey : state.activeUniverseVideoKey,
    }));
  },

  setTutorialOpen: (open: boolean, step?: number) => {
    audioSynth.playClick(1100);
    set({
      isTutorialOpen: open,
      tutorialStep: step !== undefined ? step : 0,
    });
  },

  setTutorialStep: (step: number) => {
    audioSynth.playClick(1200);
    set({ tutorialStep: step });
  },

  setMovementSpeedMultiplier: (mult: number) => {
    audioSynth.playClick(1300);
    set({ movementSpeedMultiplier: mult });
  },

  toggleConstellations: () => {
    audioSynth.playClick(950);
    set((s) => ({ showConstellations: !s.showConstellations }));
  },

  setSelectedConstellationId: (id: string | null) => {
    audioSynth.playClick(880);
    set({ selectedConstellationId: id });
  },

  toggleMinorBodies: () => {
    audioSynth.playClick(900);
    set((s) => ({ showMinorBodies: !s.showMinorBodies }));
  },
}));
