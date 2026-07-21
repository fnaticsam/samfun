// Vroom image pipeline v2 — Wikipedia/Commons page-image per model-generation.
// Batched (50 titles/request) to stay well inside API limits. Resumable cache.
// Usage: node scripts/vroom/03-images.mjs [--force] [--retry-missing]
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalogue } from './05-validate.mjs';
import { slug } from './lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const STATE = join(DIR, 'state');
const OUT = join(STATE, 'images.json');
const OVERRIDES = join(DIR, 'image-overrides.json');
mkdirSync(STATE, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));

const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'sam.toys-vroom/1.0 (car picker toy; hello@sam.toys)';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function canonicalFileKey(title) {
  return String(title || '')
    .normalize('NFKC')
    .replace(/^(?:file|image):/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

export function commonsFilePage(title) {
  const name = String(title || '').replace(/^(?:file|image):/i, '').replace(/ /g, '_');
  return name ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name).replace(/%2F/gi, '/')}` : null;
}

function writeJsonAtomic(path, value) {
  const temp = `${path}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 1)}\n`);
  renameSync(temp, path);
}

function wikipediaTitleFromUrl(value) {
  try {
    const url = new URL(value);
    if (!/^(?:[a-z-]+\.)?(?:wikipedia|wikimedia)\.org$/i.test(url.hostname)) return null;
    const match = url.pathname.match(/^\/wiki\/(.+)$/);
    return match ? decodeURIComponent(match[1]).replace(/_/g, ' ') : null;
  } catch { return null; }
}

// Overrides accept an article title, a File: title, a Wikipedia page URL, a direct
// image URL, or an object: { title } / { file } / { src, w, h, page, credit, license }.
export function normalizeOverride(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    if (raw.src) return { kind: 'direct', image: {
      src: String(raw.src), w: Number(raw.w) || null, h: Number(raw.h) || null,
      file: raw.file || null, page: raw.page || (raw.file ? commonsFilePage(raw.file) : null),
      credit: raw.credit || null, license: raw.license || null, via: 'override-direct'
    } };
    if (raw.file) return { kind: 'file', value: String(raw.file).replace(/^(?!File:)/i, 'File:') };
    if (raw.title) return { kind: 'title', value: String(raw.title) };
    throw new Error(`Unsupported image override object: ${JSON.stringify(raw)}`);
  }
  if (typeof raw !== 'string') throw new Error(`Unsupported image override: ${JSON.stringify(raw)}`);
  const value = raw.trim();
  if (/^(?:file|image):/i.test(value)) return { kind: 'file', value: value.replace(/^(?:file|image):/i, 'File:') };
  const wikiTitle = /^https?:\/\//i.test(value) ? wikipediaTitleFromUrl(value) : null;
  if (wikiTitle) return /^(?:file|image):/i.test(wikiTitle)
    ? { kind: 'file', value: wikiTitle.replace(/^(?:file|image):/i, 'File:') }
    : { kind: 'title', value: wikiTitle };
  if (/^https?:\/\//i.test(value)) return { kind: 'direct', image: {
    src: value, w: null, h: null, file: null, page: value, credit: null, license: null, via: 'override-direct'
  } };
  return { kind: 'title', value };
}

async function api(params, tries = 4) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', maxlag: '5', ...params })}`;
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (!res) { await sleep(1000 * (i + 1)); continue; }
    if (res.status === 429 || res.status >= 500) { await sleep(1500 * (i + 1)); continue; }
    const d = await res.json().catch(() => null);
    if (!d) { await sleep(1000 * (i + 1)); continue; }
    if (d.error) { // maxlag / ratelimited etc — back off and retry
      await sleep(2000 * (i + 1));
      continue;
    }
    return d;
  }
  throw new Error('api: retries exhausted');
}

