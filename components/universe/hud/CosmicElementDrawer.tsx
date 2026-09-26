'use client';

import React, { useState, useMemo } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENTS } from '@/data/elementsData';
import { getCosmicNucleosynthesis, CELESTIAL_BODIES, CosmicScaleLevel } from '@/data/universeData';
import { X, Search, Sparkles, MapPin, Atom, Compass, ArrowRight } from 'lucide-react';

export const CosmicElementDrawer: React.FC = () => {
  const isCosmicElementDrawerOpen = useQuantumStore((s) => s.isCosmicElementDrawerOpen);
  const setCosmicElementDrawerOpen = useQuantumStore((s) => s.setCosmicElementDrawerOpen);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);
  const setHighlightedCosmicElementNum = useQuantumStore((s) => s.setHighlightedCosmicElementNum);
  const setCosmicScaleLevel = useQuantumStore((s) => s.setCosmicScaleLevel);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const language = useQuantumStore((s) => s.language);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNum, setSelectedNum] = useState<number>(highlightedCosmicElementNum || 79); // Default to Gold (79)

  // Filter elements by symbol, name, or atomic number
  const filteredElements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return ELEMENTS;
    return ELEMENTS.filter(
      (el) =>
        el.num.toString().includes(q) ||
        el.sym.toLowerCase().includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        el.nameAr.includes(q)
    );
  }, [searchQuery]);

  const activeElement = useMemo(
    () => ELEMENTS.find((e) => e.num === selectedNum) || ELEMENTS[78], // Gold (num: 79)
    [selectedNum]
  );

  const nucleoInfo = useMemo(
    () => getCosmicNucleosynthesis(activeElement.num),
    [activeElement.num]
  );

  if (!isCosmicElementDrawerOpen) return null;

  const handleLocateIn3D = () => {
    setHighlightedCosmicElementNum(activeElement.num);

    // If key bodies exist, jump to the first one's scale and select it!
    if (nucleoInfo.keyCosmicBodyIds && nucleoInfo.keyCosmicBodyIds.length > 0) {
      const firstBodyId = nucleoInfo.keyCosmicBodyIds[0];
      const body = CELESTIAL_BODIES[firstBodyId];
      if (body) {
        setCosmicScaleLevel(body.scaleLevel as CosmicScaleLevel);
        setSelectedCosmicBodyId(body.id);
      }
    }
  };

  return (
    <div className="fixed inset-y-0 end-0 z-50 w-full sm:w-[460px] bg-slate-950/95 border-s border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col text-slate-100 animate-slideInRight">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-white">
              {language === 'ar' ? 'أصل العناصر في الكون 3D' : 'Cosmic Origin of Elements 3D'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ar'
                ? 'أين وكيف خُلقت عناصر الجدول الدوري الـ 118 في الفضاء؟'
                : 'Where & how all 118 elements were forged in space'}
            </p>
          </div>
        </div>
        <button
          id="close-cosmic-drawer-btn"
          type="button"
          onClick={() => setCosmicElementDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث باسم العنصر أو رمزه أو عدده الذري...'
                : 'Search element by name, symbol, or Z...'
            }
            className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Quick Pick Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-[11px]">
          {[1, 2, 6, 8, 26, 78, 79, 92, 94].map((z) => {
            const el = ELEMENTS.find((e) => e.num === z);
            if (!el) return null;
            const isSelected = selectedNum === z;
            return (
              <button
                key={z}
                type="button"
                onClick={() => setSelectedNum(z)}
                className={`px-2 py-1 rounded-lg font-mono font-bold transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {el.sym} ({z})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Active Element Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-0.5">
                Atomic #{activeElement.num} • Row {activeElement.row} • Col {activeElement.col}
              </span>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>{language === 'ar' ? activeElement.nameAr : activeElement.nameEn}</span>
                <span className="text-sm font-mono text-amber-400 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-800/80">
                  {activeElement.sym}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 capitalize">
                {activeElement.cat} • {activeElement.mass.toFixed(2)} u
              </p>
            </div>

            <button
              type="button"
              onClick={handleLocateIn3D}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تحديد في الفضاء 3D' : 'Locate in 3D'}</span>
            </button>
          </div>
        </div>

        {/* Cosmic Nucleosynthesis Factory Box */}
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>{language === 'ar' ? 'المصنع الكوني للعنصر' : 'Cosmic Production Factory'}</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-700/50">
            <span className="text-[11px] font-bold text-purple-200 block">
              {language === 'ar' ? nucleoInfo.sourceNameAr : nucleoInfo.sourceNameEn}
            </span>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {language === 'ar' ? nucleoInfo.explanationAr : nucleoInfo.explanationEn}
            </p>
          </div>
        </div>

        {/* 3D Celestial Locations */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Atom className="w-4 h-4 text-cyan-400" />
            <span>{language === 'ar' ? 'أبرز مواقعه في الكون المرصود' : 'Prominent Locations in Space'}</span>
          </h4>

          <div className="space-y-2">
            {nucleoInfo.keyCosmicBodyIds.map((bodyId) => {
              const body = CELESTIAL_BODIES[bodyId];
              if (!body) return null;
              const bodyName = language === 'ar' ? body.nameAr : body.nameEn;

              return (
                <button
                  key={bodyId}
                  type="button"
                  onClick={() => {
                    setCosmicScaleLevel(body.scaleLevel as CosmicScaleLevel);
                    setSelectedCosmicBodyId(body.id);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                      style={{ backgroundColor: body.color }}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {bodyName}
                      </span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        {body.type.replace('_', ' ')} • {body.distanceFromEarth}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse All 118 Elements Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 mb-2">
            {language === 'ar' ? 'اختر أي عنصر آخر (1 - 118)' : 'Select Any Element (1 - 118)'}
          </h4>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto p-1 rounded-xl bg-slate-900/50 border border-slate-800">
            {filteredElements.map((el) => {
              const isSelected = selectedNum === el.num;
              return (
                <button
                  key={el.num}
                  type="button"
                  onClick={() => setSelectedNum(el.num)}
                  className={`p-1.5 rounded-lg text-center transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px]'
                  }`}
                >
                  <div className="font-mono text-[10px] opacity-70 leading-none">{el.num}</div>
                  <div className="font-bold text-xs leading-tight">{el.sym}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
