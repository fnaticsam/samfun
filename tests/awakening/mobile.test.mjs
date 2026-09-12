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
const figureIds = `home-01 home-02 s1-01 s1-02 s1-03
s2-01 s2-02 s2-03 s2-04 s2-05 s3-01 s3-02 s3-03
s4-01 s4-02 s4-03 s4-04 s4-05 s4-06 s5-01 s5-02 s5-03 s5-04
s6-01 s6-02 s6-03 s6-04 s7-01 s7-02 s7-03
s8-01 s8-02 s8-03 s8-04 s8-05 s9-01 s9-02 s9-03 s9-04
s10-01 s10-02 s10-03 s10-04 blueprint-01 field-01`.split(/\s+/);
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
  'parts/20-home.html': '1523113df217fb3d659fec8b95dea392616f41164dd564ab58ac906fcd34d3cf',
  'parts/31-s1.html': '941812775626d23ccb544490eae1716ff4729dc6edaf98d4d05866594592f7ae',
  'parts/32-s2.html': '33d80fbb9382285efd8be01894b48547894e894f845ac5e3b72db68345235b7d',
  'parts/10-shell-open.html': '87c0dcdfc3d7ace92226ac100d2f2cfd7fb08d8ca5242efa277148b9f5c3d141',
  'parts/90-shell-close.html': '27648f7cca9173eefd0e558023f8eeb2493fc87807b048714ea9819994d7c8d4',
  'parts/33-s3.html': '5bd893647871d10634f24de5a9a379414cfd2e55ead142d3535448b1b7138ae5',
  'parts/34-s4.html': 'ee3c8adc89d2437061203e107625f33e9b105f3b1d3db7f8a7a9f3f74a5b7c2c',
  'parts/35-s5.html': '37e23d916c95075e5b0361de31361e4931e71d03ed4d5cde7bafeea75fc5ea4f',
  'parts/36-s6.html': 'fb2a6d144e65b6b021c6eb45c038f78d503074810168604c6f64244caeefc4c0',
  'parts/37-s7.html': '8461bbff0b8798fee31bfcc1eac4800dd7c58ae3b1cc9eabd9a53f2bc5b54d3b',
  'parts/38-s8.html': '88883ced02df7aba1fe926986cedf971010f31d018d36bb6b2fe15ed34d47578',
  'parts/39-s9.html': '1e83202d193579e72411c703e09d21acd31596ab36a56c3c6232fbfaaa3dd57e',
  'parts/40-s10.html': '2d8f44b20a28edde0923b284a4f5d019c2c4310f33074a68947e0a89a9cff916',
  'parts/50-field.html': 'b1a8a93468af9c78c5e9a71c89d11d25dc2f7fc36ae6c2d266489d037724be0e',
  'parts/60-glossary.html': 'c6e86b97000e4be8fa2725c87acdaaad75ee6bc2149eeae7edabdf5c77c73035',
  'parts/70-traditions.html': '2b39a50cd0a1c938658965fc314d85cfdc450fca47ad15ec786aba654a6ceef8',
  'parts/80-analogies.html': '5d52a78a8d06771b700928b99bc160ec48a85c8156bb8231c128bcd35df92fbc',
  'parts/85-blueprint.html': 'a566bc9fd7c3b737146de29f67f921ef4361c0c8a7e2f44d74227a170f22f53a',
  'ills_a.py': '6b0b78151d567a4f18bcb54991baf1675736afa3a5db3ded83262e2fdb376e81',
  'ills_b.py': '1e8b15c100778d6837a0cff88876d6b2165d794035ed1e54777d12d8049f0e8f',
  'build.py': 'f17b696f4ca3dac91d41bdaeb4f38a1df2eab46f3cda83e25795a56406a97ec5',
  'styles.html': 'cc806aa9db5584e0e9029c4d981ca96be1b98b2be6e8ef3465d9be65171cf0f7'
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

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
  assert.equal((html.match(/<figure class="ill/g) || []).length, 45);
  const urls = [...html.matchAll(/(?:href|src)="(https?:\/\/[^" ]+)/g)].map((match) => match[1]);
  assert.ok(urls.every((url) => url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')));
  const mobile = html.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  for (const token of ['100dvh', 'safe-area-inset-top', 'touch-action']) assert.ok(mobile.includes(token));
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
  assert.deepEqual(sources, rasterFiles.map((file) => `img/${file}`));
  for (const [, figure] of figures) {
    const images = [...figure.matchAll(/<img\b([^>]+)>/g)];
    assert.equal(images.length, 1);
    const attrs = Object.fromEntries([...images[0][1].matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
    assert.ok(attrs.alt?.trim(), attrs.src);
    assert.match(attrs.width, /^\d+$/);
    assert.match(attrs.height, /^\d+$/);
    assert.deepEqual([Number(attrs.width), Number(attrs.height)], webpDimensions(attrs.src.slice(4)), attrs.src);
    assert.equal(attrs.loading, 'lazy');
  }
  assert.equal((html.match(/<figure class="ill/g) || []).length, 45);
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
