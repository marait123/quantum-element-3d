'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { ELEMENTS, CATEGORY_COLORS, ElementData } from '@/data/elementsData';
import { TRANSLATIONS } from '@/data/translations';
import { useEscapeKey } from '@/lib/useEscapeKey';

export const Element118GridModal: React.FC = () => {
  const isOpen = useQuantumStore((s) => s.isGridModalOpen);
  const setOpen = useQuantumStore((s) => s.setGridModalOpen);
  const activeElementNum = useQuantumStore((s) => s.activeElementNum);
  const setActiveElement = useQuantumStore((s) => s.setActiveElement);
  const language = useQuantumStore((s) => s.language);

  const t = TRANSLATIONS[language];

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filteredElements = useMemo(() => {
    return ELEMENTS.filter((el) => {
      const matchesCat = selectedCat === 'all' || el.cat === selectedCat;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        el.num.toString() === q ||
        el.sym.toLowerCase().includes(q) ||
        el.nameEn.toLowerCase().includes(q) ||
        el.nameAr.includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, selectedCat]);

  const close = useCallback(() => setOpen(false), [setOpen]);
  useEscapeKey(isOpen, close);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="glass-panel-deep w-full max-w-5xl max-h-[90dvh] rounded-3xl flex flex-col border border-sky-500/30 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-700/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              {language === 'ar' ? 'فهرس العناصر الـ 118 الشامل' : 'Complete 118 Element Sheet'}
            </h3>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              {filteredElements.length} / 118
            </span>
          </div>

          <button
            onClick={close}
            className="shrink-0 p-2 coarse:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-slate-700/40 flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCat === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {t.hud.allCategories}
            </button>

            {(Object.keys(CATEGORY_COLORS) as ElementData['cat'][]).map((catKey) => {
              const meta = CATEGORY_COLORS[catKey];
              const isCatActive = selectedCat === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCat(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                    isCatActive
                      ? 'font-bold'
                      : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  style={{
                    backgroundColor: isCatActive ? `${meta.hex}33` : undefined,
                    borderColor: isCatActive ? meta.hex : undefined,
                    color: isCatActive ? meta.hex : undefined,
                  }}
                >
                  {language === 'ar' ? meta.nameAr : meta.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* 118 Element Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {filteredElements.map((el) => {
            const isSelected = el.num === activeElementNum;
            const meta = CATEGORY_COLORS[el.cat];

            return (
              <button
                key={el.num}
                onClick={() => {
                  setActiveElement(el.num);
                  setOpen(false);
                }}
                className={`p-2.5 rounded-xl text-start flex flex-col justify-between h-24 transition border relative group ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <div
                  className="absolute top-0 inset-x-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: meta.hex }}
                />

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">#{el.num}</span>
                  <span className="text-[10px] text-slate-400">
                    {el.mass.toFixed(el.num > 100 ? 0 : 1)}
                  </span>
                </div>

                <div className="text-center my-0.5">
                  <span className="text-xl font-black text-white group-hover:text-cyan-300 transition">
                    {el.sym}
                  </span>
                </div>

                <div className="truncate text-[11px] text-slate-300 text-center font-semibold">
                  {language === 'ar' ? el.nameAr : el.nameEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
