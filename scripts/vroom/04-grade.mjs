// Grounded, resumable batch grader. Writes state/grade-overlays.json; catalogue remains canonical.
// Usage: node scripts/vroom/04-grade.mjs [--plan] [--limit=24] [--force]
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalogue } from './05-validate.mjs';
import { extractJson, groundedGenerate, DEFAULT_MODEL } from './lib/gemini.mjs';
import { chunks, concurrentMap, parseArgs, readJson, writeJsonAtomic, clampInt } from './lib/jobs.mjs';
import { slug, vroomScore } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, 'state', 'grade-overlays.json');
const KEYS = ['build', 'drive', 'practicality', 'value', 'design', 'running'];
const CONFIDENCE = new Set(['high', 'medium', 'low']);

function gradePrompt(batch) {
  const records = batch.map(car => ({
    id: car.id, make: car.make, model: car.model, gen: car.gen, years: car.years,
    segment: car.segment, bodies: car.bodies, usedGBP: car.used, fuels: car.fuels,
    specs: { accel062: car.accel, powerBHP: car.power, mpg: car.mpg, evMiles: car.ev, seats: car.seats, bootL: car.boot, kg: car.kg },
    currentGrades: car.g, verdict: car.verdict, issues: car.issues, tags: car.tags
  }));
  return `Re-grade these UK-market car generations for the Vroom picker using grounded automotive evidence.
Return JSON only: {"results":[{"id":"...","grades":{"build":0,"drive":0,"practicality":0,"value":0,"design":0,"running":0},"confidence":"high|medium|low","rationale":"brief"}]}.
Return every id exactly once and every grade as an integer 20–99.

FORCED-DISTRIBUTION RUBRIC (use the full scale; do not cluster around 70):
- 90–99: generational icon / segment benchmark; exceptionally rare.
- 83–89: class leader or genuinely outstanding.
- 72–82: good to very good, with meaningful compromises.
- 62–71: average or compromised.
- 50–61: notably weak/dud in this dimension.
- 20–49: severe, ownership-defining failure/cost.
Across the full catalogue target roughly p10 below 62 and p90 above 82. Do not force each small batch to contain extremes.
Judge value at today's UK used prices. Judge running on energy, insurance, servicing, tax and failure risk. Practicality is segment-relative
but still recognises real seats/boot/usability. Design includes enduring desirability, not novelty. Build includes durability and cabin quality.
Known anchors: G-Class high build/design but low value/running; MX-5 high drive; Dacia high value. Treat evidence as decisive, current grades as context only.

RECORDS:
${JSON.stringify(records)}`;
}

function normalize(raw, expected) {
  if (!raw || !expected.has(raw.id) || !raw.grades || typeof raw.grades !== 'object') return null;
  const g = {};
  for (const key of KEYS) {
    const score = clampInt(raw.grades[key], 20, 99);
    if (score == null) return null;
    g[key] = score;
  }
  return {
    g,
    vroom: vroomScore(g, expected.get(raw.id)),
    confidence: CONFIDENCE.has(raw.confidence) ? raw.confidence : 'low',
    rationale: typeof raw.rationale === 'string' ? raw.rationale.slice(0, 500) : ''
  };
}

async function main() {
  const args = parseArgs();
  const batchSize = Math.max(1, Math.min(20, Number(args.batch || 12)));
  const concurrency = Math.max(1, Math.min(12, Number(args.concurrency || 8)));
  const state = args.force ? { schemaVersion: 1, model: args.model || DEFAULT_MODEL, items: {}, errors: {} }
    : readJson(OUT, { schemaVersion: 1, model: args.model || DEFAULT_MODEL, items: {}, errors: {} });
  state.items ||= {};
  state.errors ||= {};
  const raw = await loadCatalogue();
  // Segment grouping gives the model relevant peers while stable sorting makes resumes predictable.
  let pending = raw.map(car => ({ ...car, id: slug(car.make, car.model, car.gen) }))
    .filter(car => args.force || !state.items[car.id])
    .sort((a, b) => a.segment.localeCompare(b.segment) || a.id.localeCompare(b.id));
  if (args.limit) pending = pending.slice(0, Number(args.limit));
  const batches = chunks(pending, batchSize);
  console.log(`grade: ${raw.length} cars, ${Object.keys(state.items).length} resumed, ${pending.length} pending in ${batches.length} batches`);
  if (args.plan) return;

  await concurrentMap(batches, concurrency, async (batch, batchIndex) => {
    try {
      const response = await groundedGenerate({
        prompt: gradePrompt(batch), model: args.model || DEFAULT_MODEL, temperature: 0.25, grounded: true
      });
      const parsed = extractJson(response.text);
      const results = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.results) ? parsed.results : [];
      const expected = new Map(batch.map(car => [car.id, car]));
      const found = new Set();
      for (const rawResult of results) {
        const result = normalize(rawResult, expected);
        if (!result || found.has(rawResult.id)) continue;
        found.add(rawResult.id);
        state.items[rawResult.id] = { ...result, sources: response.sources, queries: response.queries };
        delete state.errors[rawResult.id];
      }
      for (const car of batch) if (!found.has(car.id)) state.errors[car.id] = 'model response omitted or malformed this id';
      writeJsonAtomic(OUT, state);
      console.log(`  batch ${batchIndex + 1}/${batches.length}: ${found.size}/${batch.length} graded`);
    } catch (error) {
      for (const car of batch) state.errors[car.id] = String(error?.message || error).slice(0, 500);
      writeJsonAtomic(OUT, state);
      console.error(`  batch ${batchIndex + 1}/${batches.length}: failed (${error?.message || error})`);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
