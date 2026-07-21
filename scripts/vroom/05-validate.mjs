// Vroom validator — loads catalogue/*.mjs, enforces schema/vocab/sanity gates.
// Usage: node scripts/vroom/05-validate.mjs [--quiet] [--min=1000]
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BODIES, SEGMENTS, FUELS, TAGS, vroomScore, slug } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const CAT = join(DIR, 'catalogue');
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const MIN = Number(args.min || 1000);
const YEAR = 2026;

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

export function checkCar(c, errs, warn) {
  const id = slug(c.make, c.model, c.gen);
  const e = (msg) => errs.push(`${id}: ${msg}`);
  const w = (msg) => warn.push(`${id}: ${msg}`);

  if (!c.model || !c.gen) e('missing model/gen');
  if (!Array.isArray(c.years) || c.years.length !== 2) e('years must be [from,to]');
  else {
    const [y0, y1] = c.years;
    if (y0 < 1980 || y0 > YEAR) e(`years from ${y0} out of range`);
    if (y1 !== 0 && (y1 < y0 || y1 > YEAR + 1)) e(`years to ${y1} incoherent`);
    if (y1 === 0 && c.onSale === false) e('years "present" but onSale false');
  }
  if (!Array.isArray(c.bodies) || !c.bodies.length || c.bodies.some(b => !BODIES.includes(b))) e(`bad bodies ${JSON.stringify(c.bodies)}`);
  if (!SEGMENTS.includes(c.segment)) e(`bad segment ${c.segment}`);
  for (const k of ['priceNew', 'used', 'power']) {
    const v = c[k];
    if (!Array.isArray(v) || v.length !== 2 || !(v[0] <= v[1]) || v[0] <= 0) e(`${k} must be [lo,hi] ascending, got ${JSON.stringify(v)}`);
  }
  if (c.used && (c.used[0] < 800 || c.used[1] > 400000)) e(`used band suspicious ${JSON.stringify(c.used)}`);
  if (!(c.accel >= 2.2 && c.accel <= 22)) e(`accel062 ${c.accel} out of 2.2–22s`);
  if (!(c.top >= 80 && c.top <= 220)) e(`top speed ${c.top} out of range`);
  if (!Array.isArray(c.fuels) || !c.fuels.length || c.fuels.some(f => !FUELS.includes(f))) e(`bad fuels ${JSON.stringify(c.fuels)}`);
  const isEvOnly = c.fuels.length === 1 && c.fuels[0] === 'ev';
  if (isEvOnly && c.mpg != null) e('EV-only entry has mpg');
  if (!isEvOnly && (c.mpg == null || c.mpg < 15 || c.mpg > 100)) e(`mpg ${c.mpg} bad for ICE/hybrid`);
  if ((c.fuels.includes('ev') || c.fuels.includes('phev')) && (c.ev == null || c.ev < 5 || c.ev > 500)) e(`evMiles ${c.ev} bad for ev/phev`);
  if (!c.fuels.includes('ev') && !c.fuels.includes('phev') && c.ev != null) e('evMiles set on non-plug-in');
  if (!(c.seats >= 2 && c.seats <= 9)) e(`seats ${c.seats}`);
  if (!(c.doors >= 2 && c.doors <= 5)) e(`doors ${c.doors}`);
  if (!(c.boot >= 90 && c.boot <= 4000)) e(`boot ${c.boot}L`);
  if (!(c.len >= 2500 && c.len <= 5700)) e(`length ${c.len}mm`);
  if (!(c.kg >= 700 && c.kg <= 3500)) e(`kerb ${c.kg}kg`);
  if (!(c.mpy >= 3000 && c.mpy <= 25000)) e(`milesPerYear ${c.mpy}`);
  if (c.ncap != null && (!Array.isArray(c.ncap) || c.ncap[0] < 1 || c.ncap[0] > 5)) e(`ncap ${JSON.stringify(c.ncap)}`);
  if (typeof c.onSale !== 'boolean' || typeof c.halo !== 'boolean') e('onSale/halo must be boolean');

  const g = c.g || {};
  for (const k of ['build', 'drive', 'practicality', 'value', 'design', 'running']) {
    if (!(g[k] >= 20 && g[k] <= 99)) e(`grade ${k}=${g[k]} out of 20–99`);
  }
  if (!c.verdict || c.verdict.length < 40) e('verdict missing/too short');
  if (c.verdict && c.verdict.length > 160) w(`verdict long (${c.verdict.length})`);
  if (!Array.isArray(c.issues) || c.issues.length > 2) e('issues must be array of ≤2');
  if (!c.buy || c.buy.length < 15) e('buy note missing/too short');
  if (c.buy && c.buy.length > 130) w(`buy note long (${c.buy.length})`);
  if (!Array.isArray(c.tags) || c.tags.length < 3 || c.tags.length > 8) e(`need 3–8 tags, got ${(c.tags || []).length}`);
  else for (const t of c.tags) if (!TAGS.includes(t)) e(`unknown tag "${t}"`);
  if (!Array.isArray(c.rivals) || c.rivals.length < 1) w('no rivals listed');
  return id;
}

async function main() {
  const cars = await loadCatalogue();
  const errs = [], warn = [], ids = new Map();
  for (const c of cars) {
    const id = checkCar(c, errs, warn);
    if (ids.has(id)) errs.push(`DUPLICATE id ${id} (${ids.get(id)} + ${c.file})`);
    ids.set(id, c.file);
  }
  // rival references (soft)
  let missingRivals = 0;
  for (const c of cars) for (const r of c.rivals || []) if (!ids.has(r)) missingRivals++;

  // score distribution
  const scores = cars.map(c => vroomScore(c.g)).sort((a, b) => a - b);
  const p = (q) => scores[Math.floor(q * (scores.length - 1))] ?? 0;
  const hist = {};
  for (const s of scores) { const b = `${Math.floor(s / 10) * 10}s`; hist[b] = (hist[b] || 0) + 1; }

  const gates = [
    [`count ${cars.length} ≥ ${MIN}`, cars.length >= MIN],
    [`score spread p10=${p(0.1)} < 62`, p(0.1) < 62 || scores.length < 50],
    [`score spread p90=${p(0.9)} > 82`, p(0.9) > 82 || scores.length < 50],
    ['no schema errors', errs.length === 0]
  ];

  if (!args.quiet) {
    console.log(`\nVROOM VALIDATE — ${cars.length} cars from ${new Set(cars.map(c => c.file)).size} files`);
    const perMake = {};
    for (const c of cars) perMake[c.make] = (perMake[c.make] || 0) + 1;
    console.log(Object.entries(perMake).sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m}:${n}`).join('  '));
    console.log('score hist:', JSON.stringify(hist), `p10=${p(0.1)} p50=${p(0.5)} p90=${p(0.9)}`);
    console.log(`rival refs missing: ${missingRivals}; warnings: ${warn.length}`);
    if (args.warn) for (const m of warn) console.log('  warn:', m);
  }
  if (errs.length) {
    console.error(`\n${errs.length} ERRORS:`);
    for (const m of errs.slice(0, 60)) console.error('  ✗', m);
    if (errs.length > 60) console.error(`  … +${errs.length - 60} more`);
  }
  const failed = gates.filter(([, ok]) => !ok);
  for (const [label, ok] of gates) console.log(ok ? ` ✓ ${label}` : ` ✗ GATE FAILED: ${label}`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
