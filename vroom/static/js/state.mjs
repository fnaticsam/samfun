import {
  CURRENT_YEAR, expandSearchQuery, normalizeText, productionAgeRange, rangesOverlap,
} from './utils.mjs';

export const DEFAULT_FILTERS = Object.freeze({
  query: '',
  bodies: Object.freeze([]),
  fuels: Object.freeze([]),
  vibes: Object.freeze([]),
  makes: Object.freeze([]),
  budget: Object.freeze([5000, 100000]),
  age: Object.freeze([0, 25]),
  mileage: Object.freeze([0, 250000]),
  accelMax: 15,
  efficiencyMin: 0,
  efficiencyMode: 'auto',
  bestOnly: false,
  savedOnly: false,
  includeHalo: false,
  seatsMin: 0,
  bootMin: 0,
  onSaleOnly: false,
  sort: 'score',
});

export function createFilters(overrides = {}) {
  const list = (value, fallback) => Array.isArray(value) ? [...value] : [...fallback];
  const pair = (value, fallback) => {
    if (!Array.isArray(value) || value.length < 2) return [...fallback];
    const next = [Number(value[0]), Number(value[1])];
    return next.every(Number.isFinite) ? next : [...fallback];
  };
  return {
    ...DEFAULT_FILTERS,
    ...overrides,
    bodies: list(overrides.bodies, DEFAULT_FILTERS.bodies),
    fuels: list(overrides.fuels, DEFAULT_FILTERS.fuels),
    vibes: list(overrides.vibes, DEFAULT_FILTERS.vibes),
    makes: list(overrides.makes, DEFAULT_FILTERS.makes),
    budget: pair(overrides.budget, DEFAULT_FILTERS.budget),
    age: pair(overrides.age, DEFAULT_FILTERS.age),
    mileage: pair(overrides.mileage, DEFAULT_FILTERS.mileage),
  };
}

export function toggleFilterValue(filters, group, value) {
  if (!['bodies', 'fuels', 'vibes', 'makes'].includes(group)) return createFilters(filters);
  const normalizedValue = String(value);
  const values = new Set(filters[group] || []);
  values.has(normalizedValue) ? values.delete(normalizedValue) : values.add(normalizedValue);
  return createFilters({ ...filters, [group]: [...values] });
}

export function determineEfficiencyMode(filters) {
  if (filters.efficiencyMode && filters.efficiencyMode !== 'auto') return filters.efficiencyMode;
  const fuels = filters.fuels || [];
  if (fuels.length && fuels.every(fuel => fuel === 'ev')) return 'range';
  if (fuels.length && fuels.every(fuel => fuel !== 'ev')) return 'mpg';
  return 'either';
}

export function expectedMileageRange(car, selectedAge = [0, 25], currentYear = CURRENT_YEAR) {
  const ownAges = productionAgeRange(car, currentYear);
  const overlap = [Math.max(ownAges[0], selectedAge[0]), Math.min(ownAges[1], selectedAge[1])];
  if (overlap[0] > overlap[1]) return null;
  return overlap.map(age => Math.round(age * (Number(car.milesPerYear) || 8000)));
}

function includesAny(values, selected) {
  return selected.length === 0 || selected.some(value => values.includes(value));
}

const SEARCH_TEXT = new WeakMap();
const IDENTITY_TEXT = new WeakMap();
const QUERY_VARIANTS = new Map();

function queryVariants(query) {
  const key = String(query || '');
  if (QUERY_VARIANTS.has(key)) return QUERY_VARIANTS.get(key);
  const variants = expandSearchQuery(key);
  // This is intentionally tiny: it prevents a long browsing session from
  // retaining every partial search while still covering normal type-ahead.
  if (QUERY_VARIANTS.size >= 64) QUERY_VARIANTS.clear();
  QUERY_VARIANTS.set(key, variants);
  return variants;
}

function searchableText(car) {
  if (SEARCH_TEXT.has(car)) return SEARCH_TEXT.get(car);
  const text = normalizeText([
    car.make, car.model, car.gen, car.genName, car.segment,
    ...(car.bodies || []), ...(car.fuels || []), ...(car.tags || []),
  ].filter(Boolean).join(' '));
  SEARCH_TEXT.set(car, text);
  return text;
}

function identityText(car) {
  if (IDENTITY_TEXT.has(car)) return IDENTITY_TEXT.get(car);
  const text = normalizeText([car.make, car.model, car.gen, car.genName].filter(Boolean).join(' '));
  IDENTITY_TEXT.set(car, text);
  return text;
}

