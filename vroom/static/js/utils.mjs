export const CURRENT_YEAR = new Date().getFullYear();

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

export function rangesOverlap(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return false;
  const [a0, a1] = a.map(Number);
  const [b0, b1] = b.map(Number);
  return Number.isFinite(a0) && Number.isFinite(a1) && Number.isFinite(b0) && Number.isFinite(b1)
    && Math.max(a0, b0) <= Math.min(a1, b1);
}

const SEARCH_ALIASES = new Map([
  ['vw', 'volkswagen'],
  ['volks wagon', 'volkswagen'],
  ['merc', 'mercedes benz'],
  ['mercedes', 'mercedes benz'],
  ['benz', 'mercedes benz'],
  ['beemer', 'bmw'],
  ['bimmer', 'bmw'],
  ['landie', 'land rover'],
  ['rangie', 'range rover'],
  ['alfa', 'alfa romeo'],
  ['chevy', 'chevrolet'],
  ['citroen', 'citroën'],
  ['skoda', 'škoda'],
  ['4x4', 'off roader suv'],
  ['estate car', 'estate wagon touring'],
  ['wagon', 'estate touring'],
  ['electric', 'ev'],
  ['plug in', 'phev'],
  ['hot hatchback', 'hot hatch'],
  ['miata', 'mx 5'],
  ['g wagon', 'g class'],
  ['g wagen', 'g class'],
  ['disco', 'discovery'],
]);

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function expandSearchQuery(value = '') {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const expanded = [normalized];
  for (const [alias, canonical] of SEARCH_ALIASES) {
    const cleanAlias = normalizeText(alias);
    if (normalized === cleanAlias || normalized.includes(`${cleanAlias} `) || normalized.includes(` ${cleanAlias}`)) {
      expanded.push(normalizeText(normalized.replace(cleanAlias, normalizeText(canonical))));
    }
  }
  return [...new Set(expanded)];
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

export function licenseURL(license = '') {
  const value = String(license).trim();
  const creativeCommons = value.match(/^CC BY(-SA)? (\d\.\d)(?: ([a-z]{2}))?$/i);
  if (creativeCommons) {
    const family = creativeCommons[1] ? 'by-sa' : 'by';
    const locale = creativeCommons[3] ? `${creativeCommons[3].toLowerCase()}/` : '';
    return `https://creativecommons.org/licenses/${family}/${creativeCommons[2]}/${locale}`;
  }
  if (/^CC0$/i.test(value)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/^Public domain$/i.test(value)) return 'https://commons.wikimedia.org/wiki/Commons:Public_domain';
  if (/^GFDL 1\.2$/i.test(value)) return 'https://www.gnu.org/licenses/old-licenses/fdl-1.2.html';
  if (/^FAL$/i.test(value)) return 'https://artlibre.org/licence/lal/en/';
  return '';
}

export const formatGBP = new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0,
}).format;

export const formatNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format;

export function formatBand(range, formatter = formatNumber) {
  return Array.isArray(range) && range.length >= 2
    ? `${formatter(range[0])}–${formatter(range[1])}`
    : '—';
}

export function productionEnd(car, currentYear = CURRENT_YEAR) {
  return Number(car?.years?.[1]) || currentYear;
}

export function productionAgeRange(car, currentYear = CURRENT_YEAR) {
  const start = Number(car?.years?.[0]) || currentYear;
  const end = productionEnd(car, currentYear);
  return [Math.max(0, currentYear - end), Math.max(0, currentYear - start)];
}

export function placeholderImage(label = 'Vroom') {
  const safe = escapeHTML(String(label).slice(0, 42));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="600" fill="#1E3A2C"/><path d="M158 390h584l-48-120-126-61H337l-113 61z" fill="#F1E8D4" opacity=".92"/><circle cx="292" cy="411" r="54" fill="#14160F"/><circle cx="630" cy="411" r="54" fill="#14160F"/><text x="450" y="130" text-anchor="middle" font-family="Georgia,serif" font-size="48" fill="#F1E8D4">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Commons' original files are often substantially larger than a card needs.
// Keep the original `src` as a safe fallback, but let supporting browsers choose
// a sized thumbnail from the same file.
export function wikimediaSrcSet(source, widths = [330, 500, 960, 1280]) {
  if (typeof source !== 'string' || !source.startsWith('https://upload.wikimedia.org/')) return '';
  try {
    const url = new URL(source);
    const marker = '/wikipedia/commons/';
    const path = url.pathname;
    const markerIndex = path.indexOf(marker);
    if (markerIndex < 0) return '';
    const commonsPath = path.slice(markerIndex + marker.length);
    const pieces = commonsPath.split('/').filter(Boolean);
    let directory;
    let filename;
    if (pieces[0] === 'thumb' && pieces.length >= 5) {
      directory = pieces.slice(1, -2);
      filename = pieces.at(-2);
    } else if (pieces.length >= 3) {
      directory = pieces.slice(0, -1);
      filename = pieces.at(-1);
    } else return '';
    // URL.pathname already contains safely escaped path components. Encoding it
    // again turns `%2C` into `%252C` and makes many Commons thumbnails 404.
    const prefix = `${url.origin}${marker}thumb/${directory.join('/')}/${filename}`;
    return widths.map(width => `${prefix}/${width}px-${filename} ${width}w`).join(', ');
  } catch {
    return '';
  }
}

export function setImageFallback(image, label) {
  if (!image || image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.removeAttribute('srcset');
  image.src = placeholderImage(label);
  image.classList.add('is-placeholder');
}
