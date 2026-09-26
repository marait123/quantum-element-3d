import { create } from 'zustand';
import { audioSynth } from '@/lib/audioSynth';

export type ScaleLevel = 1 | 2 | 3 | 4 | 5;
export type ParticleFilter = 'all' | 'protons' | 'neutrons' | 'electrons';
export type DossierTab = 'overview' | 'shells' | 'qcd' | 'strings' | 'papers';

interface QuantumState {
  // Navigation & Scale
  activeElementNum: number;
  scaleLevel: ScaleLevel;
  previousScaleLevel: ScaleLevel;

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

  // Interactive Scene States
  selectedNucleonIndex: number | null;
  selectedNucleonType: 'proton' | 'neutron' | null;
  isSeaQuarksActive: boolean;
  isBetaDecaying: boolean;
  stringHarmonicMode: number; // 1: electron, 2: quark, 3: photon, 4: graviton
  isExcitedState: boolean;

  // Actions
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
}

export const useQuantumStore = create<QuantumState>((set, get) => ({
  activeElementNum: 6, // Carbon (C, Z=6) by default
  scaleLevel: 1, // Start at Periodic Table (Scale 1)
  previousScaleLevel: 1,

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
}));
