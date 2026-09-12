import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const awakening = join(root, 'awakening');
const html = readFileSync(join(awakening, 'index.html'), 'utf8');
const frozen = {
  'parts/20-home.html': '0b96415005d9c973c86f7387b75669d74904a816a306c771b3209399902d35e7',
  'parts/31-s1.html': '941812775626d23ccb544490eae1716ff4729dc6edaf98d4d05866594592f7ae',
  'parts/32-s2.html': '33d80fbb9382285efd8be01894b48547894e894f845ac5e3b72db68345235b7d',
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
  'ills_a.py': '56f1860966a82b7e73e5673db51554ced8ec26861d622214372b13a083e8eaa9',
  'ills_b.py': '1e8b15c100778d6837a0cff88876d6b2165d794035ed1e54777d12d8049f0e8f',
  'build.py': '7bf299d77ea54d4637e4a02f36ed15e4baf2d33c1345ed6a3c8c54e184f0f9cb',
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
  assert.equal((html.match(/<figure class="ill/g) || []).length, 44);
  const urls = [...html.matchAll(/(?:href|src)="(https?:\/\/[^" ]+)/g)].map((match) => match[1]);
  assert.ok(urls.every((url) => url.startsWith('https://fonts.googleapis.com') || url.startsWith('https://fonts.gstatic.com')));
  const mobile = html.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  for (const token of ['100dvh', 'safe-area-inset-top', 'touch-action']) assert.ok(mobile.includes(token));
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
