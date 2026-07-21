import { carHash } from './router.mjs';
import {
  escapeHTML, formatBand, formatGBP, licenseURL, placeholderImage, wikimediaSrcSet,
} from './utils.mjs';

const GRADE_LABELS = {
  build: 'Build', drive: 'Drive', practicality: 'Practicality', value: 'Value', design: 'Design', running: 'Running costs',
};

function gradesMarkup(grades = {}) {
  return Object.entries(GRADE_LABELS).map(([key, label]) => {
    const score = Number(grades[key]) || 0;
    return `<li><span>${label}</span><i aria-hidden="true"><b style="--score:${score}%"></b></i><strong>${score}</strong></li>`;
  }).join('');
}

function detailStat(label, value) {
  return value == null || value === '' ? '' : `<li><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></li>`;
}

function tagLabel(tag) {
  return String(tag || '').replace(/-/g, ' ');
}

export function twinSummary(anchor, candidate) {
  const sharedTags = (anchor.tags || []).filter(tag => (candidate.tags || []).includes(tag)).slice(0, 2);
  const shared = sharedTags.length ? `Shares ${sharedTags.map(tagLabel).join(' + ')}` : 'Similar brief';
  const anchorFloor = Number(anchor.usedGBP?.[0]);
  const candidateFloor = Number(candidate.usedGBP?.[0]);
  const saving = anchorFloor - candidateFloor;
  return saving > 0 ? `${shared} · starts ${formatGBP(saving)} lower` : shared;
}

function twinMarkup(result, anchor) {
  const car = result.car;
  return `<a class="twin-card" href="${carHash(car.id)}">
    <span>${escapeHTML(car.make)}</span><strong>${escapeHTML(car.model)} ${escapeHTML(car.gen)}</strong>
    <small>${escapeHTML(formatBand(car.usedGBP, formatGBP))} · ${escapeHTML(twinSummary(anchor, car))}</small>
  </a>`;
}

