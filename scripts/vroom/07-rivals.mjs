// Deterministic rival repair for frozen catalogue sources.
// Usage: node scripts/vroom/07-rivals.mjs [--check]
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalogue, parseArgs, RIVAL_ALIASES } from './05-validate.mjs';
import { slug } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(DIR, 'state', 'rival-overrides.json');

const overlap = (left = [], right = []) => {
  const rightSet = new Set(right);
  return left.reduce((count, item) => count + Number(rightSet.has(item)), 0);
};

const priceDistance = (left, right) => {
  const leftMid = (left.used[0] + left.used[1]) / 2;
  const rightMid = (right.used[0] + right.used[1]) / 2;
  return Math.abs(Math.log(leftMid / rightMid));
};

function compareCandidates(source, left, right) {
  const rows = [left, right].map(car => ({
    segment: Number(car.segment !== source.segment),
    bodies: overlap(source.bodies, car.bodies),
    tags: overlap(source.tags, car.tags),
    fuels: overlap(source.fuels, car.fuels),
    price: priceDistance(source, car),
    era: Math.abs(source.years[0] - car.years[0]),
    id: slug(car.make, car.model, car.gen)
  }));
  for (const key of ['segment']) if (rows[0][key] !== rows[1][key]) return rows[0][key] - rows[1][key];
  for (const key of ['bodies', 'tags', 'fuels']) if (rows[0][key] !== rows[1][key]) return rows[1][key] - rows[0][key];
  for (const key of ['price', 'era']) if (rows[0][key] !== rows[1][key]) return rows[0][key] - rows[1][key];
  return rows[0].id.localeCompare(rows[1].id);
}

export function repairRivals(cars) {
  const byId = new Map(cars.map(car => [slug(car.make, car.model, car.gen), car]));
  const items = {};
  let replaced = 0;

  for (const source of cars) {
    const sourceId = slug(source.make, source.model, source.gen);
    const authored = (source.rivals || []).map(rawId => RIVAL_ALIASES[rawId] || rawId);
    const repaired = [];
    const seen = new Set();
    for (const rawId of source.rivals || []) {
      const rivalId = RIVAL_ALIASES[rawId] || rawId;
      if (rivalId !== sourceId && byId.has(rivalId) && !seen.has(rivalId)) {
        repaired.push(rivalId);
        seen.add(rivalId);
      } else {
        replaced++;
      }
    }
    if (repaired.length === source.rivals.length && repaired.every((id, index) => id === authored[index])) continue;

    const candidates = [...byId.values()]
      .filter(candidate => {
        const id = slug(candidate.make, candidate.model, candidate.gen);
        return id !== sourceId && !seen.has(id);
      })
      .sort((left, right) => compareCandidates(source, left, right));
    for (const candidate of candidates) {
      if (repaired.length === source.rivals.length) break;
      const candidateId = slug(candidate.make, candidate.model, candidate.gen);
      repaired.push(candidateId);
      seen.add(candidateId);
    }
    if (repaired.length !== source.rivals.length) throw new Error(`${sourceId}: unable to fill all rival slots`);
    items[sourceId] = { rivals: repaired };
  }

  return { version: 1, items, repairedSources: Object.keys(items).length, replaced };
}

export function serializeOverrides(overrides) {
  return `${JSON.stringify({ version: overrides.version, items: overrides.items }, null, 2)}\n`;
}

async function main() {
  const args = parseArgs();
  const result = repairRivals(await loadCatalogue());
  const text = serializeOverrides(result);
  if (args.check) {
    const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
    if (current !== text) throw new Error('rival overrides are stale; run node scripts/vroom/07-rivals.mjs');
    console.log(`rival overrides current: ${result.repairedSources} sources, ${result.replaced} repaired slots`);
    return;
  }
  writeFileSync(`${OUTPUT}.tmp`, text);
  renameSync(`${OUTPUT}.tmp`, OUTPUT);
  console.log(`wrote ${result.repairedSources} rival overrides (${result.replaced} repaired slots)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
