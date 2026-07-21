import { clamp } from './utils.mjs';

const SEGMENT_FAMILIES = [
  ['city', 'supermini', 'family-hatch', 'hot-hatch'],
  ['compact-exec', 'exec', 'luxury', 'super-coupe'],
  ['small-suv', 'family-suv', 'large-suv', 'off-roader', 'seven-seater'],
  ['sports', 'roadster-classic', 'super-coupe', 'hot-hatch'],
  ['mpv-van', 'seven-seater'],
  ['ev-native', 'family-hatch', 'family-suv'],
  ['pickup', 'off-roader'],
];

export function jaccard(a = [], b = []) {
  const first = new Set(a);
  const second = new Set(b);
  const union = new Set([...first, ...second]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const value of first) if (second.has(value)) intersection += 1;
  return intersection / union.size;
}

export function segmentAdjacency(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  for (const family of SEGMENT_FAMILIES) {
    const ai = family.indexOf(a);
    const bi = family.indexOf(b);
    if (ai !== -1 && bi !== -1) return Math.abs(ai - bi) === 1 ? 0.7 : 0.4;
  }
  return 0;
}

function ratioCloseness(a, b) {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return 0;
  return clamp(Math.min(x, y) / Math.max(x, y), 0, 1);
}

function midpoint(range) {
  return Array.isArray(range) ? (Number(range[0]) + Number(range[1])) / 2 : 0;
}

export function numericCloseness(anchor, candidate) {
  const values = [
    ratioCloseness(anchor.accel062, candidate.accel062),
    ratioCloseness(anchor.bootL, candidate.bootL),
    ratioCloseness(anchor.lenMM, candidate.lenMM),
    ratioCloseness(midpoint(anchor.usedGBP), midpoint(candidate.usedGBP)),
  ];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function twinScore(anchor, candidate) {
  return 0.5 * jaccard(anchor.tags, candidate.tags)
    + 0.35 * numericCloseness(anchor, candidate)
    + 0.15 * segmentAdjacency(anchor.segment, candidate.segment);
}

export function findTwins(anchor, cars, { maxBudget, limit = 4 } = {}) {
  if (!anchor) return [];
  const anchorFloor = Number(anchor.usedGBP?.[0]) || Infinity;
  const ceiling = Number.isFinite(maxBudget) ? maxBudget : (Number(anchor.usedGBP?.[1]) || Infinity);
  return cars
    .filter(candidate => candidate.id !== anchor.id && !candidate.halo)
    .filter(candidate => (Number(candidate.usedGBP?.[0]) || Infinity) <= ceiling)
    .filter(candidate => anchor.halo || (Number(candidate.usedGBP?.[0]) || Infinity) < anchorFloor)
    .filter(candidate => jaccard(anchor.tags, candidate.tags) > 0)
    .map(car => ({ car, score: twinScore(anchor, car) }))
    .filter(result => result.score > 0.12)
    .sort((a, b) => b.score - a.score || b.car.vroom - a.car.vroom)
    .slice(0, limit);
}
