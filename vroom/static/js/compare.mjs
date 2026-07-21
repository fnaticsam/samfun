import {
  escapeHTML, formatBand, formatGBP, licenseURL, placeholderImage, wikimediaSrcSet,
} from './utils.mjs';

export const MAX_COMPARE = 4;

export function normalizeCompared(ids, validIds, limit = MAX_COMPARE) {
  const allowed = validIds instanceof Set ? validIds : new Set(validIds || []);
  return [...new Set(Array.from(ids || []).filter(id => typeof id === 'string' && allowed.has(id)))].slice(0, limit);
}

export function toggleCompared(id, ids, limit = MAX_COMPARE) {
  const next = new Set(ids || []);
  if (next.has(id)) {
    next.delete(id);
    return { ids: next, changed: true, full: false };
  }
  if (next.size >= limit) return { ids: next, changed: false, full: true };
  next.add(id);
  return { ids: next, changed: true, full: false };
}

function creditedImage(car) {
  return car.img?.src && car.img?.credit && car.img?.license
    ? car.img.src
    : placeholderImage(`${car.make} ${car.model}`);
}

function imageAttribution(car) {
  if (!car.img?.src || !car.img?.credit || !car.img?.license) return '';
  const title = `${car.make} ${car.model}`;
  const credit = car.img.page
    ? `<a href="${escapeHTML(car.img.page)}" target="_blank" rel="noreferrer" aria-label="Photo source for ${escapeHTML(title)}: ${escapeHTML(car.img.credit)}, ${escapeHTML(car.img.license)}">${escapeHTML(car.img.credit)}</a>`
    : escapeHTML(car.img.credit);
  const licenceHref = licenseURL(car.img.license);
  const licence = licenceHref
    ? `<a href="${escapeHTML(licenceHref)}" target="_blank" rel="noreferrer">${escapeHTML(car.img.license)}</a>`
    : escapeHTML(car.img.license);
  return `<small class="compare-car__credit">Photo: ${credit} · ${licence}</small>`;
}

function midpoint(range) {
  return Array.isArray(range) ? (Number(range[0]) + Number(range[1])) / 2 : null;
}

function cell(value, winner = false) {
  return `<td${winner ? ' class="is-best"' : ''}>${escapeHTML(value ?? '—')}</td>`;
}

function row(label, cars, value, { best = 'max', numeric = value } = {}) {
  const numbers = cars.map(numeric).map(Number);
  const finite = numbers.filter(Number.isFinite);
  const winning = finite.length > 1 ? (best === 'min' ? Math.min(...finite) : Math.max(...finite)) : null;
  return `<tr><th scope="row">${escapeHTML(label)}</th>${cars.map((car, index) => cell(value(car), winning != null && numbers[index] === winning)).join('')}</tr>`;
}

