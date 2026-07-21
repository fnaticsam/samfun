import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalFileKey, commonsFilePage, normalizeOverride } from '../03-images.mjs';
import { applyStateOverlays, checkCar, exactSpecFingerprint, loadCatalogue, RIVAL_ALIASES, semanticDiagnostics, validate } from '../05-validate.mjs';
import { repairRivals, serializeOverrides } from '../07-rivals.mjs';
import { slug } from '../lib/vocab.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..', '..', '..');

test('image overrides normalize MediaWiki names, page URLs and direct records', () => {
  assert.equal(canonicalFileKey('File:Foo_Bar.jpg'), canonicalFileKey('image:foo bar.jpg'));
  assert.equal(commonsFilePage('File:Foo Bar.jpg'), 'https://commons.wikimedia.org/wiki/File:Foo_Bar.jpg');
  assert.deepEqual(normalizeOverride('https://commons.wikimedia.org/wiki/File:Foo_Bar.jpg'), {
    kind: 'file', value: 'File:Foo Bar.jpg'
  });
  assert.equal(normalizeOverride({ src: 'https://example.com/car.jpg', license: 'CC0' }).image.license, 'CC0');
});

test('development validation accepts catalogue facts while exposing release readiness', async () => {
  const result = await validate({ min: 1 });
  assert.equal(result.errs.length, 0);
  assert.equal(result.cars.length >= 1, true);
  assert.equal(result.cars.some(car => car.years[0] < 1980), true);
  assert.equal(result.cars.some(car => car.accel < 2.2), true);
  assert.equal(result.cars.some(car => car.top < 80), true);
  assert.equal(result.releaseGates.some(([label]) => label.startsWith('real-image coverage')), true);
});

test('semantic release diagnostics catch false seven-seat claims, exact same-model specs and affordable halo flags', () => {
  const base = {
    make: 'Example', model: 'Family', years: [2020, 0], bodies: ['suv'], segment: 'seven-seater',
    priceNew: [30000, 40000], used: [15000, 25000], accel: 9, power: [150, 180], top: 120,
    fuels: ['petrol'], mpg: 40, ev: null, seats: 5, doors: 5, boot: 500, len: 4600, kg: 1700,
    mpy: 9000, ncap: [5, 2020], onSale: true, halo: true,
    g: { build: 70, drive: 70, practicality: 80, value: 70, design: 70, running: 70 },
    verdict: 'A deliberately complete fixture with enough prose to pass the basic validator requirements.',
    issues: ['Fixture only'], buy: 'Use this fixture only for validation coverage.',
    tags: ['seven-seats', 'family-bus', 'school-run'], rivals: ['other-car-one']
  };
  const first = { ...base, gen: 'A' };
  const second = { ...base, gen: 'B' };
  const errs = [], warn = [];
  checkCar(first, errs, warn);
  assert.equal(errs.some(message => message.includes('seven-seat segment/tag requires at least 7 seats')), true);
  assert.equal(exactSpecFingerprint(first), exactSpecFingerprint(second));
  const diagnostics = semanticDiagnostics([first, second], { gradeTemplateThreshold: 2, minimumMakeSample: 2 });
  assert.deepEqual(diagnostics.specDuplicates, [['example-family-a', 'example-family-b']]);
  assert.deepEqual(diagnostics.haloAffordable, ['example-family-a', 'example-family-b']);
  assert.equal(diagnostics.repeatedGradeTemplates.length, 1);
  assert.deepEqual(diagnostics.flatGradeMakes, [{ make: 'example', cars: 2, vectors: 1 }]);
});

test('rival repair preserves valid slots, canonicalizes aliases and deterministically fills invalid slots', () => {
  const source = {
    make: 'Test', model: 'Source', gen: 'One', segment: 'small', bodies: ['hatch'], tags: ['fun', 'cheap'],
    fuels: ['petrol'], used: [5000, 9000], years: [2018, 0],
    rivals: ['volkswagen-id-3-e11', 'missing-rival', 'test-source-one']
  };
  const id3 = {
    make: 'Volkswagen', model: 'ID3', gen: 'E11', segment: 'small', bodies: ['hatch'], tags: ['fun', 'cheap'],
    fuels: ['ev'], used: [10000, 15000], years: [2020, 0], rivals: []
  };
  const close = {
    make: 'Test', model: 'Close', gen: 'One', segment: 'small', bodies: ['hatch'], tags: ['fun', 'cheap'],
    fuels: ['petrol'], used: [5500, 8500], years: [2019, 0], rivals: []
  };
  const distant = {
    make: 'Test', model: 'Distant', gen: 'One', segment: 'luxury', bodies: ['suv'], tags: ['luxury'],
    fuels: ['diesel'], used: [50000, 80000], years: [2000, 0], rivals: []
  };
  const first = repairRivals([source, id3, close, distant]);
  const second = repairRivals([source, id3, close, distant]);
  assert.equal(RIVAL_ALIASES['volkswagen-id-3-e11'], 'volkswagen-id3-e11');
  assert.deepEqual(first.items['test-source-one'].rivals, ['volkswagen-id3-e11', 'test-close-one', 'test-distant-one']);
  assert.equal(serializeOverrides(first), serializeOverrides(second));
});

test('rival overlays are complete replacements and leave no invalid emitted references', async () => {
  const raw = await loadCatalogue();
  const merged = applyStateOverlays(raw);
  const ids = new Set(merged.map(car => slug(car.make, car.model, car.gen)));
  const overrides = JSON.parse(readFileSync(join(ROOT, 'scripts', 'vroom', 'state', 'rival-overrides.json'), 'utf8'));
  assert.equal(overrides.version, 1);
  assert.ok(Object.keys(overrides.items).length > 0);
  assert.equal(Object.keys(overrides.items).every(id => ids.has(id)), true);
  for (const car of merged) {
    const id = slug(car.make, car.model, car.gen);
    assert.equal(car.rivals.length >= 1 && car.rivals.length <= 5, true, id);
    assert.equal(new Set(car.rivals).size, car.rivals.length, id);
    assert.equal(car.rivals.includes(id), false, id);
    assert.equal(car.rivals.every(rival => ids.has(rival)), true, id);
  }
});

test('built contract is expanded, complete and strips internal image fields', () => {
  const cars = JSON.parse(readFileSync(join(ROOT, 'vroom', 'data', 'cars.json'), 'utf8'));
  const meta = JSON.parse(readFileSync(join(ROOT, 'vroom', 'data', 'meta.json'), 'utf8'));
  assert.equal(cars.length, meta.count);
  assert.deepEqual([...cars].sort((a, b) => a.id.localeCompare(b.id)).map(car => car.id), cars.map(car => car.id));
  for (const key of ['priceNewGBP', 'usedGBP', 'accel062', 'powerBHP', 'topMph', 'grades', 'vroom']) {
    assert.equal(Object.hasOwn(cars[0], key), true, `missing ${key}`);
  }
  for (const car of cars) {
    if (!car.img) continue;
    assert.deepEqual(Object.keys(car.img), ['src', 'w', 'h', 'credit', 'license', 'page']);
  }
  assert.equal(meta.build.bytes, Buffer.byteLength(readFileSync(join(ROOT, 'vroom', 'data', 'cars.json'))));
});
