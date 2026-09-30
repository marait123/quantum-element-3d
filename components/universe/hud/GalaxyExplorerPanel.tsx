'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Compass, X } from 'lucide-react';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGalaxyMembers } from '@/lib/galaxyInteriors';
import { GALAXY_SHORT_NAMES } from './CosmicScaleDock';
import { useIsCompact } from '@/lib/useMediaQuery';
import { BottomSheet } from '@/components/ui/BottomSheet';

// Destinations inside the galaxy the camera is in: every catalogued star, planetary system, cluster, nebula and
// black hole, one click to fly there — the in-galaxy equivalent of picking a star in the Milky Way.

type GroupKey = 'planets' | 'stars' | 'clusters' | 'remnants' | 'structures';

const GROUPS: { key: GroupKey; icon: string; en: string; ar: string }[] = [
  { key: 'planets', icon: '🪐', en: 'Planetary systems', ar: 'أنظمة كوكبية' },
  { key: 'stars', icon: '⭐', en: 'Stars', ar: 'النجوم' },
  { key: 'clusters', icon: '✨', en: 'Star clusters & nebulae', ar: 'العناقيد النجمية والسدم' },
  { key: 'remnants', icon: '🕳️', en: 'Black holes & stellar remnants', ar: 'الثقوب السوداء وبقايا النجوم' },
  { key: 'structures', icon: '🌌', en: 'Satellites & structures', ar: 'المجرات التابعة والبنى' },
];

function groupOf(body: CelestialBody, planetHosts: Set<string>): GroupKey {
  if (body.type === 'planet' || planetHosts.has(body.id)) return 'planets';
  if (body.type === 'star' || body.type === 'pulsar') return 'stars';
  if (body.type === 'star_cluster' || body.type === 'nebula') return 'clusters';
  if (body.type === 'black_hole' || body.type === 'supernova' || body.type === 'supernova_remnant') return 'remnants';
  return 'structures';
}

export const GalaxyExplorerPanel: React.FC = () => {
  const insideGalaxyId = useQuantumStore((s) => s.insideGalaxyId);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const language = useQuantumStore((s) => s.language);
  // Our own galaxy has many destinations and its own scales, so its list starts collapsed
  const [collapsedByGalaxy, setCollapsedByGalaxy] = useState<Record<string, boolean>>({ milky_way_galaxy: true });
  // Phones: a chip under the header that opens the list in a bottom sheet
  const isCompact = useIsCompact();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const groups = useMemo(() => {
    if (!insideGalaxyId) return [];
    const members = getGalaxyMembers(insideGalaxyId).map((id) => CELESTIAL_BODIES[id]);
    const planetHosts = new Set(members.filter((b) => b.type === 'planet' && b.parentBodyId).map((b) => b.parentBodyId!));
    return GROUPS.map((g) => ({
      ...g,
      bodies: members
        .filter((b) => groupOf(b, planetHosts) === g.key)
        .sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
    })).filter((g) => g.bodies.length > 0);
  }, [insideGalaxyId]);

  if (!insideGalaxyId || groups.length === 0) return null;
  const collapsed = collapsedByGalaxy[insideGalaxyId] ?? false;
  const total = groups.reduce((n, g) => n + g.bodies.length, 0);
  const galaxyName = GALAXY_SHORT_NAMES[insideGalaxyId]?.[language] ?? '';

  const title = language === 'ar' ? `استكشف ${galaxyName}` : `Explore ${galaxyName}`;

  const list = (onPick?: () => void) => (
    <div className="px-2 pb-2 space-y-2">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="px-1 py-1 text-[10px] uppercase tracking-wider font-mono font-bold text-indigo-300">
            {g.icon} {language === 'ar' ? g.ar : g.en}
          </div>
          <div className="flex flex-col gap-0.5">
            {g.bodies.map((b) => {
              const active = selectedCosmicBodyId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedCosmicBodyId(b.id);
                    onPick?.();
                  }}
                  className={`text-start px-2 py-1 coarse:py-2.5 coarse:text-sm rounded-lg text-[11px] leading-snug transition-colors cursor-pointer ${
                    active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {language === 'ar' ? b.nameAr : b.nameEn}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  if (isCompact) {
    return (
      <>
        <button
          id="galaxy-explorer-chip"
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="fixed top-20 start-3 z-30 flex items-center gap-2 px-3 py-2 min-h-10 rounded-2xl bg-slate-900/90 border border-indigo-500/50 backdrop-blur-xl shadow-xl text-xs font-bold text-slate-100 cursor-pointer max-w-[calc(100vw-7rem)]"
        >
          <Compass className="w-4 h-4 text-indigo-300 shrink-0" />
          <span className="truncate">{title}</span>
          <span className="text-[10px] font-semibold text-slate-400 shrink-0">({total})</span>
        </button>
        {isSheetOpen && (
          <BottomSheet
            ariaLabel={title}
            zIndexClass="z-50"
            initialSnap="full"
            header={
              <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Compass className="w-4 h-4 text-indigo-300 shrink-0" />
                <span className="truncate">{title}</span>
                <span className="text-[11px] font-semibold text-slate-400">({total})</span>
              </span>
            }
            actions={
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            }
          >
            <div className="pt-2">{list(() => setIsSheetOpen(false))}</div>
          </BottomSheet>
        )}
      </>
    );
  }

  return (
    <div
      id="galaxy-explorer-panel"
      className="flex fixed end-4 bottom-28 z-30 w-72 flex-col rounded-2xl bg-slate-900/85 border border-slate-700/60 backdrop-blur-xl shadow-2xl overflow-hidden"
      style={{ maxHeight: 'calc(100dvh - 420px)', minHeight: collapsed ? undefined : 160 }}
    >
      <button
        type="button"
        onClick={() => setCollapsedByGalaxy((c) => ({ ...c, [insideGalaxyId]: !collapsed }))}
        className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-800/60 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-300" />
          {title}
          <span className="text-[10px] font-semibold text-slate-400">({total})</span>
        </span>
        {collapsed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {!collapsed && <div className="overflow-y-auto">{list()}</div>}
    </div>
  );
};
