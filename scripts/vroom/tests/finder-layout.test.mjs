import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../../vroom/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../../vroom/static/js/app.mjs', import.meta.url), 'utf8');

test('the finder consolidates search, body shapes, menus and sliders before results', () => {
  const finder = html.indexOf('<section class="finder-shell"');
  const search = html.indexOf('id="search-input"');
  const bodies = html.indexOf('class="body-shape-picker"');
  const menus = html.indexOf('id="filter-menu-root"');
  const sliders = html.indexOf('id="slider-deck"');
  const results = html.indexOf('id="results"');

  assert.ok(finder >= 0);
  assert.ok(finder < search && search < bodies && bodies < menus && menus < sliders && sliders < results);
  assert.equal((html.match(/id="search-input"/g) || []).length, 1);
  assert.equal((html.match(/id="filter-menu-root"/g) || []).length, 1);
  assert.equal((html.match(/id="slider-deck"/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('all catalogue body shapes are always-visible labelled toggle buttons', () => {
  const matches = [...html.matchAll(/<button class="body-shape-option"[^>]*data-filter="body"[^>]*data-value="([^"]+)"[^>]*aria-pressed="false"[^>]*>([\s\S]*?)<\/button>/g)];
  assert.deepEqual(matches.map(match => match[1]), [
    'hatch', 'saloon', 'estate', 'suv', 'coupe', 'convertible', 'mpv', 'van', 'pickup',
  ]);
  for (const [, value, content] of matches) {
    assert.match(content, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
    assert.match(content, /<span>[^<]+<\/span>/, `${value} needs a visible label`);
  }
  assert.match(html, /<fieldset class="body-shape-picker"[^>]*>[\s\S]*?<legend>Body shape<\/legend>/);
  assert.match(html, /data-action="clear-bodies">Any body<\/button>/);
});

test('body is removed from the compact menus and Any body clears only body state', () => {
  assert.match(app, /groups: FILTER_MENU_GROUPS\.filter\(group => group\.id !== 'body'\)/);
  assert.match(app, /if \(action === 'clear-bodies'\) \{\s*filters\.bodies = \[\];\s*render\(\);/);
});
