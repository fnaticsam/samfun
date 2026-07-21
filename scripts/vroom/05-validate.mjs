// Vroom validator — schema checks in development, full release gates with --shipping.
// Usage: node scripts/vroom/05-validate.mjs [--quiet] [--warn] [--min=1] [--shipping]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BODIES, SEGMENTS, FUELS, TAGS, vroomScore, slug } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const CAT = join(DIR, 'catalogue');
const ROOT = join(DIR, '..', '..');
const IMAGE_STATE = join(DIR, 'state', 'images.json');
const BUILT_CARS = join(ROOT, 'vroom', 'data', 'cars.json');
const BUILT_META = join(ROOT, 'vroom', 'data', 'meta.json');
const YEAR = 2026;
const GRADE_KEYS = ['build', 'drive', 'practicality', 'value', 'design', 'running'];
const SPEC_FIELDS = new Set(['years', 'priceNew', 'used', 'accel', 'power', 'top', 'fuels', 'mpg', 'ev', 'seats', 'doors', 'boot', 'len', 'kg', 'mpy', 'ncap', 'onSale']);
// Historic source spelling variants which point at the same canonical catalogue id.
export const RIVAL_ALIASES = Object.freeze({
  'volkswagen-id-3-e11': 'volkswagen-id3-e11',
  'volkswagen-id-4-id-5-e21': 'volkswagen-id4-id5-e21',
  'ford-ranger-t6-2': 'ford-ranger-t62'
});

export function parseArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(argv.map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }));
}

export async function loadCatalogue() {
  const files = readdirSync(CAT).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  const all = [];
  for (const f of files) {
    const mod = (await import(pathToFileURL(join(CAT, f)).href)).default;
    if (!mod || !mod.make || !Array.isArray(mod.cars)) throw new Error(`${f}: bad module shape`);
    for (const c of mod.cars) all.push({ file: f, make: mod.make, ...c });
  }
  return all;
}

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const unique = list => Array.isArray(list) && new Set(list).size === list.length;
const isTextList = (list, max) => Array.isArray(list) && list.length <= max && list.every(v => typeof v === 'string' && v.trim());
const normalizeIdentity = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const stableJson = value => JSON.stringify(value);

// This deliberately includes the make and model as well as all factual fields. It
// catches two records for the same car/generation with a different display gen,
// without treating co-developed cars or similarly-specced rivals as duplicates.
export function exactSpecFingerprint(car) {
  return stableJson({
    make: normalizeIdentity(car.make),
    model: normalizeIdentity(car.model),
    years: car.years,
    bodies: car.bodies,
    segment: car.segment,
    priceNew: car.priceNew,
    used: car.used,
    accel: car.accel,
    power: car.power,
    top: car.top,
    fuels: car.fuels,
    mpg: car.mpg,
    ev: car.ev,
    seats: car.seats,
    doors: car.doors,
    boot: car.boot,
    len: car.len,
    kg: car.kg,
    mpy: car.mpy,
    ncap: car.ncap,
    onSale: car.onSale,
    halo: car.halo
  });
}

const gradeVector = car => GRADE_KEYS.map(key => car.g?.[key]).join('/');

