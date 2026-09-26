import { create } from 'zustand';
import { audioSynth } from '@/lib/audioSynth';
import { CosmicScaleLevel, CELESTIAL_BODIES } from '@/data/universeData';

export type ScaleLevel = 1 | 2 | 3 | 4 | 5;
export type ParticleFilter = 'all' | 'protons' | 'neutrons' | 'electrons';
export type DossierTab = 'overview' | 'shells' | 'qcd' | 'strings' | 'papers';

export type ActiveWorld = 'subatomic' | 'universe';
export type NavigationMode = 'orbit' | 'fly';

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
  selectedCosmicBodyId: string | null;
  navigationMode: NavigationMode;
  highlightedCosmicElementNum: number | null;
  isCosmicElementDrawerOpen: boolean;
  isUniverseVideoModalOpen: boolean;
  activeUniverseVideoKey: string | null;

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
  cosmicZoomIn: () => void;
  cosmicZoomOut: () => void;
  setSelectedCosmicBodyId: (id: string | null) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  toggleNavigationMode: () => void;
  setHighlightedCosmicElementNum: (num: number | null) => void;
  setCosmicElementDrawerOpen: (open: boolean) => void;
  setUniverseVideoModalOpen: (open: boolean, videoKey?: string) => void;

  // Tutorial & Speed Actions
  setTutorialOpen: (open: boolean, step?: number) => void;
  setTutorialStep: (step: number) => void;
  setMovementSpeedMultiplier: (mult: number) => void;
}

export const useQuantumStore = create<QuantumState>((set, get) => ({
  // World Selection
  activeWorld: 'subatomic',

  // Subatomic defaults
  activeElementNum: 6, // Carbon (C, Z=6) by default
  scaleLevel: 1, // Start at Periodic Table (Scale 1)
  previousScaleLevel: 1,

  // Cosmic Universe defaults
  cosmicScaleLevel: 1, // Start at Solar System (Cosmic Scale 1)
  previousCosmicScaleLevel: 1,
  selectedCosmicBodyId: null,
  navigationMode: 'orbit',
  highlightedCosmicElementNum: null,
  isCosmicElementDrawerOpen: false,
  isUniverseVideoModalOpen: false,
  activeUniverseVideoKey: null,

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
    audioSynth.playScaleWarpSweep('in');
    set({ activeWorld: world });
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

    const direction = newScale > current ? 'in' : 'out';
    audioSynth.playScaleWarpSweep(direction);

    const currentBodyId = get().selectedCosmicBodyId;
    const body = currentBodyId ? CELESTIAL_BODIES[currentBodyId] : null;
    const shouldKeepBody = body && body.scaleLevel === newScale;

    set({
      previousCosmicScaleLevel: current,
      cosmicScaleLevel: newScale,
      selectedCosmicBodyId: shouldKeepBody ? currentBodyId : null,
    });
  },

  cosmicZoomIn: () => {
    const current = get().cosmicScaleLevel;
    if (current < 5) {
      get().setCosmicScaleLevel((current + 1) as CosmicScaleLevel);
    }
  },

  cosmicZoomOut: () => {
    const current = get().cosmicScaleLevel;
    if (current > 1) {
      get().setCosmicScaleLevel((current - 1) as CosmicScaleLevel);
    }
  },

  setSelectedCosmicBodyId: (id: string | null) => {
    if (id) {
      audioSynth.playClick(1200);
      const body = CELESTIAL_BODIES[id];
      if (body) {
        set({
          selectedCosmicBodyId: id,
          cosmicScaleLevel: body.scaleLevel,
        });
        return;
      }
    }
    set({ selectedCosmicBodyId: id });
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
}));
