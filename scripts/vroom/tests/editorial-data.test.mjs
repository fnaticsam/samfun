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
const COLLECTION_IDS = new Set(['on-sale-now', 'coming-soon']);
const STATUSES = new Set(['on-sale', 'coming']);
const PRICE_TYPES = new Set(['confirmed', 'incentive', 'tbc']);
const POWERTRAINS = new Set(['ev', 'petrol', 'hybrid', 'phev', 'range-extender']);
const BODIES = new Set(['hatchback', 'estate', 'suv', 'mpv']);
const OFFICIAL_DOMAINS = ['byd.com', 'jaecoo.co.uk', 'omodaauto.co.uk', 'stellantis.com', 'xpeng.com', 'xpengcars.co.uk', 'zeekr.eu'];

test('editorial collections contain sourced, market-specific new-car facts', () => {
  assert.equal(editorial.schemaVersion, 2);
  assert.match(editorial.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(new Set(editorial.collections.map(collection => collection.id)), COLLECTION_IDS);

  const itemIds = new Set();
  const records = new Set();
  let standalone = 0;
  let incoming = 0;
  let total = 0;
  for (const collection of editorial.collections) {
    assert.ok(collection.items.length >= 2, collection.id);
    for (const item of collection.items) {
      total += 1;
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.equal(itemIds.has(item.id), false, `duplicate editorial item ${item.id}`);
      itemIds.add(item.id);
      assert.equal(STATUSES.has(item.availability), true, `${item.id}: invalid availability`);
      assert.equal(item.origin, 'China', `${item.id}: origin must be explicit`);
      assert.equal(POWERTRAINS.has(item.powertrain), true, `${item.id}: invalid powertrain`);
      assert.equal(BODIES.has(item.body), true, `${item.id}: invalid body`);
      assert.ok(Array.isArray(item.market) && item.market.length, `${item.id}: market required`);
      assert.ok(item.note?.length >= 20, `${item.id}: editorial note required`);
      assert.match(item.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(item.reviewBy, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(item.checkedAt <= item.reviewBy, `${item.id}: review date precedes check date`);
      assert.equal(PRICE_TYPES.has(item.price?.type), true, `${item.id}: invalid price type`);
      if (item.price.type === 'tbc') {
        assert.equal(item.availability, 'coming', `${item.id}: only incoming cars may have price TBC`);
        assert.equal(item.price.amount, null, `${item.id}: TBC price must not invent an amount`);
        assert.match(item.price.label, /confirm/i);
      } else {
        assert.equal(Number.isInteger(item.price?.amount) && item.price.amount > 0, true, `${item.id}: invalid price`);
      }
      assert.match(item.price?.currency, /^(GBP|EUR)$/);
      if (item.price.type !== 'tbc') assert.match(item.price?.label, /(£|€)/);
      if (item.reviewBy < editorial.asOf) assert.match(item.price.label, /verify current/i, `${item.id}: stale price must be qualified`);
      const source = new URL(item.source?.url);
      assert.equal(source.protocol, 'https:');
      assert.ok(item.source.label?.length, `${item.id}: source label required`);
      assert.ok(OFFICIAL_DOMAINS.some(domain => source.hostname === domain || source.hostname.endsWith(`.${domain}`)), `${item.id}: source must be official`);
      const record = [item.make, item.model, item.market.join('|'), item.price.amount, item.price.currency].join('::').toLowerCase();
      assert.equal(records.has(record), false, `${item.id}: duplicated model/market/price record`);
      records.add(record);
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
  assert.ok(total >= 20, 'radar should provide a useful full-page field');
  assert.ok(standalone >= 6, 'collection must cover brands absent from the used catalogue');
  assert.ok(incoming >= 2, 'collection must include confirmed incoming models');
});