export function semanticDiagnostics(cars, { gradeTemplateThreshold = 7, minimumMakeSample = 4 } = {}) {
  const idsByFingerprint = new Map();
  const haloAffordable = [];
  const gradesByVector = new Map();
  const gradesByMake = new Map();

  for (const car of cars) {
    const id = slug(car.make, car.model, car.gen);
    const fingerprint = exactSpecFingerprint(car);
    const sameSpec = idsByFingerprint.get(fingerprint) || [];
    sameSpec.push(id);
    idsByFingerprint.set(fingerprint, sameSpec);

    if (car.halo === true && car.used?.[1] <= 100_000) haloAffordable.push(id);

    const vector = gradeVector(car);
    const vectorIds = gradesByVector.get(vector) || [];
    vectorIds.push(id);
    gradesByVector.set(vector, vectorIds);
    const make = normalizeIdentity(car.make);
    const makeVectors = gradesByMake.get(make) || new Set();
    makeVectors.add(vector);
    gradesByMake.set(make, makeVectors);
  }

  const specDuplicates = [...idsByFingerprint.values()].filter(ids => ids.length > 1);
  const repeatedGradeTemplates = [...gradesByVector.entries()]
    .filter(([, ids]) => ids.length >= gradeTemplateThreshold)
    .map(([vector, ids]) => ({ vector, ids }));
  const makeGradeVariance = [...gradesByMake.entries()]
    .map(([make, vectors]) => ({
      make,
      cars: cars.filter(car => normalizeIdentity(car.make) === make).length,
      vectors: vectors.size
    }))
    .filter(({ cars: count }) => count >= minimumMakeSample)
    .sort((a, b) => a.make.localeCompare(b.make));
  const flatGradeMakes = makeGradeVariance.filter(({ vectors }) => vectors === 1);

  return { specDuplicates, haloAffordable, repeatedGradeTemplates, makeGradeVariance, flatGradeMakes };
}

