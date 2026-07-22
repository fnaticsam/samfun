function text(value, fallback = '') {
  return value == null ? fallback : String(value).trim();
}

function safeURL(value) {
  const href = text(value);
  try {
    const url = new URL(href, globalThis.location?.href || 'https://vroom.invalid/');
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function normalisePrice(value, item = {}) {
  if (typeof value === 'string') return { label: value };
  const source = value && typeof value === 'object' ? value : {};
  const label = text(source.label || item.priceLabel || item.priceText);
  const amount = Number(source.amount ?? source.value ?? item.priceAmount);
  const currency = text(source.currency || item.currency || 'GBP').toUpperCase();
  if (label) return { label, amount: Number.isFinite(amount) ? amount : null, currency, type: text(source.type || item.priceType) };
  if (!Number.isFinite(amount)) return null;
  try {
    return {
      label: new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount),
      amount, currency, type: text(source.type || item.priceType),
    };
  } catch {
    return { label: `${currency} ${amount.toLocaleString('en-GB')}`, amount, currency, type: text(source.type || item.priceType) };
  }
}

function normaliseItem(item, collectionId = '') {
  const source = item && typeof item === 'object' ? item : {};
  const make = text(source.make);
  const model = text(source.model || source.name || source.title);
  const title = text(source.title || [make, model].filter(Boolean).join(' ') || source.id, 'Untitled car');
  const market = firstArray(source.market, source.markets).map(value => text(value)).filter(Boolean);
  const sourceLink = source.source && typeof source.source === 'object' ? source.source : {};
  return {
    id: text(source.id || `${collectionId}-${title}`),
    carId: text(source.carId || source.car_id),
    title,
    make,
    model,
    availability: text(source.availability || source.status || 'coming').toLowerCase(),
    expectedLaunch: text(source.expectedLaunch || source.launch || source.launchDate),
    origin: text(source.origin),
    powertrain: text(source.powertrain).toLowerCase(),
    body: text(source.body).toLowerCase(),
    featured: Boolean(source.featured),
    tags: firstArray(source.tags).map(value => text(value).toLowerCase()).filter(Boolean),
    checkedAt: text(source.checkedAt || source.asOf || source.priceAsOf),
    reviewBy: text(source.reviewBy),
    market,
    price: normalisePrice(source.price, source),
    note: text(source.note || source.summary || source.description),
    source: { label: text(sourceLink.label || source.sourceLabel || 'Source'), url: safeURL(sourceLink.url || source.sourceUrl) },
  };
}

function collectionKey(value = '') {
  return text(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const COLLECTION_DEFAULTS = new Map([
  ['newcomingeurope', { id: 'new-coming-europe', title: 'New & coming to Europe' }],
  ['newcomingtoeurope', { id: 'new-coming-europe', title: 'New & coming to Europe' }],
  ['chinesecarschangingeurope', { id: 'chinese-cars-changing-europe', title: 'Chinese cars changing Europe' }],
]);

function normaliseCollection(collection, index = 0) {
  const source = collection && typeof collection === 'object' ? collection : {};
  const suggested = COLLECTION_DEFAULTS.get(collectionKey(source.id || source.title));
  const id = text(source.id || suggested?.id || `editorial-${index + 1}`);
  const title = text(source.title || suggested?.title, 'Editorial selection');
  const items = firstArray(source.items, source.cars, source.entries).map(item => normaliseItem(item, id));
  return { id, title, description: text(source.description || source.deck || source.intro), items };
}

/** Accepts the published editorial.json schema and a few benign legacy shapes. */
export function normalizeEditorialPayload(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  let collections = firstArray(source.collections, source.editorial, source.sections);
  if (!collections.length) {
    collections = [
      { id: 'new-coming-europe', title: 'New & coming to Europe', items: firstArray(source.newComingEurope, source.newComingToEurope) },
      { id: 'chinese-cars-changing-europe', title: 'Chinese cars changing Europe', items: firstArray(source.chineseCarsChangingEurope, source.chineseCars) },
    ].filter(collection => collection.items.length);
  }
  return {
    schemaVersion: Number(source.schemaVersion) || 1,
    asOf: text(source.asOf || source.as_of || source.updated),
    collections: collections.map(normaliseCollection).filter(collection => collection.items.length),
  };
}
