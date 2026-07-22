import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
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
const IMAGE_LICENSE = /^(?:CC0|Public domain|CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0))$/i;
const IMAGE_PATH = /^\/vroom\/media\/radar\/[a-z0-9][a-z0-9-]*-(?:480|960)\.webp$/;

function assetPath(publicPath) {
  return join(ROOT, publicPath.replace(/^\//, ''));
}

function assertLocalWebp(publicPath, label) {
  assert.match(publicPath, IMAGE_PATH, `${label}: image must use the local radar asset contract`);
  const path = assetPath(publicPath);
  assert.equal(existsSync(path), true, `${label}: missing local asset ${publicPath}`);
  assert.ok(statSync(path).size > 100, `${label}: empty or implausibly small asset ${publicPath}`);
  const header = readFileSync(path).subarray(0, 12);
  assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF', `${label}: ${publicPath} is not RIFF`);
  assert.equal(header.subarray(8, 12).toString('ascii'), 'WEBP', `${label}: ${publicPath} is not WebP`);
}

test('editorial collections contain sourced, market-specific new-car facts', () => {
  assert.equal(editorial.schemaVersion, 3);
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

test('approved radar photos are complete, local and reproducible while uncertain cars keep silhouettes', () => {
  let pictured = 0;
  let silhouettes = 0;
  for (const collection of editorial.collections) {
    for (const item of collection.items) {
      const image = item.image;
      if (!image) {
        silhouettes += 1;
        continue;
      }
      pictured += 1;
      assert.equal(typeof image, 'object', `${item.id}: image metadata must be an object`);
      assertLocalWebp(image.src, item.id);
      assert.equal(Array.isArray(image.srcset), true, `${item.id}: responsive srcset required`);
      assert.deepEqual(image.srcset.map(source => source.width), [480, 960], `${item.id}: 480px and 960px variants required`);
      for (const source of image.srcset) {
        assert.equal(Number.isInteger(source.width), true, `${item.id}: srcset width must be an integer`);
        assert.match(source.src, new RegExp(`-${source.width}\\.webp$`), `${item.id}: srcset filename must match its width`);
        assertLocalWebp(source.src, item.id);
      }
      assert.ok(image.srcset.some(source => source.src === image.src), `${item.id}: primary src must be one of the responsive variants`);
      assert.ok(image.alt?.trim(), `${item.id}: useful alt text required`);
      assert.ok(image.alt.toLowerCase().includes(item.make.toLowerCase()), `${item.id}: alt text must name the make`);
      assert.equal(Number.isInteger(image.width) && image.width > 0, true, `${item.id}: intrinsic width required`);
      assert.equal(Number.isInteger(image.height) && image.height > 0, true, `${item.id}: intrinsic height required`);
      assert.ok(image.creator?.trim(), `${item.id}: creator required`);
      assert.match(image.license, IMAGE_LICENSE, `${item.id}: unsupported image licence`);
      assert.equal(new URL(image.licenseUrl).hostname, 'creativecommons.org', `${item.id}: licence must link to Creative Commons`);
      assert.equal(new URL(image.sourcePage).hostname, 'commons.wikimedia.org', `${item.id}: canonical Commons File page required`);
      assert.equal(new URL(image.originalUrl).hostname, 'upload.wikimedia.org', `${item.id}: original must be Wikimedia-hosted`);
      assert.match(image.retrievedAt, /^\d{4}-\d{2}-\d{2}$/, `${item.id}: retrieval date required`);
      assert.ok(image.retrievedAt <= editorial.asOf, `${item.id}: retrieval date cannot follow the edition date`);
      assert.match(image.sha256, /^[a-f0-9]{64}$/i, `${item.id}: delivered-image SHA-256 required`);
      const deliveredHash = createHash('sha256').update(readFileSync(assetPath(image.src))).digest('hex');
      assert.equal(image.sha256, deliveredHash, `${item.id}: delivered image does not match its recorded SHA-256`);
      assert.equal(Array.isArray(image.changes) && image.changes.length > 0, true, `${item.id}: transformations must be declared`);
      assert.ok(image.changes.every(change => typeof change === 'string' && change.trim()), `${item.id}: invalid transformation note`);

      const imageRecord = JSON.stringify(image);
      assert.doesNotMatch(imageRecord, /google(?:usercontent)?\.|gstatic\.|bing\.|yimg\./i, `${item.id}: search-engine image URL leaked into data`);
      assert.doesNotMatch(imageRecord, /(?:byd\.com|jaecoo\.co\.uk|omodaauto\.co\.uk|stellantis\.com|xpeng\.com|xpengcars\.co\.uk|zeekr\.eu)\/.+\.(?:avif|gif|jpe?g|png|webp)/i, `${item.id}: manufacturer image URL leaked into data`);
    }
  }
  assert.ok(pictured >= 12, 'radar should show a substantial verified photo set');
  assert.ok(silhouettes >= 1, 'uncertain or unlicensed matches must retain the designed silhouette');
});