function candidates(c) {
  const out = [];
  const makes = [c.make];
  if (c.make === 'Vauxhall') makes.push('Opel');
  if (c.make === 'MINI') makes.push('Mini');
  if (c.make === 'Skoda') makes.push('Škoda');
  if (c.make === 'Citroen') makes.push('Citroën');
  for (const mk of makes) {
    const base = `${mk} ${c.model}`;
    out.push(`${base} (${c.gen})`);
    if (c.genName) out.push(`${base} (${c.genName})`);
    if (/^Mk\d/i.test(c.gen)) out.push(`${base} ${c.gen}`);
    out.push(base);
  }
  // model names with slashes ("X1 / iX1") — also try each side
  if (c.model.includes('/')) {
    for (const part of c.model.split('/').map(s => s.trim())) {
      out.push(`${c.make} ${part} (${c.gen})`, `${c.make} ${part}`);
    }
  }
  return [...new Set(out)];
}

// Batch-fetch page images for a set of titles → Map(canonicalisedInputTitle → img)
async function batchPageImages(titles) {
  const map = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const d = await api({
      action: 'query', titles: chunk.join('|'), redirects: '1',
      prop: 'pageimages|info', piprop: 'thumbnail|name', pithumbsize: '1000', inprop: 'url'
    });
    const q = d.query || {};
    // map input title -> final title through normalization + redirects
    const trace = new Map(chunk.map(t => [t, t]));
    for (const n of q.normalized || []) for (const [k, v] of trace) if (v === n.from) trace.set(k, n.to);
    for (const r of q.redirects || []) for (const [k, v] of trace) if (v === r.from) trace.set(k, r.to);
    const byTitle = new Map((q.pages || []).map(p => [p.title, p]));
    for (const [input, finalTitle] of trace) {
      const p = byTitle.get(finalTitle);
      if (p && !p.missing && p.thumbnail) {
        map.set(input, {
          src: p.thumbnail.source, w: p.thumbnail.width, h: p.thumbnail.height,
          file: p.pageimage ? `File:${p.pageimage}` : null, page: p.fullurl || null, title: p.title
        });
      }
    }
    await sleep(300);
  }
  return map;
}

// Batch attribution for File: titles → Map(file → {credit,license})
async function batchAttribution(files) {
  const map = new Map();
  const uniq = [...new Map(files.filter(Boolean).map(file => [canonicalFileKey(file), file])).values()];
  const strip = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const d = await api({
      action: 'query', titles: chunk.join('|'), prop: 'imageinfo',
      iiprop: 'extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName'
    });
    for (const p of d.query?.pages || []) {
      const meta = p.imageinfo?.[0]?.extmetadata || {};
      map.set(canonicalFileKey(p.title), {
        credit: strip(meta.Artist?.value) || null,
        license: strip(meta.LicenseShortName?.value) || null
      });
    }
    await sleep(300);
  }
  return map;
}

// Search fallback for stragglers: one search per car, then batch the found titles.
async function searchTitles(c) {
  const d = await api({
    action: 'query', list: 'search', srlimit: '4', srnamespace: '0',
    srsearch: `${c.make} ${c.model} ${c.gen}`
  });
  return (d.query?.search || []).map(s => s.title)
    .filter(t => t.toLowerCase().includes(c.model.split(' ')[0].toLowerCase().slice(0, 4)) || t.toLowerCase().includes(c.make.toLowerCase()));
}