export function checkCar(c, errs, warn) {
  const id = slug(c.make, c.model, c.gen);
  const e = msg => errs.push(`${id}: ${msg}`);
  const w = msg => warn.push(`${id}: ${msg}`);

  if (!c.model || !c.gen || !c.make) e('missing make/model/gen');
  if (!Array.isArray(c.years) || c.years.length !== 2 || !c.years.every(Number.isInteger)) e('years must be two integer years');
  else {
    const [y0, y1] = c.years;
    // The picker intentionally includes post-war classics and future announced models.
    if (y0 < 1950 || y0 > YEAR + 2) e(`years from ${y0} out of 1950–${YEAR + 2}`);
    if (y1 !== 0 && (y1 < y0 || y1 > YEAR + 2)) e(`years to ${y1} incoherent`);
    if (y1 === 0 && c.onSale === false) e('years "present" but onSale false');
    if (y1 !== 0 && c.onSale === true && y1 < YEAR) w('onSale true despite ended production years');
  }
  if (!Array.isArray(c.bodies) || !c.bodies.length || !unique(c.bodies) || c.bodies.some(b => !BODIES.includes(b))) e(`bad/duplicate bodies ${JSON.stringify(c.bodies)}`);
  if (!SEGMENTS.includes(c.segment)) e(`bad segment ${c.segment}`);
  for (const k of ['priceNew', 'used', 'power']) {
    const v = c[k];
    if (!Array.isArray(v) || v.length !== 2 || !v.every(isFiniteNumber) || !(v[0] <= v[1]) || v[0] <= 0) e(`${k} must be [lo,hi] ascending positive numbers, got ${JSON.stringify(v)}`);
  }
  if (c.priceNew && (c.priceNew[0] < 500 || c.priceNew[1] > 1_000_000)) e(`new-price band suspicious ${JSON.stringify(c.priceNew)}`);
  if (c.used && (c.used[0] < 500 || c.used[1] > 1_000_000)) e(`used band suspicious ${JSON.stringify(c.used)}`);
  if (!(c.accel >= 1.5 && c.accel <= 30)) e(`accel062 ${c.accel} out of 1.5–30s`);
  if (!(c.top >= 55 && c.top <= 300)) e(`top speed ${c.top} out of 55–300mph`);
  if (!Array.isArray(c.fuels) || !c.fuels.length || !unique(c.fuels) || c.fuels.some(f => !FUELS.includes(f))) e(`bad/duplicate fuels ${JSON.stringify(c.fuels)}`);
  const isEvOnly = c.fuels?.length === 1 && c.fuels[0] === 'ev';
  if (isEvOnly && c.mpg != null) e('EV-only entry has mpg');
  if (!isEvOnly && (c.mpg == null || c.mpg < 8 || c.mpg > 150)) e(`mpg ${c.mpg} bad for ICE/hybrid`);
  if ((c.fuels?.includes('ev') || c.fuels?.includes('phev')) && (c.ev == null || c.ev < 5 || c.ev > 650)) e(`evMiles ${c.ev} bad for EV/PHEV`);
  if (!c.fuels?.includes('ev') && !c.fuels?.includes('phev') && c.ev != null) e('evMiles set on non-plug-in');
  if (!(Number.isInteger(c.seats) && c.seats >= 1 && c.seats <= 9)) e(`seats ${c.seats}`);
  if ((c.segment === 'seven-seater' || c.tags?.includes('seven-seats')) && c.seats < 7) {
    e(`seven-seat segment/tag requires at least 7 seats, got ${c.seats}`);
  }
  if (!(Number.isInteger(c.doors) && c.doors >= 2 && c.doors <= 6)) e(`doors ${c.doors}`);
  if (!(c.boot >= 30 && c.boot <= 5000)) e(`boot ${c.boot}L`);
  if (!(c.len >= 2400 && c.len <= 6500)) e(`length ${c.len}mm`);
  if (!(c.kg >= 450 && c.kg <= 4500)) e(`kerb ${c.kg}kg`);
  if (!(c.mpy >= 1000 && c.mpy <= 30000)) e(`milesPerYear ${c.mpy}`);
  if (c.ncap != null && (!Array.isArray(c.ncap) || c.ncap.length !== 2 || !Number.isInteger(c.ncap[0]) || c.ncap[0] < 1 || c.ncap[0] > 5 || !Number.isInteger(c.ncap[1]) || c.ncap[1] < 1997 || c.ncap[1] > YEAR + 1)) e(`ncap ${JSON.stringify(c.ncap)}`);
  if (typeof c.onSale !== 'boolean' || typeof c.halo !== 'boolean') e('onSale/halo must be boolean');

  const g = c.g || {};
  if (!unique(Object.keys(g)) || Object.keys(g).some(k => !GRADE_KEYS.includes(k))) e(`grades have unknown keys ${JSON.stringify(Object.keys(g))}`);
  for (const k of GRADE_KEYS) if (!(Number.isInteger(g[k]) && g[k] >= 20 && g[k] <= 99)) e(`grade ${k}=${g[k]} out of 20–99 integer range`);
  if (!c.verdict || typeof c.verdict !== 'string' || c.verdict.trim().length < 40) e('verdict missing/too short');
  if (c.verdict?.length > 160) w(`verdict long (${c.verdict.length})`);
  if (!isTextList(c.issues, 2)) e('issues must be an array of ≤2 non-empty strings');
  if (!c.buy || typeof c.buy !== 'string' || c.buy.trim().length < 15) e('buy note missing/too short');
  if (c.buy?.length > 130) w(`buy note long (${c.buy.length})`);
  if (!Array.isArray(c.tags) || c.tags.length < 3 || c.tags.length > 8 || !unique(c.tags)) e(`need 3–8 unique tags, got ${JSON.stringify(c.tags)}`);
  else for (const t of c.tags) if (!TAGS.includes(t)) e(`unknown tag "${t}"`);
  if (!isTextList(c.rivals, 5) || c.rivals.length < 1 || !unique(c.rivals)) e('rivals must be 1–5 unique non-empty ids');
  if (c.rivals?.includes(id)) e('self-reference in rivals');
  return id;
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

function overlayItems(path) {
  const value = readJson(path, {});
  return value?.items && typeof value.items === 'object' ? value.items : value;
}

export function applyStateOverlays(cars) {
  const specs = overlayItems(join(DIR, 'state', 'spec-overrides.json'));
  const grades = overlayItems(join(DIR, 'state', 'grade-overlays.json'));
  const rivals = overlayItems(join(DIR, 'state', 'rival-overrides.json'));
  return cars.map(car => {
    const id = slug(car.make, car.model, car.gen);
    const merged = { ...car };
    if (Array.isArray(merged.rivals)) merged.rivals = merged.rivals.map(id => RIVAL_ALIASES[id] || id);
    if (specs[id] && typeof specs[id] === 'object') {
      for (const [key, value] of Object.entries(specs[id])) if (SPEC_FIELDS.has(key)) merged[key] = value;
    }
    const g = grades[id]?.g || grades[id]?.grades;
    if (g && typeof g === 'object') merged.g = { ...merged.g, ...g };
    // Rival repair is intentionally an array replacement, rather than a merge:
    // the generated review is the complete, deterministic list for this source.
    if (Array.isArray(rivals[id]?.rivals)) merged.rivals = [...rivals[id].rivals];
    return merged;
  });
}

function famousChecks(cars) {
  const checks = [];
  const matching = (re, predicate, label) => {
    const found = cars.filter(c => re.test(slug(c.make, c.model, c.gen)));
    checks.push([`${label} (${found.length} entries)`, found.length > 0 && found.every(predicate)]);
  };
  matching(/mercedes-benz-g-class-/, c => c.g.build >= 88 && c.g.design >= 88 && c.g.value <= 65 && c.g.running <= 40,
    'G-Class: high build/design, low value/running');
  matching(/mazda-mx-5-/, c => c.g.drive >= 82, 'MX-5: high drive');
  matching(/^dacia-/, c => c.g.value >= 78, 'Dacia: high value');
  return checks;
}

export async function validate(options = {}) {
  const cars = applyStateOverlays(await loadCatalogue());
  const shipping = Boolean(options.shipping);
  const min = Number(options.min ?? (shipping ? 1000 : 1));
  const errs = [], warn = [], ids = new Map();
  for (const c of cars) {
    const id = checkCar(c, errs, warn);
    if (ids.has(id)) errs.push(`DUPLICATE id ${id} (${ids.get(id)} + ${c.file})`);
    ids.set(id, c.file);
  }

  let missingRivals = 0;
  for (const c of cars) for (const rival of c.rivals || []) if (!ids.has(rival)) missingRivals++;
  if (missingRivals) warn.push(`${missingRivals} rival references do not resolve yet`);

  const diagnostics = semanticDiagnostics(cars, {
    gradeTemplateThreshold: Number(options.gradeTemplateThreshold ?? 7)
  });
  for (const { vector, ids: repeated } of diagnostics.repeatedGradeTemplates) {
    warn.push(`grade template reused ${repeated.length} times (${vector}): ${repeated.slice(0, 5).join(', ')}${repeated.length > 5 ? '…' : ''}`);
  }
  for (const { make, cars: count } of diagnostics.flatGradeMakes) {
    warn.push(`${make}: all ${count} entries share one grade vector; add within-make variation`);
  }
  // These are release-only checks: development remains useful while a bounded
  // catalogue repair packet is in flight, but shipping cannot silently publish
  // semantic duplicates or a halo flag that contradicts its price positioning.
  if (shipping) {
    for (const duplicate of diagnostics.specDuplicates) {
      errs.push(`DUPLICATE exact specification fingerprint: ${duplicate.join(' + ')}`);
    }
    for (const id of diagnostics.haloAffordable) {
      errs.push(`${id}: halo=true but used maximum is £100,000 or below`);
    }
  }

  const scores = cars.map(c => vroomScore(c.g, c)).sort((a, b) => a - b);
  const percentile = q => scores[Math.floor(q * (scores.length - 1))] ?? 0;
  const hist = {};
  for (const score of scores) { const band = `${Math.floor(score / 10) * 10}s`; hist[band] = (hist[band] || 0) + 1; }

  const images = readJson(IMAGE_STATE, {});
  const imageCount = cars.filter(c => images[slug(c.make, c.model, c.gen)]?.src).length;
  const attributionCount = cars.filter(c => {
    const img = images[slug(c.make, c.model, c.gen)];
    const materialPage = img?.file
      || /^https:\/\/commons\.wikimedia\.org\/wiki\/(?:File|Special:Redirect\/file)/i.test(img?.page || '');
    return img?.src && img.credit && img.license && materialPage;
  }).length;
  const imageCoverage = cars.length ? imageCount / cars.length : 0;
  const attributionCoverage = imageCount ? attributionCount / imageCount : 0;

  const releaseGates = [
    [`catalogue count ${cars.length} ≥ ${min}`, cars.length >= min],
    [`score spread p10=${percentile(0.1)} < 62`, percentile(0.1) < 62],
    [`score spread p90=${percentile(0.9)} > 82`, percentile(0.9) > 82],
    [`all rival ids resolve (${missingRivals} missing)`, missingRivals === 0],
    [`real-image coverage ${(imageCoverage * 100).toFixed(1)}% ≥ 95%`, imageCoverage >= .95],
    [`complete image attribution ${(attributionCoverage * 100).toFixed(1)}% ≥ 95%`, attributionCoverage >= .95],
    ...famousChecks(cars)
  ];
  const builtCars = readJson(BUILT_CARS, null);
  const builtMeta = readJson(BUILT_META, null);
  const builtIds = Array.isArray(builtCars) ? new Set(builtCars.map(c => c.id)) : new Set();
  const buildBytes = existsSync(BUILT_CARS) ? statSync(BUILT_CARS).size : Infinity;
  releaseGates.push(
    ['built cars.json exists and parses as an array', Array.isArray(builtCars)],
    ['built meta.json exists and matches catalogue count', builtMeta?.count === cars.length],
    [`built ids match catalogue (${builtIds.size}/${ids.size})`, builtIds.size === ids.size && [...ids.keys()].every(id => builtIds.has(id))],
    [`cars.json ${(buildBytes / 1_000_000).toFixed(2)} MB ≤ 1.60 MB`, buildBytes <= 1_600_000]
  );

  const gates = [
    ['no schema errors', errs.length === 0],
    ...(shipping ? releaseGates : [[`development count ${cars.length} ≥ ${min}`, cars.length >= min]])
  ];
  return { cars, errs, warn, ids, scores, hist, percentile, missingRivals, imageCount, attributionCount, diagnostics, releaseGates, gates };
}

async function main() {
  const args = parseArgs();
  const result = await validate(args);
  const { cars, errs, warn, hist, percentile, missingRivals, imageCount, attributionCount, releaseGates, gates } = result;
  if (!args.quiet) {
    console.log(`\nVROOM VALIDATE — ${cars.length} cars from ${new Set(cars.map(c => c.file)).size} files${args.shipping ? ' [SHIPPING]' : ' [DEVELOPMENT]'}`);
    const perMake = {};
    for (const c of cars) perMake[c.make] = (perMake[c.make] || 0) + 1;
    console.log(Object.entries(perMake).sort((a, b) => b[1] - a[1]).map(([make, count]) => `${make}:${count}`).join('  '));
    console.log('score hist:', JSON.stringify(hist), `p10=${percentile(.1)} p50=${percentile(.5)} p90=${percentile(.9)}`);
    console.log(`rival refs missing: ${missingRivals}; images: ${imageCount}/${cars.length}; attributed: ${attributionCount}/${imageCount}; warnings: ${warn.length}`);
    if (args.warn) for (const message of warn) console.log('  warn:', message);
    if (!args.shipping) {
      console.log('release readiness (informational; enforce with --shipping):');
      for (const [label, ok] of releaseGates) console.log(ok ? `  ready: ${label}` : `  pending: ${label}`);
    }
  }
  if (errs.length) {
    console.error(`\n${errs.length} ERRORS:`);
    for (const message of errs.slice(0, 60)) console.error('  ✗', message);
    if (errs.length > 60) console.error(`  … +${errs.length - 60} more`);
  }
  const failed = gates.filter(([, ok]) => !ok);
  for (const [label, ok] of gates) console.log(ok ? ` ✓ ${label}` : ` ✗ GATE FAILED: ${label}`);
  process.exitCode = failed.length ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
