import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const awakening = join(root, 'awakening');
const html = readFileSync(join(awakening, 'index.html'), 'utf8');
const headSource = readFileSync(join(awakening, 'parts', '00-head.html'), 'utf8');
const shellSource = readFileSync(join(awakening, 'parts', '10-shell-open.html'), 'utf8');
const figureIds = `home-01 home-02 s1-01 s1-02 s1-03 s2-01 s2-02 s2-03 s2-04
s2-05 s3-01 s3-02 s3-03 s4-01 s4-02 s4-03 s4-04 s4-05
s4-06 s5-01 s5-02 s5-03 s5-04 s2-06 s6-01 s6-02 s6-03
s6-04 s6-05 s7-01 s7-02 s7-03 s7-04 s8-01 s8-02 s8-03
s8-04 s8-05 s9-01 s9-02 s9-03 s9-04 s9-05 s10-01 s10-02
s10-03 s10-04 s10-05 blueprint-01 field-01`.split(/\s+/);
const webpFiles = readdirSync(join(awakening, 'img')).filter((file) => file.endsWith('.webp')).sort();
const rasterFiles = webpFiles.filter((file) => figureIds.includes(file.slice(0, -5)));

function webpDimensions(file) {
  const data = readFileSync(join(awakening, 'img', file));
  assert.equal(data.toString('ascii', 0, 4), 'RIFF', file);
  assert.equal(data.toString('ascii', 8, 12), 'WEBP', file);
  switch (data.toString('ascii', 12, 16)) {
    case 'VP8 ':
      assert.equal(data.subarray(23, 26).toString('hex'), '9d012a', file);
      return [data.readUInt16LE(26) & 0x3fff, data.readUInt16LE(28) & 0x3fff];
    case 'VP8L': {
      assert.equal(data[20], 0x2f, file);
      const bits = data.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    case 'VP8X':
      return [data.readUIntLE(24, 3) + 1, data.readUIntLE(27, 3) + 1];
    default: assert.fail(`Unsupported WebP header: ${file}`);
  }
}
const frozen = {
  'parts/00-head.html': '36da7a33e341e9eb70efcbcdaba4ea266eaf961bca93ed3b408ed9a3a78c208a',
  'parts/20-home.html': '1523113df217fb3d659fec8b95dea392616f41164dd564ab58ac906fcd34d3cf',
  'parts/31-s1.html': '941812775626d23ccb544490eae1716ff4729dc6edaf98d4d05866594592f7ae',
  'parts/32-s2.html': 'c003e930c04fdd03569d625b2a433c57b3da6df32a28f9953fb63eb7a5208df2',
  'parts/10-shell-open.html': '5dda67f542700d1ab5f25d4ee0c4cf0a56aff0b41d2aaa55b6f53e6b1b467521',
  'parts/90-shell-close.html': '27648f7cca9173eefd0e558023f8eeb2493fc87807b048714ea9819994d7c8d4',
  'parts/33-s3.html': '5bd893647871d10634f24de5a9a379414cfd2e55ead142d3535448b1b7138ae5',
  'parts/34-s4.html': 'ee3c8adc89d2437061203e107625f33e9b105f3b1d3db7f8a7a9f3f74a5b7c2c',
  'parts/35-s5.html': '37e23d916c95075e5b0361de31361e4931e71d03ed4d5cde7bafeea75fc5ea4f',
  'parts/36-s6.html': '0df0fb7c513fb6e871387023f5c15506425bf2375b8495d5f9c26321a6ca7c1f',
  'parts/37-s7.html': '998ce6c8cf99d89fcf33569ed3edfa08bf5aa489f618fba11436c32128ae2c36',
  'parts/38-s8.html': '88883ced02df7aba1fe926986cedf971010f31d018d36bb6b2fe15ed34d47578',
  'parts/39-s9.html': 'ed19a784877c90e32f6b155f79bcf8d8ea6c5308e0e220119bfde84a7218ea3b',
  'parts/40-s10.html': 'f5953a0e3574b72e29a7d25ca7cdcd535a1d1a632cb3f7cfd00cd6c49305309c',
  'parts/50-field.html': '27d6db07ae761847dd1e14f5d137d1eec285be0e3259b1ea5879cc0bb8dd2c95',
  'parts/60-glossary.html': '449111d7570702d8efcff0606236a4f2eebcbb14cfda40a9b2a6dd8a21f69fe3',
  'parts/70-traditions.html': '9ad5358791cd9de421c5ccf49509ae85b42c5d8e508f315da71ab55f86b71901',
  'parts/80-analogies.html': '12c591337c58116811d7c8b7224608db51f630c458b38db871a6970d653c9b64',
  'parts/85-blueprint.html': 'a566bc9fd7c3b737146de29f67f921ef4361c0c8a7e2f44d74227a170f22f53a',
  'ills_a.py': '6b0b78151d567a4f18bcb54991baf1675736afa3a5db3ded83262e2fdb376e81',
  'ills_b.py': '571d29c8dfb70dfd2e3b42bd8d81044de4aac28a98657caede9c9036da684883',
  'build.py': '2284f29e2ebc30f25892f7f82e3b71276a64c206b00ad7dccc904a482bfc957a',
  'styles.html': 'cc806aa9db5584e0e9029c4d981ca96be1b98b2be6e8ef3465d9be65171cf0f7'
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function pngDimensions(file) {
  const data = readFileSync(join(awakening, 'img', file));
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file);
  assert.equal(data.toString('ascii', 12, 16), 'IHDR', file);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

test('document metadata and generated structure are mobile-safe', () => {
  assert.match(html, /^<!DOCTYPE html>\s*<html lang="en">/);
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] || '';
  assert.match(head, /^\s*<meta charset="utf-8">/);
  assert.match(head, /<meta name="viewport" content="[^"]*width=device-width[^"]*viewport-fit=cover[^"]*">/);
  assert.match(head, /<meta name="robots" content="noindex, nofollow">/);
  assert.equal((head.match(/<meta name="theme-color"/g) || []).length, 2);
  assert.match(head, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<\/body><\/html>\s*$/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/<figure class="ill/g) || []).length, 50);
  const urls = [...html.matchAll(/(?:href|src)="(https?:\/\/[^" ]+)/g)].map((match) => match[1]);
  assert.ok(urls.every((url) => url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')));
  const mobile = html.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  for (const token of ['100dvh', 'safe-area-inset-top', 'touch-action']) assert.ok(mobile.includes(token));
});

test('logo metadata, marks, and rendered icon dimensions are present', () => {
  assert.match(headSource, /<link rel="apple-touch-icon" href="\/awakening\/img\/icon-180\.png">/);
  assert.match(headSource, /<link rel="icon" type="image\/png" sizes="32x32" href="\/awakening\/img\/favicon-32\.png">/);
  assert.match(headSource, /<meta property="og:image" content="https:\/\/sam\.toys\/awakening\/img\/social-1200x630\.png">/);
  assert.match(headSource, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.equal((shellSource.match(/<a class="brand"[\s\S]*?<\/a>/)?.[0].match(/<svg class="mark"/g) || []).length, 1);
  assert.equal((shellSource.match(/<div class="topbar">[\s\S]*?<\/div>/)?.[0].match(/<svg class="mark"/g) || []).length, 1);
  const expected = { 'icon-180.png': [180, 180], 'icon-192.png': [192, 192], 'icon-512.png': [512, 512], 'favicon-32.png': [32, 32], 'social-1200x630.png': [1200, 630] };
  for (const [file, dimensions] of Object.entries(expected)) assert.deepEqual(pngDimensions(file), dimensions, file);
});

test('landing page presents the central teaching, tradition map, and river CTA', () => {
  assert.match(html, /<h1>Die before you die\.<\/h1>/);
  for (const term of ['FANA', 'KENSHO', 'MOKSHA', 'RIGPA', 'THEOSIS', 'BITTUL', 'HENOSIS']) assert.match(html, new RegExp(term));
  const labels = ['Islam · Sufism', 'Hinduism · Advaita Vedanta', 'Hinduism · Kashmir Shaivism', 'Buddhism', 'Buddhism · Zen / Chan', 'Dzogchen · Tibetan Buddhism &amp; Bön', 'Taoism', 'Christian mysticism', 'Jewish mysticism', 'Sikhism', 'Jainism', 'Neoplatonism · Plotinus'];
  const cards = [...html.matchAll(/<article class="trad-card">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
  assert.equal(cards.length, 12);
  assert.deepEqual(cards.map((card) => card.match(/<span>(.*?)<\/span>/)?.[1]), labels);
  assert.match(html, /Shared patterns of realization, expressed through different understandings of self, reality, and the divine\./);
  assert.match(html, /<a class="cta" id="cta-begin" href="#s1">Step into the river<\/a>/);
  assert.match(html, /<h2>Are you ready to step into the river\?<\/h2>/);
});

test('raster image CSS constrains intrinsic widths on phones', () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selector]) => /figure\.ill(?:\.wide)?\.photo\s+img\b/.test(selector));
  assert.ok(rules.length > 0);
  for (const [, , declarations] of rules) {
    assert.doesNotMatch(declarations, /max-width\s*:\s*none\b/);
  }
  assert.match(css, /figure\.ill\.photo img\s*\{[^}]*max-width:\s*min\(100%, 540px\);[^}]*min-width:\s*0;/);
  assert.match(css, /figure\.ill\.wide\.photo img\s*\{[^}]*max-width:\s*min\(100%, 760px\);/);
  const mobile = css.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.match(mobile, /figure\.ill\.photo img, figure\.ill\.wide\.photo img\s*\{\s*max-width:\s*100%;/);
});

test('available raster illustrations preserve figure semantics and dimensions', () => {
  const figures = [...html.matchAll(/<figure class="ill(?: wide)? photo">([\s\S]*?)<\/figure>/g)];
  assert.deepEqual(webpFiles, rasterFiles, 'every WebP matches a canonical figure ID (no orphans)');
  assert.equal(figures.length, rasterFiles.length);
  const sources = figures.map((figure) => figure[1].match(/<img src="([^"]+)"/)?.[1]).sort();
  assert.deepEqual(sources, rasterFiles.map((file) => `/awakening/img/${file}`));
  for (const [, figure] of figures) {
    const images = [...figure.matchAll(/<img\b([^>]+)>/g)];
    assert.equal(images.length, 1);
    const attrs = Object.fromEntries([...images[0][1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    assert.ok(attrs.alt?.trim(), attrs.src);
    assert.match(attrs.width, /^\d+$/);
    assert.match(attrs.height, /^\d+$/);
    assert.deepEqual([Number(attrs.width), Number(attrs.height)], webpDimensions(attrs.src.replace(/^\/awakening\/img\//, '')), attrs.src);
    assert.equal(attrs.loading, 'lazy');
  }
  assert.equal((html.match(/<figure class="ill/g) || []).length, 50);
});

test('illustrations without raster files retain their original inline SVG figures', (t) => {
  const result = spawnSync('python3', ['-c',
    'import json, ills_a, ills_b; print(json.dumps([[svg, caption, wide] for _, _, svg, caption, wide in ills_a.ILLS]))'
  ], { cwd: awakening, encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') {
    t.skip('python3 is unavailable');
    return;
  }
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const originals = JSON.parse(result.stdout);
  assert.equal(originals.length, figureIds.length);
  const missing = figureIds.filter((id) => !rasterFiles.includes(`${id}.webp`));
  const inline = [...html.matchAll(/<figure class="ill(?: wide)?">([\s\S]*?)<\/figure>/g)];
  assert.equal(inline.length, missing.length);
  for (const id of missing) {
    const [svg, caption] = originals[figureIds.indexOf(id)];
    const matches = inline.filter(([, body]) => body.includes(`<figcaption>${caption}</figcaption>`));
    assert.equal(matches.length, 1, id);
    assert.equal(matches[0][1].match(/<svg\b[\s\S]*<\/svg>/)?.[0], svg.trim(), id);
    assert.doesNotMatch(matches[0][1], /<img\b/);
  }
});

test('raster IDs follow the canonical illustration order', (t) => {
  const result = spawnSync('python3', ['build.py', '--list-ids'], { cwd: awakening, encoding: 'utf8' });
  if (result.error?.code === 'ENOENT') {
    t.skip('python3 is unavailable');
    return;
  }
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(result.stdout.trim().split('\n'), figureIds);
});

test('frozen source inputs retain their recorded sha256 bytes', () => {
  for (const [file, expected] of Object.entries(frozen)) {
    assert.equal(sha256(readFileSync(join(awakening, file))), expected, file);
  }
});

test('drawer navigation transfers focus and dismissals restore Menu focus', () => {
  function setup(missingRail = false) {
    const document = { activeElement: null, events: {}, addEventListener(k, fn) { this.events[k] = fn; } };
    const element = () => {
      const classes = new Set();
      return {
        attrs: {}, events: {}, textContent: 'Heading',
        classList: { add: (k) => classes.add(k), remove: (k) => classes.delete(k), contains: (k) => classes.has(k) },
        setAttribute(k, v) { this.attrs[k] = v; },
        getAttribute(k) { return this.attrs[k]; },
        hasAttribute(k) { return k in this.attrs; },
        addEventListener(k, fn) { this.events[k] = fn; },
        focus(options) { document.activeElement = this; this.focusOptions = options; },
        closest() { return this; }
      };
    };
    const rail = element(), menu = element(), scrim = element(), link = element();
    const headings = { home: element(), s1: element() };
    rail.contains = (el) => el === link;
    rail.querySelector = () => link;
    document.documentElement = element();
    document.getElementById = (id) => ({ rail: missingRail ? null : rail, scrim, 'menu-btn': menu })[id];
    document.querySelectorAll = () => [];
    document.querySelector = (selector) => headings[selector.match(/^#v-(\w+) h1$/)?.[1]];
    const location = { hash: '#home' };
    const window = { events: {}, addEventListener(k, fn) { this.events[k] = fn; }, scrollTo() {
      assert.equal(rail.classList.contains('open'), false, 'drawer closes before scrolling');
    } };
    runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
      document, window, location, localStorage: { getItem: () => null }
    });
    return { document, window, location, rail, menu, scrim, link, headings };
  }
  const s = setup();
  assert.equal(s.document.activeElement, null, 'initial route leaves focus alone');
  s.menu.events.click();
  assert.equal(s.document.activeElement, s.link);
  s.link.setAttribute('href', '#s1');
  s.rail.events.click({ target: s.link });
  s.location.hash = '#s1';
  s.window.events.hashchange();
  assert.equal(s.document.activeElement, s.headings.s1);
  assert.equal(s.headings.s1.attrs.tabindex, '-1');
  assert.equal(s.headings.s1.focusOptions.preventScroll, true);
  assert.equal(s.menu.attrs['aria-expanded'], 'false');
  s.menu.events.click();
  s.rail.events.click({ target: s.link });
  assert.equal(s.document.activeElement, s.headings.s1, 'same-hash tap also transfers focus');
  for (const dismiss of [() => s.document.events.keydown({ key: 'Escape' }),
    () => s.scrim.events.click(), () => s.menu.events.click()]) {
    s.menu.events.click();
    dismiss();
    assert.equal(s.document.activeElement, s.menu);
    assert.equal(s.document.documentElement.classList.contains('rail-open'), false);
  }
  s.window.events.hashchange();
  assert.equal(s.document.activeElement, s.menu, 'unrelated route leaves focus alone');
  s.link.focus();
  s.window.events.hashchange();
  assert.equal(s.document.activeElement, s.headings.s1, 'focus inside a closed rail is rescued');
  assert.doesNotThrow(() => setup(true).menu.events.click?.());
});

test('build reproduces the checked-in generated page', (t) => {
  const temp = mkdtempSync(join(tmpdir(), 'awakening-build-'));
  try {
    const copy = join(temp, 'awakening');
    cpSync(awakening, copy, { recursive: true });
    for (const file of webpFiles) {
      assert.deepEqual(readFileSync(join(copy, 'img', file)), readFileSync(join(awakening, 'img', file)), file);
    }
    const result = spawnSync('python3', ['build.py'], { cwd: copy, encoding: 'utf8' });
    if (result.error?.code === 'ENOENT') {
      t.skip('python3 is unavailable');
      return;
    }
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(readFileSync(join(copy, 'index.html')), readFileSync(join(awakening, 'index.html')));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
