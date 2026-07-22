import test from 'node:test';
import assert from 'node:assert/strict';

import { editorialMarkup, normalizeEditorialPayload } from '../../../vroom/static/js/editorial.mjs';

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

test('renders both collections, preserves standalone source links and only gives known cars app actions', () => {
  const markup = editorialMarkup(payload, { byId: new Map([['byd-seal-u', { id: 'byd-seal-u', make: 'BYD', model: 'Seal U' }]]) });
  assert.match(markup, /New &amp; coming to Europe/);
  assert.match(markup, /Chinese cars changing Europe/);
  assert.match(markup, /data-editorial-view data-car-id="byd-seal-u"/);
  assert.match(markup, /data-action="save" data-id="byd-seal-u"/);
  assert.match(markup, /Manufacturer source/);
  assert.doesNotMatch(markup, /data-action="save" data-id="standalone"/);
  assert.match(markup, /data-editorial-explore="new-coming-europe"/);
});

test('empty or unsafe editorial data falls back without executable source URLs', () => {
  assert.match(editorialMarkup({ collections: [] }), /Editorial updates are being prepared/);
  const markup = editorialMarkup({ collections: [{ title: 'Safe', items: [{ title: '<script>', source: { url: 'javascript:alert(1)' } }] }] });
  assert.match(markup, /&lt;script&gt;/);
  assert.doesNotMatch(markup, /javascript:/);
});
