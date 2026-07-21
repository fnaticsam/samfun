import { createFilters, DEFAULT_FILTERS } from './state.mjs';

const ARRAY_KEYS = { bodies: 'b', fuels: 'f', vibes: 'v', makes: 'm' };
const REVERSE_ARRAY_KEYS = Object.fromEntries(Object.entries(ARRAY_KEYS).map(([key, value]) => [value, key]));

function cleanNumber(value, fallback) {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function putRange(params, key, value, fallback) {
  if (value[0] !== fallback[0] || value[1] !== fallback[1]) params.set(key, `${value[0]}-${value[1]}`);
}

function readRange(params, key, fallback) {
  const raw = params.get(key);
  if (!raw) return [...fallback];
  const [min, max] = raw.split('-').map(Number);
  return Number.isFinite(min) && Number.isFinite(max) && min <= max ? [min, max] : [...fallback];
}

export function filtersToHash(input) {
  const filters = createFilters(input);
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  for (const [stateKey, paramKey] of Object.entries(ARRAY_KEYS)) {
    if (filters[stateKey].length) params.set(paramKey, filters[stateKey].join(','));
  }
  putRange(params, 'budget', filters.budget, DEFAULT_FILTERS.budget);
  putRange(params, 'age', filters.age, DEFAULT_FILTERS.age);
  putRange(params, 'miles', filters.mileage, DEFAULT_FILTERS.mileage);
  if (filters.accelMax !== DEFAULT_FILTERS.accelMax) params.set('pace', String(filters.accelMax));
  if (filters.efficiencyMin !== DEFAULT_FILTERS.efficiencyMin) params.set('eco', String(filters.efficiencyMin));
  if (filters.efficiencyMode !== DEFAULT_FILTERS.efficiencyMode) params.set('ecoMode', filters.efficiencyMode);
  if (filters.bestOnly) params.set('best', '1');
  if (filters.savedOnly) params.set('saved', '1');
  if (filters.includeHalo) params.set('halo', '1');
  if (filters.seatsMin) params.set('seats', String(filters.seatsMin));
  if (filters.bootMin) params.set('boot', String(filters.bootMin));
  if (filters.onSaleOnly) params.set('sale', '1');
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
  return `#q/${params.toString()}`;
}

export function hashToFilters(hash) {
  const raw = String(hash || '').replace(/^#q\/?/, '');
  const params = new URLSearchParams(raw);
  const next = createFilters({
    query: params.get('q') || '',
    budget: readRange(params, 'budget', DEFAULT_FILTERS.budget),
    age: readRange(params, 'age', DEFAULT_FILTERS.age),
    mileage: readRange(params, 'miles', DEFAULT_FILTERS.mileage),
    accelMax: cleanNumber(params.get('pace'), DEFAULT_FILTERS.accelMax),
    efficiencyMin: cleanNumber(params.get('eco'), DEFAULT_FILTERS.efficiencyMin),
    efficiencyMode: params.get('ecoMode') || DEFAULT_FILTERS.efficiencyMode,
    bestOnly: params.get('best') === '1',
    savedOnly: params.get('saved') === '1',
    includeHalo: params.get('halo') === '1',
    seatsMin: cleanNumber(params.get('seats'), DEFAULT_FILTERS.seatsMin),
    bootMin: cleanNumber(params.get('boot'), DEFAULT_FILTERS.bootMin),
    onSaleOnly: params.get('sale') === '1',
    sort: params.get('sort') || DEFAULT_FILTERS.sort,
  });
  for (const [paramKey, stateKey] of Object.entries(REVERSE_ARRAY_KEYS)) {
    const value = params.get(paramKey);
    next[stateKey] = value ? value.split(',').filter(Boolean) : [];
  }
  return next;
}

export function parseHash(hash = '') {
  const value = String(hash);
  if (value.startsWith('#compare/')) {
    try {
      const ids = [...new Set(value.slice(9).split(',').map(decodeURIComponent).filter(Boolean))].slice(0, 4);
      return ids.length ? { type: 'compare', ids } : { type: 'browse' };
    } catch { return { type: 'browse' }; }
  }
  if (value.startsWith('#c/')) {
    try { return { type: 'car', id: decodeURIComponent(value.slice(3)) }; }
    catch { return { type: 'browse' }; }
  }
  if (value.startsWith('#q')) return { type: 'query', filters: hashToFilters(value) };
  return { type: 'browse' };
}

export function carHash(id) {
  return `#c/${encodeURIComponent(String(id))}`;
}

export function compareHash(ids) {
  return `#compare/${Array.from(ids || []).slice(0, 4).map(id => encodeURIComponent(String(id))).join(',')}`;
}

export function replaceHash(hash, historyObject = globalThis.history, locationObject = globalThis.location) {
  if (!historyObject?.replaceState || !locationObject) return;
  historyObject.replaceState(null, '', `${locationObject.pathname || ''}${locationObject.search || ''}${hash}`);
}
