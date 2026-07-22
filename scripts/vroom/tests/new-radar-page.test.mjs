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

const renderedPhoto = {
  src: '/vroom/media/radar/test-car-960.webp',
  srcset: [
    { src: '/vroom/media/radar/test-car-480.webp', width: 480 },
    { src: '/vroom/media/radar/test-car-960.webp', width: 960 },
  ],
  alt: 'Test & Car from the front',
  width: 960,
  height: 640,
  creator: 'Alice & Bob',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourcePage: 'https://commons.wikimedia.org/wiki/File:Test_Car.jpg',
  originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Test_Car.jpg',
  retrievedAt: '2026-07-22',
  sha256: 'b'.repeat(64),
  changes: ['Resized', 'Converted to WebP'],
  note: 'Model family shown',
};

function fixtureWithImage(image = renderedPhoto) {
  return {
    schemaVersion: 2,
    collections: [{ id: 'photos', title: 'Photos', items: [{
      id: 'test-car', make: 'Test', model: 'Car', availability: 'on-sale', origin: 'China', body: 'suv',
      market: ['UK'], price: { currency: 'GBP', amount: 25000, label: '£25,000', type: 'confirmed' },
      checkedAt: '2026-07-22', note: 'A test car with a safely licensed local image.',
      source: { label: 'Official source', url: 'https://example.test/car' }, image,
    }] }],
  };
}

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
  assert.match(markup, /Summer 2026/);
  assert.match(markup, /Checked/);
  assert.match(markup, /Leapmotor UK/);
  assert.match(markup, /noopener noreferrer/);
});

test('credited local photos render responsive, escaped, lazy and dimensioned markup', () => {
  const markup = radarResultsMarkup(fixtureWithImage());
  assert.match(markup, /<img\b[^>]*src="\/vroom\/media\/radar\/test-car-960\.webp"/);
  assert.match(markup, /srcset="\/vroom\/media\/radar\/test-car-480\.webp 480w, \/vroom\/media\/radar\/test-car-960\.webp 960w"/);
  assert.match(markup, /alt="Test &amp; Car from the front"/);
  assert.match(markup, /width="960"/);
  assert.match(markup, /height="640"/);
  assert.match(markup, /loading="lazy"/);
  assert.match(markup, /decoding="async"/);
  assert.match(markup, /Alice &amp; Bob/);
  assert.match(markup, /CC BY-SA 4\.0/);
  assert.match(markup, /href="https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/"/);
  assert.match(markup, /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Test_Car\.jpg"/);
  assert.match(markup, /rel="noopener noreferrer"/);
  assert.match(markup, /opens in a new tab/);
  assert.match(markup, /Model family shown/);
  assert.match(markup, /resized\/WebP/);
  assert.match(markup, /class="radar-card__image-fallback"[^>]*hidden[^>]*aria-hidden="true"/);
  assert.doesNotMatch(markup, /upload\.wikimedia\.org/);
});

test('photo alt text and attribution are escaped before entering card markup', () => {
  const markup = radarResultsMarkup(fixtureWithImage({
    ...renderedPhoto,
    alt: '\"><img src=x onerror=alert(1)>',
    creator: '<script>alert(1)</script>',
  }));
  assert.match(markup, /alt="&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;"/);
  assert.match(markup, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(markup, /<script>|alt=""><img/i);
});

test('missing or incomplete photo metadata falls back to the decorative silhouette', () => {
  for (const image of [null, { ...renderedPhoto, creator: '' }, { ...renderedPhoto, sha256: '' }]) {
    const markup = radarResultsMarkup(fixtureWithImage(image));
    assert.match(markup, /class="radar-card__media is-image-fallback"/);
    assert.match(markup, /class="radar-card__silhouette"[^>]*aria-hidden="true"[^>]*focusable="false"/);
    assert.doesNotMatch(markup, /<img\b/);
  }
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

test('radar rejects hostile or remote photo fields instead of emitting executable markup', () => {
  const hostile = {
    ...renderedPhoto,
    src: 'https://images.google.com/car.webp',
    alt: '\"><img src=x onerror=alert(1)>',
    creator: '<script>alert(1)</script>',
    sourcePage: 'javascript:alert(1)',
  };
  const markup = radarResultsMarkup(fixtureWithImage(hostile));
  assert.match(markup, /class="radar-card__silhouette"/);
  assert.doesNotMatch(markup, /images\.google\.com|onerror=|<script>|javascript:/i);
});
