// Rendering quality tier, decided once when the app loads (before any shader compiles) so it never causes
// mid-session recompiles. Phones and low-core devices get the "low" tier: a lower pixel ratio, no MSAA, fewer
// pooled lights and thinner dense star fields. `?quality=high|low` overrides it (handy for testing).

export type QualityTier = 'low' | 'high';

let tier: QualityTier | null = null;

export function getQualityTier(): QualityTier {
  if (tier) return tier;
  if (typeof window === 'undefined') return 'high';
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'low' || forced === 'high') {
    tier = forced;
    return tier;
  }
  const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 768;
  const fewCores = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4;
  tier = coarse || narrow || fewCores ? 'low' : 'high';
  return tier;
}

export const isLowQuality = () => getQualityTier() === 'low';

// Scale a point/star count for the current tier
export const scaledCount = (count: number, lowFactor = 0.5) =>
  isLowQuality() ? Math.round(count * lowFactor) : count;
