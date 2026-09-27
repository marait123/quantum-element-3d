'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Compass, Sparkles, Orbit, Rocket, ExternalLink } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';

interface Props {
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

export const SpaceSearchBox: React.FC<Props> = ({ isMobileModal, onCloseMobile }) => {
  const language = useQuantumStore((s) => s.language);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const setCosmicScaleLevel = useQuantumStore((s) => s.setCosmicScaleLevel);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const bodiesList = useMemo(() => {
    return Object.values(CELESTIAL_BODIES);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return bodiesList
      .filter((body) => {
        const matchNameEn = body.nameEn.toLowerCase().includes(q);
        const matchNameAr = body.nameAr.includes(q);
        const matchId = body.id.toLowerCase().includes(q);
        const matchType = body.type.toLowerCase().includes(q);
        const matchDescEn = body.descriptionEn.toLowerCase().includes(q);
        const matchDescAr = body.descriptionAr.includes(q);

        // Check matching chemical elements
        const matchElements = body.primaryElements?.some(
          (el) =>
            el.nameEn.toLowerCase().includes(q) ||
            el.nameAr.includes(q) ||
            el.symbol.toLowerCase() === q
        );

        return matchNameEn || matchNameAr || matchId || matchType || matchDescEn || matchDescAr || matchElements;
      })
      .slice(0, 8);
  }, [query, bodiesList]);

  const handleSelect = (body: CelestialBody) => {
    if (body.scaleLevel) {
      setCosmicScaleLevel(body.scaleLevel);
    }
    setSelectedCosmicBodyId(body.id);
    setQuery('');
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'planet':
      case 'dwarf_planet':
        return '🪐';
      case 'moon':
        return '🌑';
      case 'star':
        return '⭐';
      case 'spacecraft':
        return '🛰️';
      case 'black_hole':
        return '🕳️';
      case 'pulsar':
      case 'supernova_remnant':
        return '💥';
      case 'galaxy':
        return '🌌';
      case 'supercluster':
      case 'cosmic_structure':
        return '🕸️';
      default:
        return '✨';
    }
  };

  const getScaleLabel = (scale: number) => {
    if (language === 'ar') {
      switch (scale) {
        case 1:
          return 'المجموعة الشمسية';
        case 2:
          return 'الجوار النجمي';
        case 3:
          return 'درب التبانة';
        case 4:
          return 'خارج المجرة';
        case 5:
          return 'الشبكة الكونية';
        default:
          return `المستوى ${scale}`;
      }
    } else {
      switch (scale) {
        case 1:
          return 'Solar System';
        case 2:
          return 'Stellar Neighborhood';
        case 3:
          return 'Milky Way';
        case 4:
          return 'Extragalactic';
        case 5:
          return 'Cosmic Web';
        default:
          return `Scale ${scale}`;
      }
    }
  };

  return (
    <div
      id="space-search-box-container"
      ref={containerRef}
      className={`relative pointer-events-auto ${isMobileModal ? 'w-full' : 'w-64 md:w-80'}`}
    >
      <div className="relative">
        <Search suppressHydrationWarning className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            language === 'ar'
              ? 'ابحث في الكون (الأرض، أندروميدا، فويجر...)'
              : 'Search cosmos (Earth, Andromeda, JWST...)'
          }
          className="w-full ps-9 pe-8 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/40 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-lg backdrop-blur-md transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1.5 inset-x-0 bg-slate-950/95 border border-purple-500/50 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden py-1.5 z-50 animate-fadeIn divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {results.map((body) => {
            const displayName = language === 'ar' ? body.nameAr : body.nameEn;
            const subtitle = language === 'ar' ? body.nameEn : body.nameAr;
            const icon = getTypeIcon(body.type);
            const scaleTag = getScaleLabel(body.scaleLevel);

            return (
              <button
                key={body.id}
                type="button"
                onClick={() => handleSelect(body)}
                className="w-full text-start px-3.5 py-2.5 hover:bg-purple-950/40 flex items-center justify-between gap-3 transition group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition truncate">
                      {displayName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {subtitle} • {body.distanceFromEarth}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 leading-tight">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-semibold">
                    {scaleTag}
                  </span>
                  <span className="text-[9px] text-slate-400 capitalize mt-0.5">
                    {body.type.replace('_', ' ')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1.5 inset-x-0 bg-slate-950/95 border border-slate-700/60 rounded-xl p-3 text-center text-xs text-slate-400 shadow-xl z-50">
          {language === 'ar' ? 'لم يتم العثور على أجرام مطابقة' : 'No celestial bodies found'}
        </div>
      )}
    </div>
  );
};
