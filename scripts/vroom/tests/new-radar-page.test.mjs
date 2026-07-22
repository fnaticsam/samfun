import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  editorialStats, filterEditorialItems, flattenEditorialItems, radarCardMarkup,
  radarResultsMarkup, sortEditorialItems,
} from '../../../vroom/static/js/new-cars.mjs';

const home = readFileSync(new URL('../../../vroom/index.html', import.meta.url), 'utf8');
const page = readFileSync(new URL('../../../vroom/new/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../../../vroom/data/editorial.json', import.meta.url), 'utf8'));

test('new-car radar is a dedicated static page and the finder links to it', () => {
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.match(page, /href="\/vroom\/"[^>]*>Used-car finder/);
  assert.match(page, /href="\/vroom\/data\/editorial\.json"/);
  assert.match(page, /src="\/vroom\/static\/js\/new-cars\.mjs"/);
  assert.match(page, /id="radar-announcer"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(page, /<noscript><style>\.radar-js-only/);
  assert.match(page, /href="\/vroom\/static\/css\/radar\.css"/);
  assert.doesNotMatch(page, /cars\.json|results-grid|search-input|app\.mjs/);
  assert.match(home, /<a class="filter-bar__link" href="\/vroom\/new\/">New &amp; exciting/);
  assert.doesNotMatch(home, /id="editorial-hub"|data-action="scroll-editorial"|editorial\.json/);
});

test('radar canonicalizes records and provides useful filters and deterministic sorts', () => {
  const { items } = flattenEditorialItems(data);
  assert.equal(items.length, 21);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(filterEditorialItems(items, 'on-sale').length, 19);
  assert.equal(filterEditorialItems(items, 'coming').length, 2);
  assert.ok(filterEditorialItems(items, 'under-30').every(item => item.price.currency === 'GBP' && item.price.amount < 30000));
  assert.ok(filterEditorialItems(items, 'ev').every(item => item.powertrain === 'ev'));
  assert.ok(filterEditorialItems(items, 'hybrid').every(item => ['hybrid', 'phev', 'range-extender'].includes(item.powertrain)));
  const priceSorted = sortEditorialItems(items, 'price');
  assert.equal(priceSorted[0].price.currency, 'GBP');
  assert.equal(priceSorted.findIndex(item => item.price.currency === 'EUR'), 19);
  assert.equal(priceSorted.at(-1).price.amount, null);
  assert.equal(sortEditorialItems(items, 'brand')[0].make, 'BYD');
  assert.equal(editorialStats(data).entryPrice, '£21,975');
});

test('dedicated cards expose status, market, structured facts, freshness and official source', () => {
  const item = flattenEditorialItems(data).items.find(entry => entry.id === 'leapmotor-b10-hybrid-uk');
  const markup = radarCardMarkup(item, { today: '2026-07-22' });
  assert.match(markup, /Coming soon/);
  assert.match(markup, /Confirmed OTR price £31,495/);
  assert.match(markup, /<dl class="radar-card__facts">/);
  assert.match(markup, /class="radar-card__silhouette"[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(markup, /Summer 2026/);
  assert.match(markup, /Checked/);
  assert.match(markup, /Leapmotor UK/);
  assert.match(markup, /noopener noreferrer/);
});

test('radar rendering escapes hostile text and refuses insecure source URLs', () => {
  const hostile = {
    schemaVersion: 2,
    collections: [{ id: 'x', title: 'x', items: [{
      id: 'bad', make: '<script>', model: 'Unsafe', availability: 'coming', origin: 'China',
      market: ['UK'], price: { label: 'TBC', type: 'tbc' }, note: '<img src=x>',
      source: { label: 'Bad source', url: 'http://example.test/car' },
    }] }],
  };
  const markup = radarResultsMarkup(hostile);
  assert.match(markup, /&lt;script&gt;/);
  assert.match(markup, /&lt;img src=x&gt;/);
  assert.doesNotMatch(markup, /http:\/\/example\.test/);
});