export function carMatchesQuery(car, query) {
  const variants = queryVariants(query);
  if (!variants.length) return true;
  const haystack = searchableText(car);
  return variants.some(variant => variant.split(' ').every(token => haystack.includes(token)));
}

export function carMatchesIdentity(car, query) {
  const variants = queryVariants(query);
  if (!variants.length) return false;
  const haystack = identityText(car);
  return variants.some(variant => variant.split(' ').every(token => haystack.includes(token)));
}

export function matchesFilters(car, filters, savedIds = new Set(), currentYear = CURRENT_YEAR) {
  if (!car || !filters) return false;
  const directSearch = Boolean(String(filters.query || '').trim()) && carMatchesIdentity(car, filters.query);
  if (car.halo && !filters.includeHalo && !directSearch) return false;
  if (!carMatchesQuery(car, filters.query)) return false;
  if (!includesAny(car.bodies || [], filters.bodies || [])) return false;
  if (!includesAny(car.fuels || [], filters.fuels || [])) return false;
  if (!includesAny(car.tags || [], filters.vibes || [])) return false;
  if ((filters.makes || []).length && !(filters.makes || []).map(normalizeText).includes(normalizeText(car.make))) return false;
  if (!(car.halo && (directSearch || filters.includeHalo)) && !rangesOverlap(car.usedGBP, filters.budget)) return false;
  if (!rangesOverlap(productionAgeRange(car, currentYear), filters.age)) return false;
  const expectedMiles = expectedMileageRange(car, filters.age, currentYear);
  if (expectedMiles && !rangesOverlap(expectedMiles, filters.mileage || DEFAULT_FILTERS.mileage)) return false;
  if (Number(filters.accelMax) > 0 && car.accel062 > Number(filters.accelMax)) return false;

  const minEfficiency = Number(filters.efficiencyMin) || 0;
  if (minEfficiency > 0) {
    const mode = determineEfficiencyMode(filters);
    const passesMpg = car.mpg != null && car.mpg >= minEfficiency;
    const passesRange = car.evMiles != null && car.evMiles >= minEfficiency;
    if ((mode === 'mpg' && !passesMpg) || (mode === 'range' && !passesRange) || (mode === 'either' && !passesMpg && !passesRange)) return false;
  }
  if (filters.bestOnly && car.vroom < 88) return false;
  if (filters.savedOnly && !savedIds.has(car.id)) return false;
  if (Number(filters.seatsMin) > 0 && Number(car.seats) < Number(filters.seatsMin)) return false;
  if (Number(filters.bootMin) > 0 && Number(car.bootL) < Number(filters.bootMin)) return false;
  if (filters.onSaleOnly && !car.onSale) return false;
  return true;
}

export function sortCars(cars, sort = 'score', query = '') {
  const list = [...cars];
  const usedMid = car => ((car.usedGBP?.[0] || 0) + (car.usedGBP?.[1] || 0)) / 2;
  const newest = car => Number(car.years?.[1]) || CURRENT_YEAR;
  const comparators = {
    'price-asc': (a, b) => usedMid(a) - usedMid(b),
    'price-desc': (a, b) => usedMid(b) - usedMid(a),
    'price-low': (a, b) => usedMid(a) - usedMid(b),
    quickest: (a, b) => a.accel062 - b.accel062,
    accel: (a, b) => a.accel062 - b.accel062,
    newest: (a, b) => newest(b) - newest(a),
    score: (a, b) => b.vroom - a.vroom || usedMid(a) - usedMid(b),
    match: (a, b) => b.vroom - a.vroom || usedMid(a) - usedMid(b),
  };
  const comparator = comparators[sort] || comparators.score;
  if (!query) return list.sort(comparator);
  const queryText = normalizeText(query);
  const exactness = car => {
    const name = normalizeText(`${car.make} ${car.model}`);
    if (name === queryText) return 3;
    if (name.startsWith(queryText)) return 2;
    return carMatchesQuery(car, query) ? 1 : 0;
  };
  return list.sort((a, b) => exactness(b) - exactness(a) || comparator(a, b));
}

export function filterCars(cars, filters, savedIds = new Set(), currentYear = CURRENT_YEAR) {
  return sortCars(
    cars.filter(car => matchesFilters(car, filters, savedIds, currentYear)),
    filters.sort,
    filters.query,
  );
}
