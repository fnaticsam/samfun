import { carHash } from './router.mjs';
import {
  escapeHTML, formatBand, formatGBP, licenseURL, placeholderImage, wikimediaSrcSet,
} from './utils.mjs';

function priceLabel(car) {
  return formatBand(car.usedGBP, formatGBP);
}

function stat(label, value, width) {
  return `<li class="card-stat"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong><i aria-hidden="true"><b style="--stat:${Math.round(width)}%"></b></i></li>`;
}

export function cardMarkup(car, saved = false, compared = false) {
  const title = `${car.make} ${car.model}`;
  const controlLabel = `${title} ${car.gen}`;
  const hasCreditedImage = Boolean(car.img?.src && car.img?.credit && car.img?.license);
  const image = hasCreditedImage ? car.img.src : placeholderImage(title);
  const srcset = hasCreditedImage ? wikimediaSrcSet(image) : '';
  const licenceHref = licenseURL(car.img?.license);
  const licence = licenceHref
    ? `<a href="${escapeHTML(licenceHref)}" target="_blank" rel="noreferrer">${escapeHTML(car.img.license)}</a>`
    : escapeHTML(car.img?.license || '');
  const attribution = hasCreditedImage
    ? `<small class="car-card__credit">Photo: ${car.img.page ? `<a href="${escapeHTML(car.img.page)}" target="_blank" rel="noreferrer" aria-label="Photo source for ${escapeHTML(title)} by ${escapeHTML(car.img.credit)}">${escapeHTML(car.img.credit)}</a>` : escapeHTML(car.img.credit)} · ${licence}</small>`
    : '';
  const efficiency = car.evMiles != null ? `${car.evMiles} mi` : car.mpg != null ? `${car.mpg} mpg` : '—';
  const efficiencyWidth = car.evMiles != null ? Math.min(100, car.evMiles / 4.5) : Math.min(100, (car.mpg || 0) / 0.8);
  return `<article class="car-card" data-car-id="${escapeHTML(car.id)}">
    <a class="car-card__link" href="${carHash(car.id)}" aria-label="View ${escapeHTML(title)} ${escapeHTML(car.gen)}">
      <figure class="car-card__media">
        <img src="${escapeHTML(image)}"${srcset ? ` srcset="${escapeHTML(srcset)}" sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"` : ''} alt="${escapeHTML(title)}" loading="lazy" decoding="async" width="900" height="600">
        <span class="score-stamp" aria-label="Vroom score ${car.vroom} out of 100"><strong>${car.vroom}</strong><small>/100</small></span>
        <span class="price-chip">${escapeHTML(priceLabel(car))}</span>
      </figure>
      <div class="car-card__body">
        <p class="eyebrow">${escapeHTML(car.make)} · ${escapeHTML(car.gen)} · ${escapeHTML((car.bodies || []).join(' / '))}</p>
        <h2>${escapeHTML(car.model)}</h2>
        <p class="card-verdict">${escapeHTML(car.verdict || '')}</p>
        <ul class="card-stats">
          ${stat('0–62', car.accel062 ? `${car.accel062}s` : '—', Math.max(4, 110 - (car.accel062 || 15) * 7))}
          ${stat(car.evMiles != null ? 'Range' : 'Economy', efficiency, efficiencyWidth)}
          ${stat('Practical', car.bootL ? `${car.bootL}L` : '—', Math.min(100, (car.grades?.practicality || 0)))}
        </ul>
      </div>
    </a>
    ${attribution}
    <button class="heart-button${saved ? ' is-saved' : ''}" type="button" data-action="save" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(controlLabel)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${escapeHTML(controlLabel)} ${saved ? 'from' : 'to'} favourites">
      <span aria-hidden="true">${saved ? '♥' : '♡'}</span>
    </button>
    <button class="compare-button${compared ? ' is-compared' : ''}" type="button" data-action="compare" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(controlLabel)}" aria-pressed="${compared}" aria-label="${compared ? 'Remove' : 'Add'} ${escapeHTML(controlLabel)} ${compared ? 'from' : 'to'} comparison">
      <span aria-hidden="true">${compared ? '✓' : '+'}</span> ${compared ? 'Comparing' : 'Compare'}
    </button>
  </article>`;
}

export function renderCardBatch(container, cars, savedIds, { start = 0, count = 48, comparedIds = new Set() } = {}) {
  if (!container) return 0;
  const slice = cars.slice(start, start + count);
  container.insertAdjacentHTML('beforeend', slice.map(car => cardMarkup(car, savedIds.has(car.id), comparedIds.has(car.id))).join(''));
  return slice.length;
}

export function updateSavedButtons(root, id, isSaved) {
  root?.querySelectorAll(`[data-action="save"][data-id="${globalThis.CSS?.escape ? CSS.escape(id) : id}"]`).forEach(button => {
    button.classList.toggle('is-saved', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    const label = button.dataset.label || 'car';
    button.setAttribute('aria-label', `${isSaved ? 'Remove' : 'Save'} ${label} ${isSaved ? 'from' : 'to'} favourites`);
    const icon = button.querySelector('[aria-hidden="true"]');
    if (icon) icon.textContent = isSaved ? '♥' : '♡';
  });
}