export function comparisonMarkup(cars = []) {
  if (cars.length < 2) return '<div class="compare-empty"><p class="eyebrow">Build a face-off</p><h2>Choose at least two cars.</h2><p>Add cars from any card or detail view. You can compare up to four.</p></div>';
  const years = car => `${car.years?.[0] || '?'}–${car.years?.[1] || 'now'}`;
  const power = car => Array.isArray(car.powerBHP) ? `${car.powerBHP[0]}–${car.powerBHP[1]} bhp` : '—';
  return `<div class="compare-scroll" tabindex="0" aria-label="Car comparison table">
    <table class="compare-table">
      <caption class="sr-only">Side-by-side comparison of ${escapeHTML(cars.map(car => `${car.make} ${car.model}`).join(', '))}</caption>
      <thead><tr><th scope="col">The face-off</th>${cars.map(car => `<th scope="col">
        <article class="compare-car">
          <img src="${escapeHTML(creditedImage(car))}"${car.img?.src && car.img?.credit && car.img?.license && wikimediaSrcSet(car.img.src) ? ` srcset="${escapeHTML(wikimediaSrcSet(car.img.src))}" sizes="(max-width: 700px) 72vw, 300px"` : ''} alt="" width="360" height="240">
          <p>${escapeHTML(car.make)} · ${escapeHTML(car.gen)}</p>
          <h2>${escapeHTML(car.model)}</h2>
          ${imageAttribution(car)}
          <button type="button" data-action="compare" data-id="${escapeHTML(car.id)}" aria-label="Remove ${escapeHTML(car.make)} ${escapeHTML(car.model)} from comparison">Remove</button>
        </article>
      </th>`).join('')}</tr></thead>
      <tbody>
        ${row('Vroom score', cars, car => `${car.vroom}/100`, { numeric: car => car.vroom })}
        ${row('Used price', cars, car => formatBand(car.usedGBP, formatGBP), { best: 'min', numeric: car => midpoint(car.usedGBP) })}
        ${row('Generation', cars, car => years(car), { numeric: () => NaN })}
        ${row('Body', cars, car => (car.bodies || []).join(' / '), { numeric: () => NaN })}
        ${row('0–62 mph', cars, car => car.accel062 ? `${car.accel062}s` : '—', { best: 'min', numeric: car => car.accel062 })}
        ${row('Power', cars, power, { numeric: car => car.powerBHP?.[1] })}
        ${row('Economy', cars, car => car.mpg != null ? `${car.mpg} mpg` : '—', { numeric: car => car.mpg })}
        ${cars.some(car => car.evMiles != null) ? row('EV range', cars, car => car.evMiles != null ? `${car.evMiles} miles` : '—', { numeric: car => car.evMiles }) : ''}
        ${row('Boot', cars, car => car.bootL ? `${car.bootL} litres` : '—', { numeric: car => car.bootL })}
        ${row('Seats', cars, car => car.seats, { numeric: car => car.seats })}
        ${row('Length', cars, car => car.lenMM ? `${car.lenMM.toLocaleString('en-GB')} mm` : '—', { best: 'min', numeric: car => car.lenMM })}
        ${row('Weight', cars, car => car.kgKerb ? `${car.kgKerb.toLocaleString('en-GB')} kg` : '—', { best: 'min', numeric: car => car.kgKerb })}
        ${row('Build', cars, car => `${car.grades?.build ?? '—'}/100`, { numeric: car => car.grades?.build })}
        ${row('Drive', cars, car => `${car.grades?.drive ?? '—'}/100`, { numeric: car => car.grades?.drive })}
        ${row('Practicality', cars, car => `${car.grades?.practicality ?? '—'}/100`, { numeric: car => car.grades?.practicality })}
        ${row('Value', cars, car => `${car.grades?.value ?? '—'}/100`, { numeric: car => car.grades?.value })}
        ${row('Design', cars, car => `${car.grades?.design ?? '—'}/100`, { numeric: car => car.grades?.design })}
        ${row('Running costs', cars, car => `${car.grades?.running ?? '—'}/100`, { numeric: car => car.grades?.running })}
      </tbody>
    </table>
  </div>`;
}

export function createCompareController(dialog, content = dialog?.querySelector('[data-compare-content]')) {
  let closeCallback = null;
  let closingForNavigation = false;
  let returnFocus = null;

  function open(cars, { focusIndex = null } = {}) {
    if (!dialog || !content) return;
    const wasOpen = Boolean(dialog.open || dialog.hasAttribute('open'));
    if (!wasOpen) returnFocus = document.activeElement;
    content.innerHTML = comparisonMarkup(cars);
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    else dialog.setAttribute('open', '');
    requestAnimationFrame(() => {
      if (Number.isInteger(focusIndex)) {
        const removeButtons = [...dialog.querySelectorAll('.compare-car [data-action="compare"]')];
        removeButtons[Math.min(focusIndex, removeButtons.length - 1)]?.focus();
      } else if (!wasOpen) dialog.querySelector('[data-close-compare]')?.focus();
    });
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
    else if (dialog.hasAttribute('open')) {
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
    if (event.target.closest?.('[data-close-compare]') || event.target === dialog) close();
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
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
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
