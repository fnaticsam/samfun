import { normalizeEditorialPayload } from './editorial.mjs';

const DATA_URL = '/vroom/data/editorial.json';

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T12:00:00Z`));
}

function formatAmount(price) {
  if (!Number.isFinite(price?.amount)) return 'Price TBC';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: price.currency || 'GBP', maximumFractionDigits: 0,
    }).format(price.amount);
  } catch {
    return price.label || 'Price TBC';
  }
}

function powertrainLabel(value) {
  return ({ ev: 'Electric', phev: 'Plug-in hybrid', hybrid: 'Hybrid', petrol: 'Petrol', diesel: 'Diesel', 'range-extender': 'Range extender' })[value] || value || 'To confirm';
}

function bodyLabel(value) {
  return ({ suv: 'SUV', mpv: 'MPV', hatchback: 'Hatchback', estate: 'Estate', saloon: 'Saloon', coupe: 'Coupé' })[value] || value || 'To confirm';
}

function silhouetteMarkup(body) {
  const paths = {
    hatchback: 'M10 31h11l5-11 24-9h25l24 11h7l4 9H10Z',
    estate: 'M10 31h10l7-13 18-8h43l16 12 6 9H10Z',
    mpv: 'M9 31h11l6-17L43 7l46 3 15 11 6 10H9Z',
    suv: 'M9 31h11l5-17 49-5 27 9 9 13H9Z',
  };
  const path = paths[body] || 'M10 31h10l5-8 17-3 10-10h25l13 11 16 3 4 7H10Z';
  return `<svg class="radar-card__silhouette" viewBox="0 0 120 44" aria-hidden="true" focusable="false"><path d="${path}"/><circle cx="34" cy="31" r="7"/><circle cx="91" cy="31" r="7"/></svg>`;
}

export function flattenEditorialItems(payload) {
  const editorial = normalizeEditorialPayload(payload);
  const seen = new Set();
  const items = [];
  for (const collection of editorial.collections) {
    for (const item of collection.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push({ ...item, collectionId: collection.id, collectionTitle: collection.title });
    }
  }
  return { asOf: editorial.asOf, items };
}

export function filterEditorialItems(items, filter = 'all') {
  if (filter === 'on-sale') return items.filter(item => item.availability === 'on-sale');
  if (filter === 'coming') return items.filter(item => item.availability === 'coming');
  if (filter === 'under-30') return items.filter(item => item.price?.currency === 'GBP' && Number.isFinite(item.price?.amount) && item.price.amount < 30000);
  if (filter === 'ev') return items.filter(item => item.powertrain === 'ev');
  if (filter === 'hybrid') return items.filter(item => ['hybrid', 'phev', 'range-extender'].includes(item.powertrain));
  return [...items];
}

export function sortEditorialItems(items, sort = 'featured') {
  const copy = [...items];
  if (sort === 'price') {
    return copy.sort((left, right) => {
      const priceRank = item => {
        if (!Number.isFinite(item.price?.amount)) return 2;
        return item.price.currency === 'GBP' ? 0 : 1;
      };
      const rankDifference = priceRank(left) - priceRank(right);
      if (rankDifference) return rankDifference;
      const amountDifference = (left.price?.amount || 0) - (right.price?.amount || 0);
      return amountDifference || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
    });
  }
  if (sort === 'brand') return copy.sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
  return copy.sort((left, right) => Number(right.featured) - Number(left.featured));
}

export function radarCardMarkup(item, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const status = item.availability === 'on-sale' ? 'On sale now' : 'Coming soon';
  const isStale = Boolean(item.reviewBy && item.reviewBy < today);
  const market = item.market.length ? item.market.join(' / ') : 'Market TBC';
  const source = item.source.url
    ? `<a class="radar-card__source" href="${escapeHTML(item.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.source.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>`
    : '';
  const usedLink = item.carId
    ? `<a class="radar-card__used" href="/vroom/#c/${encodeURIComponent(item.carId)}">See it in the used finder <span aria-hidden="true">→</span></a>`
    : '';
  return `<article class="radar-card" data-radar-id="${escapeHTML(item.id)}">
    <div class="radar-card__top">
      <span class="radar-status${item.availability === 'coming' ? ' radar-status--coming' : ''}">${escapeHTML(status)}</span>
      <span class="radar-market">${escapeHTML(market)}</span>
    </div>
    <p class="radar-card__make">${escapeHTML(item.make || item.origin || 'New arrival')}</p>
    <h3>${escapeHTML(item.model || item.title)}</h3>
    ${silhouetteMarkup(item.body)}
    <p class="radar-card__price"><strong>${escapeHTML(formatAmount(item.price))}</strong><span>${escapeHTML(item.price?.label || 'Official price has not been announced')}</span></p>
    <dl class="radar-card__facts">
      <div><dt>Power</dt><dd>${escapeHTML(powertrainLabel(item.powertrain))}</dd></div>
      <div><dt>Shape</dt><dd>${escapeHTML(bodyLabel(item.body))}</dd></div>
      ${item.expectedLaunch ? `<div><dt>Arrival</dt><dd>${escapeHTML(item.expectedLaunch)}</dd></div>` : ''}
      <div><dt>Price basis</dt><dd>${escapeHTML(item.price?.type === 'tbc' ? 'To be confirmed' : item.price?.type === 'incentive' ? 'Incentive-led' : 'Manufacturer list')}</dd></div>
    </dl>
    ${item.note ? `<p class="radar-card__note">${escapeHTML(item.note)}</p>` : ''}
    <div class="radar-card__footer">
      <p class="radar-card__checked">${isStale ? 'Needs re-checking' : 'Checked'}<br><time datetime="${escapeHTML(item.checkedAt)}">${escapeHTML(formatDate(item.checkedAt))}</time></p>
      ${source}
    </div>
    ${usedLink}
  </article>`;
}

