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
    hatchback: 'M21.5 29.5 20.8 25.2Q20.6 23.6 21.6 22.6L23 15.2 20.8 13.2 26.6 10.9Q39.4 8.7 51 9.4 55.4 9.6 57.4 11.8L70.4 17.6 94.6 19.3Q102.5 20.3 102.5 25.2V29.5H102.5a12.8 12.8 0 0 0-23 0H44.5a12.8 12.8 0 0 0-23 0Z',
    estate: 'M11 29.5V13.6Q11 11 13.6 10.8L55 9.4Q58 9.3 60 11L74 17.2 96.5 19.2Q102.5 20.1 102.5 25.2V29.5H102.5a12.8 12.8 0 0 0-23 0H44.5a12.8 12.8 0 0 0-23 0H11Z',
    mpv: 'M12 29.5V12.6Q12 10.2 14.4 10L54 8.3Q58.4 8.1 61.6 10.1L79 16.9 96.6 18.7Q102.5 19.6 102.5 24.8V29.5H102.5a12.8 12.8 0 0 0-23 0H44.5a12.8 12.8 0 0 0-23 0H12Z',
    suv: 'M12 28V11.4Q12 8.8 14.6 8.6L58.5 6.8Q61 6.7 62.9 8.3L77 15.2 97 17.6Q102.5 18.5 102.5 23.4V28H102.5a12.8 12.8 0 0 0-23 0H44.5a12.8 12.8 0 0 0-23 0H12Z',
  };
  const path = paths[body]
    || 'M10.6 29.5V22.6Q10.6 21 11.6 19.9L13 18.3 30 16 40 11.2Q42 10.3 44.2 10.3L58 10.3Q60.4 10.3 62.2 11.7L74 17.4 96 19Q102.5 19.9 102.5 25V29.5H102.5a12.8 12.8 0 0 0-23 0H44.5a12.8 12.8 0 0 0-23 0H10.6Z';
  const wheelY = body === 'suv' ? 33 : 33.5;
  const wheelR = body === 'suv' ? 10 : 9.5;
  return `<svg class="radar-card__silhouette" viewBox="0 0 120 48" aria-hidden="true" focusable="false"><path d="${path}"/><circle cx="33" cy="${wheelY}" r="${wheelR}"/><circle cx="33" cy="${wheelY}" r="3.5"/><circle cx="91" cy="${wheelY}" r="${wheelR}"/><circle cx="91" cy="${wheelY}" r="3.5"/></svg>`;
}

function radarPhotoMarkup(item) {
  const image = item.image;
  const fallback = `<span class="radar-card__image-fallback" data-radar-image-fallback${image ? ' hidden' : ''} aria-hidden="true">${silhouetteMarkup(item.body)}</span>`;
  if (!image) return `<figure class="radar-card__media is-image-fallback">${fallback}</figure>`;
  const srcset = image.srcset.map(candidate => `${candidate.src} ${candidate.width}w`).join(', ');
  return `<figure class="radar-card__media">
    <img class="radar-card__image" data-radar-image src="${escapeHTML(image.src)}" srcset="${escapeHTML(srcset)}" sizes="(max-width: 680px) calc(100vw - 2rem), (max-width: 980px) calc((100vw - 3rem) / 2), 380px" alt="${escapeHTML(image.alt)}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">
    ${fallback}
    ${image.note ? `<span class="radar-card__image-note">${escapeHTML(image.note)}</span>` : ''}
    <figcaption class="radar-card__attribution"><span>Photo</span><a href="${escapeHTML(image.sourcePage)}" target="_blank" rel="noopener noreferrer">${escapeHTML(image.creator)}<span class="sr-only"> (opens in a new tab)</span></a><span aria-hidden="true">·</span><a href="${escapeHTML(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(image.license)}<span class="sr-only"> (opens in a new tab)</span></a><span aria-hidden="true">·</span><span>resized/WebP</span></figcaption>
  </figure>`;
}

function revealRadarImageFallback(image) {
  const media = image?.closest?.('.radar-card__media');
  if (!media) return;
  media.classList.add('is-image-fallback');
  image.remove();
  media.querySelector('[data-radar-image-fallback]')?.removeAttribute('hidden');
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
    ${radarPhotoMarkup(item)}
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

  // Capture image errors because cards are rendered dynamically. This keeps a
  // failed local asset from leaving a browser broken-image icon in the grid.
  grid.addEventListener('error', event => {
    if (event.target?.matches?.('[data-radar-image]')) revealRadarImageFallback(event.target);
  }, true);

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
