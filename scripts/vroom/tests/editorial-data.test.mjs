import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..', '..', '..');
const editorial = JSON.parse(readFileSync(join(ROOT, 'vroom', 'data', 'editorial.json'), 'utf8'));
const cars = JSON.parse(readFileSync(join(ROOT, 'vroom', 'data', 'cars.json'), 'utf8'));
const CARS_BY_ID = new Map(cars.map(car => [car.id, car]));
const COLLECTION_IDS = new Set(['new-and-incoming', 'chinese-cars-in-europe']);
const STATUSES = new Set(['on-sale', 'coming']);
const PRICE_TYPES = new Set(['confirmed', 'incentive', 'launch-price']);
const OFFICIAL_DOMAINS = ['byd.com', 'jaecoo.co.uk', 'omodaauto.co.uk', 'stellantis.com', 'xpeng.com', 'xpengcars.co.uk', 'zeekr.eu'];

test('editorial collections contain sourced, market-specific new-car facts', () => {
  assert.equal(editorial.schemaVersion, 1);
  assert.match(editorial.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(new Set(editorial.collections.map(collection => collection.id)), COLLECTION_IDS);

  const itemIds = new Set();
  let standalone = 0;
  let incoming = 0;
  for (const collection of editorial.collections) {
    assert.ok(collection.items.length >= 6 && collection.items.length <= 8, collection.id);
    for (const item of collection.items) {
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.equal(itemIds.has(item.id), false, `duplicate editorial item ${item.id}`);
      itemIds.add(item.id);
      assert.equal(STATUSES.has(item.availability), true, `${item.id}: invalid availability`);
      assert.ok(Array.isArray(item.market) && item.market.length, `${item.id}: market required`);
      assert.ok(item.note?.length >= 20, `${item.id}: editorial note required`);
      assert.match(item.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(item.reviewBy, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(item.checkedAt <= item.reviewBy, `${item.id}: review date precedes check date`);
      assert.equal(PRICE_TYPES.has(item.price?.type), true, `${item.id}: invalid price type`);
      assert.equal(Number.isInteger(item.price?.amount) && item.price.amount > 0, true, `${item.id}: invalid price`);
      assert.match(item.price?.currency, /^(GBP|EUR)$/);
      assert.match(item.price?.label, /(£|€)/);
      if (item.reviewBy < editorial.asOf) assert.match(item.price.label, /verify current/i, `${item.id}: stale price must be qualified`);
      const source = new URL(item.source?.url);
      assert.equal(source.protocol, 'https:');
      assert.ok(OFFICIAL_DOMAINS.some(domain => source.hostname === domain || source.hostname.endsWith(`.${domain}`)), `${item.id}: source must be official`);
      if (item.carId) {
        const car = CARS_BY_ID.get(item.carId);
        assert.ok(car, `${item.id}: invalid carId ${item.carId}`);
      } else {
        standalone += 1;
        assert.ok(item.make && item.model, `${item.id}: standalone entry needs make/model`);
      }
      if (item.availability === 'coming') {
        incoming += 1;
        assert.ok(item.expectedLaunch, `${item.id}: incoming entry needs launch timing`);
      }
    }
  }
  assert.ok(standalone >= 6, 'collection must cover brands absent from the used catalogue');
  assert.ok(incoming >= 1, 'collection must include a confirmed incoming model');
});
