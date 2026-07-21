import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export function parseArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(argv.map(arg => {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    return match ? [match[1], match[2] ?? true] : [arg, true];
  }));
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 1)}\n`);
  renameSync(temp, path);
}

export function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export async function concurrentMap(list, concurrency, fn) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), list.length) }, async () => {
    while (cursor < list.length) {
      const index = cursor++;
      await fn(list[index], index);
    }
  });
  await Promise.all(workers);
}

export function clampInt(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : null;
}