async function main() {
  const carsRaw = await loadCatalogue();
  const cars = carsRaw.map(c => ({ ...c, id: slug(c.make, c.model, c.gen) }));
  const prev = existsSync(OUT) && !args.force ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
  const normalizedOverrides = Object.fromEntries(Object.entries(overrides).map(([id, value]) => [id, normalizeOverride(value)]));
  const todo = cars.filter(c => !(c.id in prev) || (prev[c.id] == null && args['retry-missing']) || overrides[c.id]);
  console.log(`images v2: ${cars.length} cars, ${Object.keys(prev).length} cached, ${todo.length} to resolve`);

  // 1) overrides first (article-title overrides only here; File: overrides below)
  const titleWants = new Map(); // car.id -> [titles best-first]
  for (const c of todo) {
    const override = normalizedOverrides[c.id];
    titleWants.set(c.id, override?.kind === 'title' ? [override.value, ...candidates(c)] : candidates(c));
  }

  // 2) batch-resolve all candidate titles
  const allTitles = [...new Set([...titleWants.values()].flat())];
  console.log(`  batch querying ${allTitles.length} candidate titles…`);
  const imgByTitle = await batchPageImages(allTitles);

  const chosen = new Map(); // id -> img
  for (const c of todo) {
    const override = normalizedOverrides[c.id];
    if (override?.kind === 'direct') { chosen.set(c.id, override.image); continue; }
    for (const t of titleWants.get(c.id)) {
      const img = imgByTitle.get(t);
      if (img) { chosen.set(c.id, { ...img, via: t }); break; }
    }
  }

  // 3) File: overrides (rare) — direct thumb via imageinfo
  for (const c of todo) {
    const override = normalizedOverrides[c.id];
    if (override?.kind === 'file') {
      const d = await api({ action: 'query', titles: override.value, prop: 'imageinfo|info', iiprop: 'url', iiurlwidth: '1000', inprop: 'url' });
      const page = d.query?.pages?.[0];
      const ii = page?.imageinfo?.[0];
      if (ii?.thumburl || ii?.url) {
        const file = page?.title || override.value;
        chosen.set(c.id, {
          src: ii.thumburl || ii.url, w: ii.thumbwidth || ii.width, h: ii.thumbheight || ii.height,
          file, page: commonsFilePage(file), via: 'override-file'
        });
      }
      await sleep(200);
    }
  }

  // 4) search fallback for still-missing
  const still = todo.filter(c => !chosen.has(c.id));
  console.log(`  search fallback for ${still.length} cars…`);
  const searchFound = new Map(); // id -> [titles]
  for (const c of still) {
    try { searchFound.set(c.id, await searchTitles(c)); } catch { searchFound.set(c.id, []); }
    await sleep(250);
  }
  const searchTitlesAll = [...new Set([...searchFound.values()].flat())].filter(t => !imgByTitle.has(t));
  const imgByTitle2 = await batchPageImages(searchTitlesAll);
  for (const c of still) {
    for (const t of searchFound.get(c.id) || []) {
      const img = imgByTitle.get(t) || imgByTitle2.get(t);
      if (img) { chosen.set(c.id, { ...img, via: `search:${t}` }); break; }
    }
  }

  // 5) attribution for new images and cached records missing it. Canonical file
  // keys avoid the MediaWiki underscore/space normalization bug.
  const attributionTargets = [
    ...chosen.values(),
    ...Object.values(prev).filter(img => img?.file && (!img.credit || !img.license))
  ];
  const att = await batchAttribution(attributionTargets.map(i => i.file));
  for (const [id, img] of chosen) {
    const a = img.file ? att.get(canonicalFileKey(img.file)) || {} : {};
    prev[id] = { ...img, ...a };
  }
  for (const [id, img] of Object.entries(prev)) {
    if (!img?.file || (img.credit && img.license)) continue;
    const a = att.get(canonicalFileKey(img.file));
    if (a) prev[id] = { ...img, ...a };
  }
  for (const c of todo) if (!chosen.has(c.id)) prev[c.id] = null;

  const ordered = Object.fromEntries(Object.entries(prev).sort(([a], [b]) => a.localeCompare(b)));
  writeJsonAtomic(OUT, ordered);
  const missing = cars.filter(c => !prev[c.id]).map(c => c.id);
  writeJsonAtomic(join(STATE, 'missing-images.json'), missing);
  const cov = ((cars.length - missing.length) / cars.length * 100).toFixed(1);
  console.log(`\nimages done: ${cars.length - missing.length}/${cars.length} (${cov}%) — missing → state/missing-images.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
