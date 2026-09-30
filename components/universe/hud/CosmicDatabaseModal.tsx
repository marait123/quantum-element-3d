'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody, getCosmicNucleosynthesis, CosmicScaleLevel } from '@/data/universeData';
import { ELEMENTS, ElementData } from '@/data/elementsData';
import { CONSTELLATIONS, ConstellationDefinition } from '@/data/constellationData';
import {
  X,
  Search,
  Database,
  Sparkles,
  Rocket,
  Atom,
  Star,
  Globe,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';

type DatabaseTab = 'bodies' | 'elements' | 'constellations' | 'nasa';

export const CosmicDatabaseModal: React.FC = () => {
  const isCosmicDatabaseOpen = useQuantumStore((s) => s.isCosmicDatabaseOpen);
  const setCosmicDatabaseOpen = useQuantumStore((s) => s.setCosmicDatabaseOpen);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setCosmicScaleLevel = useQuantumStore((s) => s.setCosmicScaleLevel);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setSelectedConstellationId = useQuantumStore((s) => s.setSelectedConstellationId);
  const language = useQuantumStore((s) => s.language);

  const [activeTab, setActiveTab] = useState<DatabaseTab>('bodies');
  const [searchQuery, setSearchQuery] = useState('');
  const [scaleFilter, setScaleFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');

  // NASA Live Archive Query State
  const [nasaCategory, setNasaCategory] = useState<'exoplanets' | 'asteroids'>('exoplanets');
  const [nasaResults, setNasaResults] = useState<any[]>([]);
  const [isNasaLoading, setIsNasaLoading] = useState(false);
  const [nasaError, setNasaError] = useState<string | null>(null);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    if (!isCosmicDatabaseOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCosmicDatabaseOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCosmicDatabaseOpen, setCosmicDatabaseOpen]);

  // Convert CELESTIAL_BODIES dictionary to array
  const allBodiesList = useMemo(() => Object.values(CELESTIAL_BODIES), []);

  // Filtered Bodies
  const filteredBodies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allBodiesList.filter((b) => {
      // Scale filter
      if (scaleFilter !== 'all' && b.scaleLevel !== scaleFilter) return false;

      // Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'planet' && b.type !== 'planet' && b.type !== 'dwarf_planet') return false;
        if (typeFilter === 'star' && !b.type.includes('star')) return false;
        if (typeFilter === 'black_hole' && !b.type.includes('black_hole')) return false;
        if (typeFilter === 'nebula' && !b.type.includes('nebula')) return false;
        if (typeFilter === 'galaxy' && b.type !== 'galaxy') return false;
        if (typeFilter === 'moon' && b.type !== 'moon') return false;
      }

      // Query filter
      if (!q) return true;
      return (
        b.id.toLowerCase().includes(q) ||
        b.nameEn.toLowerCase().includes(q) ||
        b.nameAr.includes(q) ||
        b.type.toLowerCase().includes(q) ||
        (b.imageSource && b.imageSource.toLowerCase().includes(q))
      );
    });
  }, [allBodiesList, searchQuery, scaleFilter, typeFilter]);

  // Filtered Elements
  const filteredElements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ELEMENTS.filter((el) => {
      const nucleo = getCosmicNucleosynthesis(el.num);

      // Origin filter
      if (originFilter !== 'all' && nucleo.source !== originFilter) return false;

      // Query filter
      if (!q) return true;
      return (
        el.num.toString().includes(q) ||
        el.sym.toLowerCase().includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        el.nameAr.includes(q) ||
        nucleo.sourceNameEn.toLowerCase().includes(q) ||
        nucleo.sourceNameAr.includes(q)
      );
    });
  }, [searchQuery, originFilter]);

  // Constellations list as array
  const allConstellationsList = useMemo(() => Object.values(CONSTELLATIONS), []);

  // Filtered Constellations
  const filteredConstellations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allConstellationsList;
    return allConstellationsList.filter(
      (c: ConstellationDefinition) =>
        c.id.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.includes(q) ||
        c.latinName.toLowerCase().includes(q)
    );
  }, [allConstellationsList, searchQuery]);

  // Query official NASA API gateways
  const fetchNasaData = useCallback(async (cat: 'exoplanets' | 'asteroids', q: string) => {
    setIsNasaLoading(true);
    setNasaError(null);
    try {
      const endpoint =
        cat === 'exoplanets'
          ? `/api/nasa/exoplanets?q=${encodeURIComponent(q)}&limit=30`
          : `/api/nasa/asteroids?q=${encodeURIComponent(q || 'bennu')}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to query NASA gateway');
      setNasaResults(json.data || []);
    } catch (err: any) {
      setNasaError(err.message || 'Error communicating with NASA gateway');
    } finally {
      setIsNasaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isCosmicDatabaseOpen && activeTab === 'nasa') {
      const timer = setTimeout(() => {
        fetchNasaData(nasaCategory, searchQuery);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isCosmicDatabaseOpen, activeTab, nasaCategory, searchQuery, fetchNasaData]);

  const handleFlyToBody = (body: CelestialBody) => {
    setCosmicDatabaseOpen(false);
    setCosmicScaleLevel(body.scaleLevel as CosmicScaleLevel);
    setSelectedCosmicBodyId(body.id);
  };

  const handleFlyToNasaLive = (item: any) => {
    setCosmicDatabaseOpen(false);
    setCosmicScaleLevel(item.scaleLevel as CosmicScaleLevel);
    if (!CELESTIAL_BODIES[item.id]) {
      (CELESTIAL_BODIES as any)[item.id] = item;
    }
    setSelectedCosmicBodyId(item.id);
  };

  const handleFlyToElementSource = (element: ElementData) => {
    const nucleo = getCosmicNucleosynthesis(element.num);
    setHighlightedCosmicElementNum(element.num);

    if (nucleo.keyCosmicBodyIds && nucleo.keyCosmicBodyIds.length > 0) {
      const targetBodyId = nucleo.keyCosmicBodyIds[0];
      const targetBody = CELESTIAL_BODIES[targetBodyId];
      if (targetBody) {
        setCosmicDatabaseOpen(false);
        setCosmicScaleLevel(targetBody.scaleLevel as CosmicScaleLevel);
        setSelectedCosmicBodyId(targetBody.id);
        return;
      }
    }
    setCosmicDatabaseOpen(false);
  };

  const handleViewConstellation = (c: ConstellationDefinition) => {
    setCosmicDatabaseOpen(false);
    useQuantumStore.setState({ showConstellations: true });
    setSelectedConstellationId(c.id);
  };

  if (!isCosmicDatabaseOpen) return null;

  return (
    <div
      id="cosmic-database-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCosmicDatabaseOpen(false);
      }}
    >
      <div className="relative w-full max-w-6xl max-h-[92dvh] flex flex-col rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:block p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-base sm:text-xl font-bold text-white tracking-wide">
                  {language === 'ar' ? 'الموسوعة وقاعدة البيانات الكونية' : 'Master Cosmic Database & Encyclopedia'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {allBodiesList.length + ELEMENTS.length + allConstellationsList.length} {language === 'ar' ? 'كيان' : 'Entities'}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400">
                {language === 'ar'
                  ? `فهرس شامل للأجرام السماوية (${allBodiesList.length}) والعناصر الكونية (${ELEMENTS.length}) والكوكبات (${allConstellationsList.length}) مع ربط مباشر بقواعد بيانات ناسا الرسمية`
                  : `Complete catalog of Celestial Bodies (${allBodiesList.length}), Cosmic Elements (${ELEMENTS.length}), Constellations (${allConstellationsList.length}), and live NASA Archives`}
              </p>
            </div>
          </div>

          <button
            id="close-cosmic-database-btn"
            type="button"
            onClick={() => setCosmicDatabaseOpen(false)}
            className="shrink-0 p-2 coarse:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search & Tab Switcher Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {/* Main Tabs (scroll sideways on phones) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="tab-btn-bodies"
              onClick={() => setActiveTab('bodies')}
              className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 coarse:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bodies'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الأجرام السماوية' : 'Celestial Bodies'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-current font-mono">
                {allBodiesList.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-elements"
              onClick={() => setActiveTab('elements')}
              className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 coarse:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'elements'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'العناصر الكونية' : 'Cosmic Elements'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-current font-mono">
                {ELEMENTS.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-constellations"
              onClick={() => setActiveTab('constellations')}
              className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 coarse:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'constellations'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الكوكبات النجمية' : 'Constellations'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-current font-mono">
                {allConstellationsList.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-nasa"
              onClick={() => setActiveTab('nasa')}
              className={`shrink-0 whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 coarse:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'nasa'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'ar' ? 'أرشيفات ناسا الحية' : 'NASA Live Archives'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono">
                API
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="cosmic-database-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'ابحث بالاسم، المعرف، النوع، أو الأداة...'
                  : 'Search by name, ID, type, or instrument...'
              }
              className="w-full ps-9 pe-4 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {activeTab === 'bodies' && (
            <>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px] me-1">
                  <Layers className="w-3 h-3" />
                  {language === 'ar' ? 'المستوى:' : 'Scale:'}
                </span>
                {[
                  { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 1, label: language === 'ar' ? 'النظام الشمسي' : 'Solar' },
                  { id: 2, label: language === 'ar' ? 'الجوار النجمي' : 'Stars' },
                  { id: 3, label: language === 'ar' ? 'درب التبانة' : 'Milky Way' },
                  { id: 4, label: language === 'ar' ? 'خارج المجرة' : 'Extragalactic' },
                  { id: 5, label: language === 'ar' ? 'الشبكة الكونية' : 'Cosmic Web' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScaleFilter(s.id as number | 'all')}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      scaleFilter === s.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px] me-1">
                  <Filter className="w-3 h-3" />
                  {language === 'ar' ? 'النوع:' : 'Type:'}
                </span>
                {[
                  { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 'planet', label: language === 'ar' ? 'كواكب' : 'Planets' },
                  { id: 'star', label: language === 'ar' ? 'نجوم' : 'Stars' },
                  { id: 'black_hole', label: language === 'ar' ? 'ثقوب سوداء' : 'Black Holes' },
                  { id: 'nebula', label: language === 'ar' ? 'سدم' : 'Nebulae' },
                  { id: 'galaxy', label: language === 'ar' ? 'مجرات' : 'Galaxies' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                      typeFilter === t.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                        : 'bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'elements' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 w-full">
              <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px] me-1">
                <Sparkles className="w-3 h-3" />
                {language === 'ar' ? 'أصل التخليق:' : 'Cosmic Origin:'}
              </span>
              {[
                { id: 'all', label: language === 'ar' ? 'الكل' : 'All (118)' },
                { id: 'big_bang', label: language === 'ar' ? 'الانفجار العظيم' : 'Big Bang' },
                { id: 'exploding_massive_stars', label: language === 'ar' ? 'مستعرات عظمى' : 'Supernovae' },
                { id: 'merging_neutron_stars', label: language === 'ar' ? 'اندماج نجوم نيوترونية' : 'Kilonovae' },
                { id: 'dying_low_mass_stars', label: language === 'ar' ? 'نجوم عملاقة' : 'AGB Stars' },
                { id: 'exploding_white_dwarfs', label: language === 'ar' ? 'أقزام بيضاء' : 'White Dwarfs' },
                { id: 'synthetic', label: language === 'ar' ? 'مخبري' : 'Synthetic' },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOriginFilter(o.id)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                    originFilter === o.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'constellations' && (
            <div className="text-slate-400 font-mono text-xs">
              {language === 'ar'
                ? '12 كوكبة رئيسية متصلة بالنجوم الفعلية وتوزيعها ثلاثي الأبعاد في درب التبانة'
                : '12 prominent sky constellations mapped to real 3D coordinates in the Milky Way'}
            </div>
          )}
        </div>

        {/* Content Area with Smooth Scrolling */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* TAB 1: CELESTIAL BODIES */}
          {activeTab === 'bodies' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredBodies.map((body) => {
                const scaleBadge =
                  body.scaleLevel === 1
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : body.scaleLevel === 2
                    ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                    : body.scaleLevel === 3
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                    : body.scaleLevel === 4
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40';

                return (
                  <div
                    key={body.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-950/90 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {language === 'ar' ? body.nameAr : body.nameEn}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            {language === 'ar' ? body.nameEn : body.nameAr}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${scaleBadge}`}
                        >
                          Level {body.scaleLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-3">
                        <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">
                            {language === 'ar' ? 'النوع' : 'Type'}
                          </span>
                          <span className="text-slate-300 font-semibold truncate block capitalize">
                            {body.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">
                            {language === 'ar' ? 'المسافة' : 'Distance'}
                          </span>
                          <span className="text-slate-300 font-semibold truncate block">
                            {body.distanceFromEarth || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {language === 'ar' ? body.descriptionAr : body.descriptionEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      id={`fly-to-body-${body.id}`}
                      onClick={() => handleFlyToBody(body)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md group-hover:scale-[1.02]"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'انطلق في الفضاء 3D' : 'Fly To in 3D'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ms-auto" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: COSMIC CHEMICAL ELEMENTS */}
          {activeTab === 'elements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredElements.map((el) => {
                const nucleo = getCosmicNucleosynthesis(el.num);

                return (
                  <div
                    key={el.num}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-950/90 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold flex flex-col items-center justify-center text-sm shadow-md">
                            <span>{el.sym}</span>
                            <span className="text-[9px] text-slate-400 -mt-1">{el.num}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                              {language === 'ar' ? el.nameAr : el.nameEn}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              {language === 'ar' ? el.nameEn : el.nameAr} • {el.mass.toFixed(2)} u
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 mb-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-amber-400 font-semibold">
                            {language === 'ar' ? nucleo.sourceNameAr : nucleo.sourceNameEn}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {language === 'ar' ? nucleo.explanationAr : nucleo.explanationEn}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {language === 'ar' ? nucleo.primaryLocationAr : nucleo.primaryLocationEn}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id={`fly-to-element-${el.num}`}
                      onClick={() => handleFlyToElementSource(el)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md group-hover:scale-[1.02]"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'حدد مصدره الكوني 3D' : 'Locate Cosmic Forge in 3D'}</span>
                      <ChevronRight className="w-3.5 h-3.5 ms-auto" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CONSTELLATIONS */}
          {activeTab === 'constellations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredConstellations.map((c: ConstellationDefinition) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950/90 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                          {language === 'ar' ? c.nameAr : c.nameEn}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          {c.latinName} ({c.nameEn})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                        {c.stars.length} Stars
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{language === 'ar' ? 'العائلة:' : 'Family:'}</span>
                        <span className="text-indigo-300 font-semibold">{language === 'ar' ? c.familyAr : c.familyEn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{language === 'ar' ? 'الموقع الفلكي:' : 'Position:'}</span>
                        <span className="text-slate-300 font-mono">[{c.centerPosition.join(', ')}]</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3">
                      {language === 'ar' ? c.loreAr : c.loreEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    id={`view-constellation-${c.id}`}
                    onClick={() => handleViewConstellation(c)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-md group-hover:scale-[1.02]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'مشاهدة الكوكبة في السماء' : 'View in Sky 3D'}</span>
                    <ChevronRight className="w-3.5 h-3.5 ms-auto" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: NASA OFFICIAL LIVE ARCHIVES */}
          {activeTab === 'nasa' && (
            <div className="space-y-4">
              {/* NASA Category Sub-Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="nasa-subtab-exoplanets"
                    onClick={() => setNasaCategory('exoplanets')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      nasaCategory === 'exoplanets'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🪐 {language === 'ar' ? 'أرشيف الكواكب الخارجية (5,700+ كوكب)' : 'NASA Exoplanet Archive (5,700+ Planets)'}</span>
                  </button>
                  <button
                    type="button"
                    id="nasa-subtab-asteroids"
                    onClick={() => setNasaCategory('asteroids')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      nasaCategory === 'asteroids'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>☄️ {language === 'ar' ? 'قاعدة الأجرام الصغيرة JPL (1.35M كويكب ومذنب)' : 'JPL Small-Body DB (1.35M Asteroids)'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{language === 'ar' ? 'متصل ببوابة NASA TAP الحية' : 'Live NASA Gateway Connected'}</span>
                </div>
              </div>

              {/* Loading State */}
              {isNasaLoading && (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-blue-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-mono text-slate-300">
                    {language === 'ar' ? 'جارٍ جلب البيانات الرسمية من خوادم ناسا و Caltech IPAC...' : 'Querying official NASA TAP / SBDB servers in real time...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {nasaError && !isNasaLoading && (
                <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
                  <p className="text-xs text-red-300 font-mono">{nasaError}</p>
                  <button
                    type="button"
                    onClick={() => fetchNasaData(nasaCategory, searchQuery)}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'إعادة المحاولة' : 'Retry Query'}
                  </button>
                </div>
              )}

              {/* NASA Live Results Grid */}
              {!isNasaLoading && !nasaError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {nasaResults.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-950/90 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                              {language === 'ar' ? item.nameAr : item.nameEn}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              {item.source}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-500/40">
                            {item.discoveryYear ? `Year ${item.discoveryYear}` : item.orbitClass || 'NASA Record'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-1 mb-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{language === 'ar' ? 'المسافة:' : 'Distance:'}</span>
                            <span className="text-slate-200">{item.distanceFromEarth}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{language === 'ar' ? 'نصف القطر:' : 'Radius:'}</span>
                            <span className="text-blue-300 font-semibold">{item.radius}</span>
                          </div>
                          {item.discoveryMethod && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">{language === 'ar' ? 'طريقة الاكتشاف:' : 'Discovery Method:'}</span>
                              <span className="text-slate-300">{item.discoveryMethod}</span>
                            </div>
                          )}
                          {item.temperature && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">{language === 'ar' ? 'الحرارة التوازنية:' : 'Equilibrium Temp:'}</span>
                              <span className="text-amber-300">{item.temperature}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-3">
                          {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                        </p>
                      </div>

                      <button
                        type="button"
                        id={`fly-to-nasa-${item.id}`}
                        onClick={() => handleFlyToNasaLive(item)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-400 text-blue-200 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-md group-hover:scale-[1.02]"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'انطلق في الفضاء 3D' : 'Fly To in 3D'}</span>
                        <ChevronRight className="w-3.5 h-3.5 ms-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {((activeTab === 'bodies' && filteredBodies.length === 0) ||
            (activeTab === 'elements' && filteredElements.length === 0) ||
            (activeTab === 'constellations' && filteredConstellations.length === 0) ||
            (activeTab === 'nasa' && !isNasaLoading && !nasaError && nasaResults.length === 0)) && (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              {language === 'ar' ? 'لم يتم العثور على أي نتائج مطابقة للبحث' : 'No matching entities found in database.'}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              100% In-Memory Offline Index
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline">Query Latency: &lt; 1 ms</span>
          </div>

          <div className="text-slate-500">
            {language === 'ar'
              ? 'مبني ببيانات موثوقة من وكالة ناسا ومرصد هابل وتلسكوب جيمس ويب الفضائي'
              : 'Grounded in astrophysical data from NASA, ESA, Hubble & JWST'}
          </div>
        </div>
      </div>
    </div>
  );
};
