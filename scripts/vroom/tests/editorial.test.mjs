import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeEditorialPayload } from '../../../vroom/static/js/editorial.mjs';

const validImage = {
  src: '/vroom/media/radar/test-car-960.webp',
  srcset: [
    { src: '/vroom/media/radar/test-car-480.webp', width: 480 },
    { src: '/vroom/media/radar/test-car-960.webp', width: 960 },
  ],
  alt: 'Test Car photographed from the front three-quarter angle',
  width: 960,
  height: 640,
  creator: 'Example Photographer',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  sourcePage: 'https://commons.wikimedia.org/wiki/File:Test_Car.jpg',
  originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Test_Car.jpg',
  retrievedAt: '2026-07-22',
  sha256: 'a'.repeat(64),
  changes: ['Resized to 480px and 960px', 'Converted to WebP'],
};

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

test('normalization retains a complete, locally hosted Commons photo contract', () => {
  const normalized = normalizeEditorialPayload({ collections: [{ title: 'Photos', items: [{
    id: 'test-car', make: 'Test', model: 'Car', image: validImage,
  }] }] });
  assert.deepEqual(normalized.collections[0].items[0].image, validImage);
});

test('normalization rejects incomplete, remote, unknown-licence and non-Commons photos', () => {
  const invalidImages = [
    { ...validImage, sha256: '' },
    { ...validImage, license: 'Attribution' },
    { ...validImage, src: 'https://images.google.com/test-car.webp' },
    { ...validImage, srcset: [{ src: 'https://www.byd.com/test-car.webp', width: 480 }, ...validImage.srcset.slice(1)] },
    { ...validImage, sourcePage: 'https://www.byd.com/uk/test-car' },
    { ...validImage, originalUrl: 'https://xpengcars.co.uk/test-car.jpg' },
    { ...validImage, licenseUrl: 'https://example.test/custom-license' },
    { ...validImage, changes: [] },
  ];
  const normalized = normalizeEditorialPayload({ collections: [{ title: 'Rejected photos', items: invalidImages.map((image, index) => ({
    id: `invalid-${index}`, make: 'Test', model: 'Car', image,
  })) }] });
  assert.ok(normalized.collections[0].items.every(item => item.image === null));
});

test('empty editorial payload normalizes to a safe empty collection list', () => {
  assert.deepEqual(normalizeEditorialPayload(null).collections, []);
  assert.deepEqual(normalizeEditorialPayload({ collections: [] }).collections, []);
});
