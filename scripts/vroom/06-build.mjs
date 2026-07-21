// Deterministic Vroom data build. Merges catalogue + reviewed overlays + images.
// Usage: node scripts/vroom/06-build.mjs [--shipping] [--min=1000]
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyStateOverlays, checkCar, loadCatalogue, validate } from './05-validate.mjs';
import { parseArgs, readJson, writeJsonAtomic } from './lib/jobs.mjs';
import { slug, vroomScore } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..', '..');
const OUT_DIR = join(ROOT, 'vroom', 'data');
const CARS_PATH = join(OUT_DIR, 'cars.json');
const META_PATH = join(OUT_DIR, 'meta.json');

function cleanImage(image) {
  if (!image?.src || !/^https?:\/\//i.test(image.src)) return null;
  const filePage = image.file
    ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(image.file).replace(/ /g, '_'))}`
    : null;
  return {
    src: image.src,
    w: Number.isFinite(Number(image.w)) ? Number(image.w) : null,
    h: Number.isFinite(Number(image.h)) ? Number(image.h) : null,
    credit: image.credit || null,
    license: image.license || null,
    page: filePage || image.page || null
  };
}

function expand(car, image) {
  const result = {
    id: slug(car.make, car.model, car.gen),
    make: car.make,
    model: car.model,
    gen: car.gen,
    years: car.years,
    bodies: car.bodies,
    segment: car.segment,
    priceNewGBP: car.priceNew,
    usedGBP: car.used,
    accel062: car.accel,
    powerBHP: car.power,
    topMph: car.top,
    fuels: car.fuels,
    mpg: car.mpg,
    evMiles: car.ev,
    seats: car.seats,
    doors: car.doors,
    bootL: car.boot,
    lenMM: car.len,
    kgKerb: car.kg,
    milesPerYear: car.mpy,
    ncap: car.ncap,
    onSale: car.onSale,
    halo: car.halo,
    grades: car.g,
    vroom: vroomScore(car.g, car),
    verdict: car.verdict,
    issues: car.issues,
    buy: car.buy,
    tags: car.tags,
    rivals: car.rivals,
    img: cleanImage(image)
  };
  if (car.genName) result.genName = car.genName;
  return result;
}

function frequencies(cars, key) {
  const counts = {};
  for (const car of cars) {
    const values = Array.isArray(car[key]) ? car[key] : [car[key]];
    for (const value of values) counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function numericBounds(values, fallback = [0, 0]) {
  const valid = values.flat().filter(value => typeof value === 'number' && Number.isFinite(value));
  return valid.length ? [Math.min(...valid), Math.max(...valid)] : fallback;
}

function coverage(count, total) {
  return { count, total, pct: total ? Number((count / total * 100).toFixed(1)) : 0 };
}

async function main() {
  const args = parseArgs();
  const raw = await loadCatalogue();
  const images = readJson(join(DIR, 'state', 'images.json'), {});
  const merged = applyStateOverlays(raw);
  const errs = [], warnings = [];
  for (const car of merged) checkCar(car, errs, warnings);
  if (errs.length) throw new Error(`Refusing to build invalid overlaid data:\n${errs.slice(0, 20).join('\n')}`);

  const cars = merged.map(car => expand(car, images[slug(car.make, car.model, car.gen)]))
    .sort((a, b) => a.id.localeCompare(b.id));
  const imageCount = cars.filter(car => car.img).length;
  const attributionCount = cars.filter(car => car.img?.credit && car.img?.license && car.img?.page).length;
  const ids = new Set(cars.map(car => car.id));
  const rivalTotal = cars.reduce((sum, car) => sum + car.rivals.length, 0);
  const rivalsResolved = cars.reduce((sum, car) => sum + car.rivals.filter(id => ids.has(id)).length, 0);
  const carsText = `${JSON.stringify(cars)}\n`;
  const sha256 = createHash('sha256').update(carsText).digest('hex');
  const bytes = Buffer.byteLength(carsText);
  const maxAge = Math.max(...cars.map(car => 2026 - car.years[0]), 0);
  const meta = {
    schemaVersion: 1,
    dataVersion: sha256.slice(0, 12),
    count: cars.length,
    makes: [...new Set(cars.map(car => car.make))].sort(),
    bounds: {
      budgetGBP: [5000, 100000],
      usedGBP: numericBounds(cars.map(car => car.usedGBP)),
      year: numericBounds(cars.map(car => [car.years[0], car.years[1] || 2026])),
      ageYears: [0, maxAge],
      accel062: numericBounds(cars.map(car => car.accel062)),
      mpg: numericBounds(cars.map(car => car.mpg)),
      evMiles: numericBounds(cars.map(car => car.evMiles))
    },
    counts: {
      makes: frequencies(cars, 'make'),
      bodies: frequencies(cars, 'bodies'),
      segments: frequencies(cars, 'segment'),
      fuels: frequencies(cars, 'fuels')
    },
    coverage: {
      images: coverage(imageCount, cars.length),
      attribution: coverage(attributionCount, imageCount),
      rivals: coverage(rivalsResolved, rivalTotal)
    },
    build: { bytes, sha256 }
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${CARS_PATH}.tmp`, carsText);
  renameSync(`${CARS_PATH}.tmp`, CARS_PATH);
  writeJsonAtomic(META_PATH, meta);
  console.log(`built ${cars.length} cars → vroom/data/cars.json (${(bytes / 1_000_000).toFixed(2)} MB, ${imageCount} images, ${attributionCount} attributed)`);

  if (args.shipping) {
    const result = await validate({ shipping: true, min: args.min ?? 1000 });
    const failed = result.gates.filter(([, ok]) => !ok);
    for (const [label, ok] of result.gates) console.log(ok ? ` ✓ ${label}` : ` ✗ GATE FAILED: ${label}`);
    if (failed.length) throw new Error(`shipping build blocked by ${failed.length} failed gate(s)`);
  } else if (bytes > 1_600_000) {
    console.warn(`warning: cars.json exceeds shipping cap (1.60 MB)`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
