// Vroom image pipeline — Wikipedia/Commons page-image per model-generation.
// No API key needed. Resumable: state/images.json is a cache keyed by car id.
// Usage: node scripts/vroom/03-images.mjs [--force] [--concurrency=8]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalogue } from './05-validate.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const STATE = join(DIR, 'state');
const OUT = join(STATE, 'images.json');
const OVERRIDES = join(DIR, 'image-overrides.json');
mkdirSync(STATE, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const CONC = Number(args.concurrency || 8);
const API = 'https://en.wikipedia.org/w/api.php';
const UA = 'sam.toys-vroom/1.0 (car picker toy; contact via sam.toys)';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function api(params, tries = 3) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429 || res.status >= 500) { await sleep(1200 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i === tries - 1) throw e; await sleep(800 * (i + 1)); }
  }
}

// Candidate Wikipedia article titles for a car, best-first.
function candidates(c) {
  const out = [];
  const makes = [c.make];
  if (c.make === 'Vauxhall') makes.push('Opel'); // Wikipedia canonicalises many as Opel
  if (c.make === 'MINI') makes.push('Mini');
  for (const mk of makes) {
    const base = `${mk} ${c.model}`;
    out.push(`${base} (${c.gen})`);
    if (c.genName) out.push(`${base} (${c.genName})`);
    // common generation-name styles: "Mk7", "Mark VII", codes
    if (/^Mk\d/i.test(c.gen)) out.push(`${base} ${c.gen}`);
    out.push(base);
  }
  return [...new Set(out)];
}

async function pageImage(title) {
  const d = await api({
    action: 'query', titles: title, redirects: '1',
    prop: 'pageimages|info', piprop: 'thumbnail|name', pithumbsize: '1000', inprop: 'url'
  });
  const p = d?.query?.pages?.[0];
  if (!p || p.missing || !p.thumbnail) return null;
  return {
    src: p.thumbnail.source, w: p.thumbnail.width, h: p.thumbnail.height,
    file: p.pageimage ? `File:${p.pageimage}` : null, page: p.fullurl || null, title: p.title
  };
}

async function attribution(file) {
  if (!file) return {};
  const d = await api({
    action: 'query', titles: file, prop: 'imageinfo',
    iiprop: 'extmetadata|url', iiextmetadatafilter: 'Artist|LicenseShortName|Credit'
  });
  const info = d?.query?.pages?.[0]?.imageinfo?.[0];
  const meta = info?.extmetadata || {};
  const strip = (h) => (h || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  return {
    credit: strip(meta.Artist?.value) || null,
    license: strip(meta.LicenseShortName?.value) || null,
    descUrl: info?.descriptionurl || null
  };
}

async function resolve(c, overrides) {
  const id = c.id;
  if (overrides[id]) {
    // override = explicit article title or Commons file name
    const o = overrides[id];
    if (o.startsWith('File:')) {
      const at = await attribution(o);
      const d = await api({ action: 'query', titles: o, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '1000' });
      const ii = d?.query?.pages?.[0]?.imageinfo?.[0];
      if (ii?.thumburl) return { src: ii.thumburl, w: ii.thumbwidth, h: ii.thumbheight, page: at.descUrl, ...at, via: 'override' };
    } else {
      const img = await pageImage(o);
      if (img) { const at = await attribution(img.file); return { ...img, ...at, via: 'override' }; }
    }
  }
  for (const t of candidates(c)) {
    const img = await pageImage(t);
    if (img) {
      const at = await attribution(img.file);
      return { ...img, ...at, via: t };
    }
  }
  return null;
}

async function main() {
  const carsRaw = await loadCatalogue();
  const { slug } = await import('./lib/vocab.mjs');
  const cars = carsRaw.map(c => ({ ...c, id: slug(c.make, c.model, c.gen) }));
  const prev = existsSync(OUT) && !args.force ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
  const todo = cars.filter(c => !(c.id in prev) || (args.force && overrides[c.id]));
  console.log(`images: ${cars.length} cars, ${Object.keys(prev).length} cached, ${todo.length} to fetch`);

  let done = 0, found = 0;
  const queue = [...todo];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      try {
        const img = await resolve(c, overrides);
        prev[c.id] = img; // null = tried and missing (cached too)
        if (img) found++;
      } catch (e) {
        console.error(`  ! ${c.id}: ${e.message}`);
        prev[c.id] = null;
      }
      if (++done % 25 === 0) {
        writeFileSync(OUT, JSON.stringify(prev, null, 1));
        console.log(`  …${done}/${todo.length} (${found} found)`);
      }
      await sleep(120); // politeness
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  writeFileSync(OUT, JSON.stringify(prev, null, 1));

  const missing = cars.filter(c => !prev[c.id]).map(c => c.id);
  writeFileSync(join(STATE, 'missing-images.json'), JSON.stringify(missing, null, 1));
  const cov = ((cars.length - missing.length) / cars.length * 100).toFixed(1);
  console.log(`\nimages done: ${cars.length - missing.length}/${cars.length} (${cov}%) — missing list in state/missing-images.json`);
}

main();
