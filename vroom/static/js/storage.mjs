export const SAVED_KEY = 'vroom:saved:v1';
export const FILTERS_KEY = 'vroom:filters:v1';
export const COMPARE_KEY = 'vroom:compare:v1';

function availableStorage(storage) {
  try { return storage || globalThis.localStorage || null; }
  catch { return null; }
}

export function safeRead(key, fallback, storage) {
  try {
    const value = availableStorage(storage)?.getItem(key);
    return value == null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function safeWrite(key, value, storage) {
  try {
    const target = availableStorage(storage);
    if (!target) return false;
    target.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSaved(storage) {
  const value = safeRead(SAVED_KEY, [], storage);
  return new Set(Array.isArray(value) ? value.filter(item => typeof item === 'string') : []);
}

export function saveSaved(ids, storage) {
  return safeWrite(SAVED_KEY, [...ids].sort(), storage);
}

export function toggleSaved(id, savedIds, storage) {
  const next = new Set(savedIds);
  next.has(id) ? next.delete(id) : next.add(id);
  saveSaved(next, storage);
  return next;
}

export function loadCompared(storage) {
  const value = safeRead(COMPARE_KEY, [], storage);
  return new Set(Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, 4) : []);
}

export function saveCompared(ids, storage) {
  return safeWrite(COMPARE_KEY, [...ids].slice(0, 4), storage);
}