export function radarResultsMarkup(payload, { filter = 'all', sort = 'featured', today } = {}) {
  const { items } = flattenEditorialItems(payload);
  return sortEditorialItems(filterEditorialItems(items, filter), sort)
    .map(item => radarCardMarkup(item, { today }))
    .join('');
}

export function editorialStats(payload) {
  const { items } = flattenEditorialItems(payload);
  const gbpPrices = items.map(item => item.price).filter(price => price?.currency === 'GBP' && Number.isFinite(price.amount));
  const lowest = gbpPrices.sort((left, right) => left.amount - right.amount)[0] || null;
  return {
    total: items.length,
    onSale: items.filter(item => item.availability === 'on-sale').length,
    coming: items.filter(item => item.availability === 'coming').length,
    entryPrice: lowest ? formatAmount(lowest) : 'TBC',
  };
}

function pageController() {
  const grid = document.getElementById('radar-grid');
  const state = document.getElementById('radar-state');
  const announcer = document.getElementById('radar-announcer');
  const sort = document.getElementById('radar-sort');
  if (!grid || !state || !announcer || !sort) return;

  let payload = null;
  let activeFilter = 'all';

  function render() {
    if (!payload) return;
    const { asOf, items } = flattenEditorialItems(payload);
    const visible = sortEditorialItems(filterEditorialItems(items, activeFilter), sort.value);
    grid.innerHTML = visible.map(item => radarCardMarkup(item)).join('');
    grid.setAttribute('aria-busy', 'false');
    document.getElementById('radar-result-count').textContent = String(visible.length);
    document.getElementById('radar-results-title').lastChild.textContent = ` car${visible.length === 1 ? '' : 's'} on the radar`;
    document.getElementById('radar-as-of').innerHTML = `Official sources checked <time datetime="${escapeHTML(asOf)}">${escapeHTML(formatDate(asOf))}</time>`;
    state.hidden = visible.length > 0;
    state.textContent = visible.length ? `${visible.length} cars shown.` : 'No cars match that view yet.';
    announcer.textContent = `${visible.length} car${visible.length === 1 ? '' : 's'} shown.`;
  }

  document.querySelector('.radar-filters')?.addEventListener('click', event => {
    const button = event.target.closest?.('[data-radar-filter]');
    if (!button) return;
    activeFilter = button.dataset.radarFilter;
    for (const control of document.querySelectorAll('[data-radar-filter]')) control.setAttribute('aria-pressed', String(control === button));
    render();
  });

  sort.addEventListener('change', render);

  fetch(DATA_URL, { headers: { Accept: 'application/json' } })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      payload = data;
      const stats = editorialStats(payload);
      document.getElementById('radar-total').textContent = String(stats.total);
      document.getElementById('radar-on-sale').textContent = String(stats.onSale);
      document.getElementById('radar-coming').textContent = String(stats.coming);
      document.getElementById('radar-entry-price').textContent = stats.entryPrice;
      render();
    })
    .catch(() => {
      grid.setAttribute('aria-busy', 'false');
      state.classList.add('radar-state--error');
      state.innerHTML = 'The radar could not load. <a href="/vroom/new/">Try again</a> or return to the <a href="/vroom/">used-car finder</a>.';
      announcer.textContent = 'The new-car radar could not load.';
    });
}

if (typeof document !== 'undefined') pageController();
