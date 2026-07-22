const DEFAULT_EDITORIAL_URL = new URL('../../data/editorial.json', import.meta.url);

function text(value, fallback = '') {
  return value == null ? fallback : String(value).trim();
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function safeURL(value) {
  const href = text(value);
  try {
    const url = new URL(href, globalThis.location?.href || 'https://vroom.invalid/');
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
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

function marketLabel(market) {
  return market.length ? market.join(' / ') : '';
}

function itemMarkup(item, car) {
  const title = car ? `${car.make} ${car.model}` : item.title;
  const status = item.availability === 'on-sale' ? 'On sale now' : item.availability === 'coming' ? 'Coming soon' : item.availability;
  const today = new Date().toISOString().slice(0, 10);
  const isStale = Boolean(item.reviewBy && item.reviewBy < today);
  const freshness = item.checkedAt
    ? `${isStale ? 'Last confirmed' : 'Checked'} ${item.checkedAt}${isStale ? '—verify current price' : ''}`
    : '';
  const details = [item.expectedLaunch, marketLabel(item.market), item.price?.label, freshness].filter(Boolean);
  const carActions = car ? `
      <div class="editorial-card__actions" aria-label="Actions for ${escapeHTML(title)}">
        <button type="button" class="text-button" data-editorial-view data-car-id="${escapeHTML(car.id)}">View car</button>
        <button type="button" class="heart-button" data-action="save" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(title)}" aria-pressed="false" aria-label="Save ${escapeHTML(title)} to favourites"><span aria-hidden="true">♡</span></button>
        <button type="button" class="compare-button" data-action="compare" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(title)}" aria-pressed="false" aria-label="Add ${escapeHTML(title)} to comparison"><span aria-hidden="true">+</span> Compare</button>
      </div>` : '';
  const source = item.source.url
    ? `<a class="editorial-card__source" href="${escapeHTML(item.source.url)}" target="_blank" rel="noreferrer">${escapeHTML(item.source.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`
    : '';
  return `<article class="editorial-card" data-editorial-id="${escapeHTML(item.id)}">
    <div class="editorial-card__heading"><p class="eyebrow">${escapeHTML(status)}</p><h3>${escapeHTML(title)}</h3></div>
    ${details.length ? `<p class="editorial-card__facts">${details.map(escapeHTML).join(' · ')}</p>` : ''}
    ${item.note ? `<p>${escapeHTML(item.note)}</p>` : ''}
    ${carActions}${source || (!car ? '<p class="editorial-card__unmatched">Details are being confirmed.</p>' : '')}
  </article>`;
}

/** Returns semantic markup without changing routing or application state. */
export function editorialMarkup(payload, { byId = new Map() } = {}) {
  const editorial = normalizeEditorialPayload(payload);
  if (!editorial.collections.length) return '<p class="editorial-state" role="status">Editorial updates are being prepared. Check back soon.</p>';
  const asOf = editorial.asOf ? `<p class="editorial-hub__asof">As of <time datetime="${escapeHTML(editorial.asOf)}">${escapeHTML(editorial.asOf)}</time></p>` : '';
  return `<div class="editorial-hub__inner"><header class="editorial-hub__header"><p class="eyebrow">New-car radar</p><h2>Fresh metal, clearly priced</h2><p>These are new-car prices and confirmed arrivals. Your used-car brief remains applied below.</p>${asOf}</header>${editorial.collections.map(collection => `<section class="editorial-collection" aria-labelledby="editorial-${escapeHTML(collection.id)}">
    <header><p class="eyebrow">Market watch</p><h3 id="editorial-${escapeHTML(collection.id)}">${escapeHTML(collection.title)}</h3>${collection.description ? `<p>${escapeHTML(collection.description)}</p>` : ''}</header>
    <div class="editorial-collection__grid">${collection.items.map(item => itemMarkup(item, item.carId ? byId.get(item.carId) : null)).join('')}</div>
    <button class="text-button" type="button" data-editorial-explore="${escapeHTML(collection.id)}">Explore the used market</button>
  </section>`).join('')}</div>`;
}

export function createEditorialController(root, {
  byId = new Map(), fetcher = globalThis.fetch, url = DEFAULT_EDITORIAL_URL,
  onView, onExplore, onError,
} = {}) {
  if (!root) return null;
  let editorial = normalizeEditorialPayload(null);

  function render(payload = editorial) {
    editorial = normalizeEditorialPayload(payload);
    root.innerHTML = editorialMarkup(editorial, { byId });
    root.hidden = editorial.collections.length === 0;
    return editorial;
  }

  function collectionFor(id) {
    return editorial.collections.find(collection => collection.id === id) || null;
  }

  function handleClick(event) {
    const view = event.target.closest?.('[data-editorial-view][data-car-id]');
    if (view) {
      const carId = view.dataset.carId;
      if (!byId.get(carId)) return;
      event.preventDefault();
      onView?.(carId, view);
      return;
    }
    const explore = event.target.closest?.('[data-editorial-explore]');
    if (!explore) return;
    const collection = collectionFor(explore.dataset.editorialExplore);
    if (!collection) return;
    event.preventDefault();
    onExplore?.(collection, explore);
  }

  root.addEventListener('click', handleClick);

  async function load() {
    if (typeof fetcher !== 'function') {
      render(null);
      onError?.(new Error('Editorial updates cannot be loaded in this browser.'));
      return editorial;
    }
    try {
      const response = await fetcher(url, { headers: { Accept: 'application/json' } });
      if (!response?.ok) throw new Error(`Could not load editorial updates: HTTP ${response?.status || 'error'}`);
      return render(await response.json());
    } catch (error) {
      render(null);
      onError?.(error);
      return editorial;
    }
  }

  return { load, render, destroy: () => root.removeEventListener('click', handleClick), get editorial() { return editorial; } };
}
