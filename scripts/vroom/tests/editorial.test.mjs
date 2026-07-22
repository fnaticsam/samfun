import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeEditorialPayload } from '../../../vroom/static/js/editorial.mjs';

const payload = {
  schemaVersion: 1,
  asOf: '2026-07-22',
  collections: [{
    id: 'new-coming-europe', title: 'New & coming to Europe', description: 'The next arrivals.',
    items: [{
      id: 'known', carId: 'byd-seal-u', make: 'BYD', model: 'Seal U', availability: 'on-sale',
      market: ['GB', 'EU'], price: { currency: 'GBP', amount: 33000, type: 'from' }, note: 'A practical EV.',
      source: { label: 'BYD', url: 'https://example.test/byd' },
    }, {
      id: 'standalone', title: 'Future car', availability: 'coming', expectedLaunch: 'Late 2026',
      priceLabel: 'from €30,000', source: { label: 'Manufacturer source', url: 'https://example.test/future' },
    }],
  }, {
    id: 'chinese-cars-changing-europe', title: 'Chinese cars changing Europe', items: [{ id: 'other', title: 'Another arrival' }],
  }],
};

test('normalizes published editorial data plus price-label fallback', () => {
  const normalized = normalizeEditorialPayload(payload);
  assert.equal(normalized.asOf, '2026-07-22');
  assert.equal(normalized.collections.length, 2);
  assert.equal(normalized.collections[0].items[0].price.label, '£33,000');
  assert.equal(normalized.collections[0].items[1].price.label, 'from €30,000');
});

test('normalization retains dedicated-page fields and rejects insecure source URLs', () => {
  const normalized = normalizeEditorialPayload({ collections: [{ title: 'Safe', items: [{
    title: '<script>', origin: 'China', powertrain: 'EV', body: 'SUV', featured: true,
    tags: ['China-Europe'], source: { label: 'Unsafe', url: 'javascript:alert(1)' },
  }, {
    title: 'Plain HTTP', source: { label: 'Insecure', url: 'http://example.test/car' },
  }] }] });
  assert.equal(normalized.collections[0].items[0].title, '<script>');
  assert.equal(normalized.collections[0].items[0].origin, 'China');
  assert.equal(normalized.collections[0].items[0].powertrain, 'ev');
  assert.equal(normalized.collections[0].items[0].body, 'suv');
  assert.equal(normalized.collections[0].items[0].featured, true);
  assert.deepEqual(normalized.collections[0].items[0].tags, ['china-europe']);
  assert.equal(normalized.collections[0].items[0].source.url, '');
  assert.equal(normalized.collections[0].items[1].source.url, '');
});

test('empty editorial payload normalizes to a safe empty collection list', () => {
  assert.deepEqual(normalizeEditorialPayload(null).collections, []);
  assert.deepEqual(normalizeEditorialPayload({ collections: [] }).collections, []);
});