export function detailMarkup(car, twinResults = [], saved = false, rivals = [], compared = false) {
  const title = `${car.make} ${car.model}`;
  const controlLabel = `${title} ${car.gen}`;
  const hasCreditedImage = Boolean(car.img?.src && car.img?.credit && car.img?.license);
  const image = hasCreditedImage ? car.img.src : placeholderImage(title);
  const srcset = hasCreditedImage ? wikimediaSrcSet(image) : '';
  const years = `${car.years?.[0] || '?'}–${car.years?.[1] || 'now'}`;
  const imageCredit = hasCreditedImage
    ? `<figcaption>Photo: ${escapeHTML(car.img.credit)} · ${licenseURL(car.img.license) ? `<a href="${escapeHTML(licenseURL(car.img.license))}" target="_blank" rel="noreferrer">${escapeHTML(car.img.license)}</a>` : escapeHTML(car.img.license)}${car.img.page ? ` · <a href="${escapeHTML(car.img.page)}" target="_blank" rel="noreferrer">source</a>` : ''}</figcaption>`
    : '<figcaption>Designed stand-in · credited photo unavailable</figcaption>';
  return `<article class="car-detail" data-car-id="${escapeHTML(car.id)}">
    <figure class="detail-hero">
      <img src="${escapeHTML(image)}"${srcset ? ` srcset="${escapeHTML(srcset)}" sizes="(max-width: 700px) 100vw, 900px"` : ''} alt="${escapeHTML(title)}" width="900" height="600">
      ${imageCredit}
      <span class="score-stamp score-stamp--large"><strong>${car.vroom}</strong><small>/100</small></span>
    </figure>
    <header class="detail-header">
      <p class="eyebrow">${escapeHTML(car.make)} · ${escapeHTML(car.gen)} · ${escapeHTML(years)}</p>
      <h2 id="car-dialog-title">${escapeHTML(car.model)}</h2>
      <p class="detail-price">Used ${escapeHTML(formatBand(car.usedGBP, formatGBP))}</p>
      <div class="detail-actions">
        <button class="compare-button compare-button--detail${compared ? ' is-compared' : ''}" type="button" data-action="compare" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(controlLabel)}" aria-pressed="${compared}" aria-label="${compared ? 'Remove' : 'Add'} ${escapeHTML(controlLabel)} ${compared ? 'from' : 'to'} comparison"><span aria-hidden="true">${compared ? '✓' : '+'}</span> ${compared ? 'Comparing' : 'Compare'}</button>
        <button class="heart-button${saved ? ' is-saved' : ''}" type="button" data-action="save" data-id="${escapeHTML(car.id)}" data-label="${escapeHTML(controlLabel)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${escapeHTML(controlLabel)} ${saved ? 'from' : 'to'} favourites"><span aria-hidden="true">${saved ? '♥' : '♡'}</span></button>
      </div>
    </header>
    <blockquote class="detail-verdict">${escapeHTML(car.verdict || '')}</blockquote>
    <section class="buy-section"><h3>Buy this one</h3><p>${escapeHTML(car.buy || 'Find the best-maintained example with a complete history.')}</p></section>
    <section class="grade-section"><h3>The scorecard</h3><ul class="grade-bars">${gradesMarkup(car.grades)}</ul></section>
    <ul class="detail-stats">
      ${detailStat('0–62 mph', car.accel062 ? `${car.accel062}s` : null)}
      ${detailStat('Power', car.powerBHP ? `${car.powerBHP[0]}–${car.powerBHP[1]} bhp` : null)}
      ${detailStat('Economy', car.mpg != null ? `${car.mpg} mpg` : null)}
      ${detailStat('EV range', car.evMiles != null ? `${car.evMiles} miles` : null)}
      ${detailStat('Boot', car.bootL ? `${car.bootL} litres` : null)}
      ${detailStat('Seats', car.seats)}
      ${detailStat('Top speed', car.topMph ? `${car.topMph} mph` : null)}
      ${detailStat('Weight', car.kgKerb ? `${car.kgKerb.toLocaleString('en-GB')} kg` : null)}
      ${detailStat('Length', car.lenMM ? `${car.lenMM.toLocaleString('en-GB')} mm` : null)}
      ${detailStat('Fuel', (car.fuels || []).join(' / '))}
      ${detailStat('Price new', car.priceNewGBP ? formatBand(car.priceNewGBP, formatGBP) : null)}
    </ul>
    ${(car.issues || []).length ? `<section class="issues-section"><h3>Know before you go</h3><ul>${car.issues.map(issue => `<li>${escapeHTML(issue)}</li>`).join('')}</ul></section>` : ''}
    ${rivals.length ? `<section class="detail-section rivals-section"><h3>Also try</h3><div class="twin-grid">${rivals.map(rival => `<a class="twin-card" href="${carHash(rival.id)}"><span>${escapeHTML(rival.make)}</span><strong>${escapeHTML(rival.model)} ${escapeHTML(rival.gen)}</strong><small>${escapeHTML(formatBand(rival.usedGBP, formatGBP))}</small></a>`).join('')}</div></section>` : ''}
    <section class="twins-section"><h3>Same vibes, less money</h3>${twinResults.length ? `<div class="twin-grid">${twinResults.map(result => twinMarkup(result, car)).join('')}</div>` : '<p>No convincing cheaper twin in this budget. This one may be the bargain.</p>'}</section>
  </article>`;
}

export function createDetailController(dialog, content = dialog?.querySelector('#detail-content')) {
  let returnFocus = null;
  let closeCallback = null;
  let closingForNavigation = false;

  function open(car, twins, saved, trigger, rivals = [], compared = false) {
    if (!dialog || !content) return;
    const wasOpen = Boolean(dialog.open || dialog.hasAttribute('open'));
    if (!wasOpen) returnFocus = trigger || document.activeElement;
    content.innerHTML = detailMarkup(car, twins, saved, rivals, compared);
    dialog.setAttribute('aria-labelledby', 'car-dialog-title');
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    else dialog.setAttribute('open', '');
    requestAnimationFrame(() => dialog.querySelector('[data-close-dialog]')?.focus());
  }

  function close({ navigate = true } = {}) {
    if (!dialog) return;
    const isOpen = Boolean(dialog.open || dialog.hasAttribute('open'));
    if (!isOpen) {
      closingForNavigation = false;
      return;
    }
    closingForNavigation = !navigate;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else {
      dialog.removeAttribute('open');
      handleClose();
    }
  }

  function handleClose() {
    const focusTarget = returnFocus;
    returnFocus = null;
    focusTarget?.focus?.();
    if (!closingForNavigation) closeCallback?.();
    closingForNavigation = false;
  }

  dialog?.addEventListener('click', event => {
    if (event.target.closest?.('[data-close-dialog]') || event.target === dialog) close();
  });
  dialog?.addEventListener('close', handleClose);
  dialog?.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
  dialog?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.hidden && node.getAttribute('aria-hidden') !== 'true'
        && (typeof node.getClientRects !== 'function' || node.getClientRects().length > 0));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  return { open, close, onClose(callback) { closeCallback = callback; } };
}
