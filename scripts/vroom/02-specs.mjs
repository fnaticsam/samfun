// Grounded, resumable catalogue fact-checker. It records proposals for review;
// canonical catalogue files are never edited. Use --apply to refresh the build overlay.
// Usage: node scripts/vroom/02-specs.mjs --verify [--plan] [--limit=24] [--apply]
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalogue } from './05-validate.mjs';
import { extractJson, groundedGenerate, DEFAULT_MODEL } from './lib/gemini.mjs';
import { chunks, concurrentMap, parseArgs, readJson, writeJsonAtomic } from './lib/jobs.mjs';
import { slug } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(DIR, 'state', 'spec-verification.json');
const OVERLAY_PATH = join(DIR, 'state', 'spec-overrides.json');
const FIELDS = ['years', 'priceNew', 'used', 'accel', 'power', 'top', 'fuels', 'mpg', 'ev', 'seats', 'doors', 'boot', 'len', 'kg', 'mpy', 'ncap', 'onSale'];
const CONFIDENCE = new Set(['high', 'medium', 'low']);

function publicCar(car) {
  return Object.fromEntries(['id', 'make', 'model', 'gen', ...FIELDS].map(key => [key, car[key]]));
}

function normalizeResult(result, expectedIds) {
  if (!result || !expectedIds.has(result.id)) return null;
  const corrections = {};
  if (result.corrections && typeof result.corrections === 'object' && !Array.isArray(result.corrections)) {
    for (const [key, value] of Object.entries(result.corrections)) if (FIELDS.includes(key) && value !== undefined) corrections[key] = value;
  }
  return {
    id: result.id,
    confidence: CONFIDENCE.has(result.confidence) ? result.confidence : 'low',
    status: Object.keys(corrections).length ? 'corrections-proposed' : 'verified',
    corrections,
    notes: typeof result.notes === 'string' ? result.notes.slice(0, 500) : ''
  };
}

function verificationPrompt(batch) {
  return `Fact-check these UK-market car model-generation records as of July 2026 using web search grounding.
Prioritise manufacturer technical data, Euro NCAP, Parkers/Autocar/What Car, and credible UK used-market evidence.
Check generation identity, production years, UK list and present used-price bands, acceleration, power range, top speed,
fuel choices, representative combined mpg or WLTP EV/PHEV range, seats/doors/boot/length/kerb weight, annual mileage,
NCAP and on-sale state. A range represents mainstream variants across the generation, so do not "correct" it to one trim.
Return JSON only: {"results":[{"id":"...","confidence":"high|medium|low","corrections":{"field":value},"notes":"brief evidence summary"}]}.
Return every id exactly once. corrections must contain only genuinely wrong fields and use the input field names.
Never invent precision; use {} when the existing value is plausible or sources conflict.

RECORDS:
${JSON.stringify(batch.map(publicCar))}`;
}

function resultsArray(json) {
  return Array.isArray(json) ? json : Array.isArray(json?.results) ? json.results : [];
}

function refreshOverlay(state, threshold = 'high') {
  const allowed = threshold === 'medium' ? new Set(['high', 'medium']) : new Set(['high']);
  const items = {};
  for (const [id, result] of Object.entries(state.items || {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (result.status === 'corrections-proposed' && allowed.has(result.confidence) && Object.keys(result.corrections || {}).length) {
      items[id] = result.corrections;
    }
  }
  writeJsonAtomic(OVERLAY_PATH, { schemaVersion: 1, items });
  return Object.keys(items).length;
}

async function main() {
  const args = parseArgs();
  if (!args.verify) throw new Error('Refusing to run without --verify (this script is the verification path)');
  const batchSize = Math.max(1, Math.min(20, Number(args.batch || 12)));
  const concurrency = Math.max(1, Math.min(12, Number(args.concurrency || 8)));
  const state = args.force ? { schemaVersion: 1, model: args.model || DEFAULT_MODEL, items: {}, errors: {} }
    : readJson(STATE_PATH, { schemaVersion: 1, model: args.model || DEFAULT_MODEL, items: {}, errors: {} });
  state.items ||= {};
  state.errors ||= {};
  const raw = await loadCatalogue();
  let pending = raw.map(car => ({ ...car, id: slug(car.make, car.model, car.gen) }))
    .filter(car => args.force || !state.items[car.id]);
  if (args.limit) pending = pending.slice(0, Number(args.limit));
  const batches = chunks(pending, batchSize);
  console.log(`spec verify: ${raw.length} cars, ${Object.keys(state.items).length} resumed, ${pending.length} pending in ${batches.length} batches`);
  if (args.plan) return;

  await concurrentMap(batches, concurrency, async (batch, batchIndex) => {
    try {
      const response = await groundedGenerate({
        prompt: verificationPrompt(batch), model: args.model || DEFAULT_MODEL, temperature: 0.1, grounded: true
      });
      const parsed = resultsArray(extractJson(response.text));
      const expectedIds = new Set(batch.map(car => car.id));
      const found = new Set();
      for (const rawResult of parsed) {
        const result = normalizeResult(rawResult, expectedIds);
        if (!result || found.has(result.id)) continue;
        found.add(result.id);
        state.items[result.id] = { ...result, sources: response.sources, queries: response.queries };
        delete state.errors[result.id];
      }
      for (const car of batch) if (!found.has(car.id)) state.errors[car.id] = 'model response omitted this id';
      writeJsonAtomic(STATE_PATH, state);
      console.log(`  batch ${batchIndex + 1}/${batches.length}: ${found.size}/${batch.length} recorded`);
    } catch (error) {
      for (const car of batch) state.errors[car.id] = String(error?.message || error).slice(0, 500);
      writeJsonAtomic(STATE_PATH, state);
      console.error(`  batch ${batchIndex + 1}/${batches.length}: failed (${error?.message || error})`);
    }
  });

  if (args.apply) {
    const count = refreshOverlay(state, args.confidence || 'high');
    console.log(`spec overlay: ${count} reviewed ${args.confidence === 'medium' ? 'high/medium' : 'high'}-confidence corrections → ${OVERLAY_PATH}`);
  } else {
    console.log('verification recorded; no build overlay changed (pass --apply after review)');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
