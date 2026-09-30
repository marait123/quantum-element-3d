'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CONSTELLATIONS } from '@/data/constellationData';
import { CELESTIAL_BODIES } from '@/data/universeData';
import {
  X,
  Sparkles,
  Compass,
  ChevronDown,
  ChevronUp,
  Move,
  ExternalLink,
  Target,
} from 'lucide-react';
import { useDraggableCard } from '@/lib/useDraggableCard';
import { useIsCompact } from '@/lib/useMediaQuery';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const ConstellationInspectorTooltip: React.FC = () => {
  const selectedConstellationId = useQuantumStore((s) => s.selectedConstellationId);
  const setSelectedConstellationId = useQuantumStore((s) => s.setSelectedConstellationId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const language = useQuantumStore((s) => s.language);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCompact = useIsCompact();

  const { pos, isDragging, handlePointerDown } = useDraggableCard({
    initialX: 20,
    initialY: 76,
    cardWidth: 384,
    cardHeight: 520,
    disabledOnMobile: true,
  });

  if (!selectedConstellationId || !CONSTELLATIONS[selectedConstellationId]) {
    return null;
  }

  const constellation = CONSTELLATIONS[selectedConstellationId];
  const displayName = language === 'ar' ? constellation.nameAr : constellation.nameEn;
  const description = language === 'ar' ? constellation.descriptionAr : constellation.descriptionEn;
  const lore = language === 'ar' ? constellation.loreAr : constellation.loreEn;
  const family = language === 'ar' ? constellation.familyAr : constellation.familyEn;

  const t = {
    expand: language === 'ar' ? 'توسيع' : 'Expand',
    collapse: language === 'ar' ? 'تصغير' : 'Collapse',
    close: language === 'ar' ? 'إغلاق' : 'Close',
  };

  const titleBlock = (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
            {language === 'ar' ? 'كوكبة نجمية' : 'Constellation'}
          </span>
          <span className="text-[11px] font-mono text-slate-400 truncate">
            {constellation.abbreviation} • {constellation.latinName}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-100 leading-tight truncate">
          {displayName}
        </h3>
      </div>
    </div>
  );

  const closeButton = (
    <button
      type="button"
      onClick={() => setSelectedConstellationId(null)}
      className="p-1 coarse:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
      title={t.close}
      aria-label={t.close}
    >
      <X className="w-4 h-4 coarse:w-5 coarse:h-5" />
    </button>
  );

  const details = (
    <>
      {/* Constellation Preview Image */}
      {constellation.imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-md">
          <a
            href={constellation.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-zoom-in"
            title={language === 'ar' ? 'فتح الصورة كاملة في علامة تبويب جديدة' : 'Open the full image in a new tab'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={constellation.imageUrl}
              alt={constellation.nameEn}
              className="w-full h-36 object-cover"
            />
          </a>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 start-2 end-2 flex items-center justify-between text-[10px] text-slate-400 pointer-events-none">
            <span className="font-mono text-amber-300 font-bold">{family}</span>
            <span className="italic truncate max-w-[180px]">{constellation.imageSource}</span>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 leading-relaxed text-slate-300">
        {description}
      </div>

      {/* Mythology & Cultural Heritage */}
      <div className="bg-amber-950/20 rounded-xl p-3 border border-amber-900/40 space-y-1">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
          <Compass className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'التراث والأساطير الفلكية' : 'Mythology & Astronomical Lore'}</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {lore}
        </p>
      </div>

      {/* Constituent Stars List */}
      <div className="space-y-1.5">
        <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-slate-400 flex items-center gap-1">
          <span>{language === 'ar' ? 'أبرز نجوم الكوكبة' : 'Key Asterism Stars'}</span>
          <span className="text-[10px] text-amber-400 font-bold">({constellation.stars.length})</span>
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {constellation.stars.map((star) => (
            <div
              key={star.id}
              className="p-2 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-[11px]"
            >
              <div className="truncate">
                <div className="font-bold text-slate-200 truncate">
                  {language === 'ar' ? star.nameAr : star.nameEn}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Mag: {star.magnitude.toFixed(1)}
                </div>
              </div>
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: star.color }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Deep Sky Objects inside constellation */}
      {constellation.deepSkyObjects && constellation.deepSkyObjects.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <h4 className="text-[11px] uppercase tracking-wider font-mono font-bold text-cyan-400">
            {language === 'ar' ? 'أجرام سماوية عميقة داخل الكوكبة' : 'Deep-Sky Objects Located Here'}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {constellation.deepSkyObjects.map((objId) => {
              const body = CELESTIAL_BODIES[objId];
              if (!body) return null;
              return (
                <button
                  key={objId}
                  type="button"
                  onClick={() => {
                    setSelectedConstellationId(null);
                    setSelectedCosmicBodyId(objId);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  <Target className="w-3 h-3 text-cyan-400" />
                  <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  // Phones: a bottom sheet instead of a floating card
  if (isCompact) {
    return (
      <BottomSheet
        ariaLabel={displayName}
        animationKey={selectedConstellationId}
        zIndexClass="z-50"
        header={titleBlock}
        actions={closeButton}
      >
        <div id="constellation-inspector-tooltip" className="p-4 space-y-3.5 text-xs">
          {details}
        </div>
      </BottomSheet>
    );
  }

  return (
    <div
      id="constellation-inspector-tooltip"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
      className={`fixed z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl text-slate-100 transition-shadow duration-200 select-none ${
        isDragging ? 'shadow-amber-500/20 ring-2 ring-amber-400/40 cursor-grabbing' : ''
      }`}
    >
      {/* Header bar (Draggable) */}
      <div
        onPointerDown={handlePointerDown}
        className="flex items-center justify-between gap-2 p-3.5 border-b border-slate-800/80 cursor-grab active:cursor-grabbing bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-transparent rounded-t-2xl"
      >
        <div className="flex-1 min-w-0">{titleBlock}</div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 coarse:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isCollapsed ? t.expand : t.collapse}
            aria-label={isCollapsed ? t.expand : t.collapse}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {closeButton}
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-3.5 max-h-[70dvh] overflow-y-auto custom-scrollbar text-xs">
          {details}
        </div>
      )}
    </div>
  );
};
