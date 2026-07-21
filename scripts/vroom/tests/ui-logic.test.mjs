import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCar } from '../../../vroom/static/js/data.mjs';
import { cardMarkup } from '../../../vroom/static/js/cards.mjs';
import { comparisonMarkup, normalizeCompared, toggleCompared } from '../../../vroom/static/js/compare.mjs';
import { detailMarkup, twinSummary } from '../../../vroom/static/js/detail.mjs';
import { carHash, compareHash, filtersToHash, hashToFilters, parseHash } from '../../../vroom/static/js/router.mjs';
import {
  carMatchesQuery, createFilters, determineEfficiencyMode, expectedMileageRange,
  filterCars, matchesFilters, toggleFilterValue,
} from '../../../vroom/static/js/state.mjs';
import {
  budgetGBPToPosition, budgetPositionToGBP, constrainPair,
} from '../../../vroom/static/js/sliders.mjs';
import {
  loadCompared, loadSaved, safeRead, safeWrite, saveCompared, toggleSaved,
} from '../../../vroom/static/js/storage.mjs';
import { findTwins, jaccard, numericCloseness, segmentAdjacency, twinScore } from '../../../vroom/static/js/twins.mjs';
import { expandSearchQuery, licenseURL, rangesOverlap, wikimediaSrcSet } from '../../../vroom/static/js/utils.mjs';

const baseCar = Object.freeze(normalizeCar({
  id: 'volkswagen-golf-mk8', make: 'Volkswagen', model: 'Golf', gen: 'Mk8',
  years: [2020, 0], bodies: ['hatch'], segment: 'family-hatch', usedGBP: [15000, 35000],
  accel062: 7.4, fuels: ['petrol', 'hybrid'], mpg: 52, evMiles: null, bootL: 381,
  lenMM: 4284, milesPerYear: 9000, tags: ['crowd-pleaser', 'family-bus', 'discreet'],
  grades: { practicality: 82 }, vroom: 89, halo: false,
}));

function car(overrides = {}) {
  return normalizeCar({ ...baseCar, ...overrides });
}

test('non-linear budget mapping preserves every anchor and approximately round-trips', () => {
  const anchors = [[0, 5000], [20, 10000], [40, 20000], [60, 35000], [80, 60000], [100, 100000]];
  for (const [position, pounds] of anchors) {
    assert.equal(budgetPositionToGBP(position), pounds);
    assert.equal(budgetGBPToPosition(pounds), position);
  }
  for (const amount of [7500, 14500, 27500, 47500, 80000]) {
    assert.ok(Math.abs(budgetPositionToGBP(budgetGBPToPosition(amount)) - amount) <= 1000);
  }
  assert.deepEqual(constrainPair(60, 40, 'min'), [60, 60]);
  assert.deepEqual(constrainPair(60, 40, 'max'), [40, 40]);
});

test('range overlap is inclusive and rejects malformed inputs', () => {
  assert.equal(rangesOverlap([10000, 20000], [20000, 30000]), true);
  assert.equal(rangesOverlap([10000, 19999], [20000, 30000]), false);
  assert.equal(rangesOverlap(null, [1, 2]), false);
});

test('car normalisation accepts catalogue aliases and always exposes the final contract', () => {
  const normalized = normalizeCar({
    id: 'x', make: 'X', model: 'One', gen: 'A', used: [1, 2], priceNew: [3, 4],
    accel: 5.5, power: [100, 200], top: 140, boot: 300, len: 4200, kg: 1300,
    mpy: 7000, ev: 250, g: { drive: 80 },
  });
  assert.deepEqual(normalized.usedGBP, [1, 2]);
  assert.deepEqual(normalized.priceNewGBP, [3, 4]);
  assert.equal(normalized.accel062, 5.5);
  assert.equal(normalized.evMiles, 250);
  assert.equal(normalized.grades.drive, 80);
  assert.deepEqual(normalized.tags, []);
});

test('renderers use only credited images and fall back without inventing attribution', () => {
  const uncredited = car({ img: { src: 'https://example.test/uncredited.jpg' } });
  assert.equal(cardMarkup(uncredited).includes('uncredited.jpg'), false);
  assert.match(detailMarkup(uncredited), /credited photo unavailable/);
  const credited = car({ img: { src: 'https://example.test/credited.jpg', credit: 'A Person', license: 'CC BY 4.0', page: 'https://example.test/source' } });
  assert.equal(cardMarkup(credited).includes('credited.jpg'), true);
  assert.match(detailMarkup(credited), /A Person/);
});

test('Commons images use responsive thumbnails and keep a visible attribution outside card links', () => {
  const source = 'https://upload.wikimedia.org/wikipedia/commons/8/88/Example_car.jpg';
  const srcset = wikimediaSrcSet(source);
  assert.match(srcset, /330px-Example_car\.jpg 330w/);
  assert.match(srcset, /1280px-Example_car\.jpg 1280w/);
  const escaped = wikimediaSrcSet('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Example%2C_car.jpg/1280px-Example%2C_car.jpg');
  assert.match(escaped, /Example%2C_car\.jpg\/330px-Example%2C_car\.jpg 330w/);
  assert.doesNotMatch(escaped, /%252C/);
  assert.equal(wikimediaSrcSet('https://example.test/car.jpg'), '');
  const credited = car({ img: { src: source, credit: 'A Person', license: 'CC BY 4.0', page: 'https://example.test/source' } });
  const markup = cardMarkup(credited);
  assert.match(markup, /srcset=/);
  assert.match(markup, /Photo: <a href=/);
  assert.match(markup, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(comparisonMarkup([credited, car({ id: 'other' })]), /CC BY 4\.0/);
  assert.equal(licenseURL('CC BY-SA 3.0 de'), 'https://creativecommons.org/licenses/by-sa/3.0/de/');
});

test('search aliases handle common UK car shorthand and accents', () => {
  assert.ok(expandSearchQuery('cheap VW').some(query => query.includes('volkswagen')));
  assert.equal(carMatchesQuery(baseCar, 'VW Golf'), true);
  assert.equal(carMatchesQuery(car({ make: 'BMW', model: 'M3' }), 'bimmer m3'), true);
  assert.equal(carMatchesQuery(car({ make: 'Mazda', model: 'MX-5' }), 'Miata'), true);
  assert.equal(carMatchesQuery(car({ make: 'Citroën', model: 'C3' }), 'citroen c3'), true);
});

test('multi-select filters are OR within a group and AND between groups', () => {
  const passes = createFilters({
    bodies: ['suv', 'hatch'], fuels: ['diesel', 'petrol'], vibes: ['sporty', 'discreet'],
  });
  assert.equal(matchesFilters(baseCar, passes, new Set(), 2026), true);
  assert.equal(matchesFilters(baseCar, createFilters({ bodies: ['suv'], fuels: ['petrol'] }), new Set(), 2026), false);
  assert.equal(matchesFilters(baseCar, createFilters({ bodies: ['hatch'], fuels: ['ev'] }), new Set(), 2026), false);

  const toggled = toggleFilterValue(passes, 'fuels', 'petrol');
  assert.deepEqual(toggled.fuels, ['diesel']);
  assert.notEqual(toggled, passes);
});

test('filter creation tolerates malformed persisted collections', () => {
  const filters = createFilters({ bodies: 1, fuels: null, budget: 7, age: 'old', mileage: {} });
  assert.deepEqual(filters.bodies, []);
  assert.deepEqual(filters.fuels, []);
  assert.deepEqual(filters.budget, [5000, 100000]);
  assert.deepEqual(filters.age, [0, 25]);
  assert.deepEqual(filters.mileage, [0, 250000]);
});

test('used price, production age, mileage, pace and best/saved rules compose', () => {
  const used = car({ years: [2018, 2020], usedGBP: [15000, 22000], milesPerYear: 10000, accel062: 7.5, vroom: 90, seats: 5, bootL: 420, onSale: false });
  assert.deepEqual(expectedMileageRange(used, [5, 7], 2026), [60000, 70000]);
  const filters = createFilters({
    budget: [22000, 30000], age: [5, 6], mileage: [59000, 65000],
    accelMax: 7.5, bestOnly: true, savedOnly: true,
  });
  assert.equal(matchesFilters(used, filters, new Set([used.id]), 2026), true);
  assert.equal(matchesFilters(used, { ...filters, budget: [22001, 30000] }, new Set([used.id]), 2026), false);
  assert.equal(matchesFilters(used, { ...filters, accelMax: 7.4 }, new Set([used.id]), 2026), false);
  assert.equal(matchesFilters(used, filters, new Set(), 2026), false);
  assert.equal(matchesFilters(used, { ...filters, savedOnly: false, seatsMin: 7 }, new Set(), 2026), false);
  assert.equal(matchesFilters(used, { ...filters, savedOnly: false, bootMin: 450 }, new Set(), 2026), false);
  assert.equal(matchesFilters(used, { ...filters, savedOnly: false, onSaleOnly: true }, new Set(), 2026), false);
});

test('halo cars stay out of browse but remain directly searchable', () => {
  const halo = car({ id: 'mercedes-g-class-w463', make: 'Mercedes-Benz', model: 'G-Class', halo: true, tags: ['boxy-icon'], usedGBP: [120000, 180000] });
  assert.equal(matchesFilters(halo, createFilters(), new Set(), 2026), false);
  assert.equal(matchesFilters(halo, createFilters({ query: 'Merc G-Class' }), new Set(), 2026), true);
  assert.equal(matchesFilters(halo, createFilters({ query: 'boxy icon' }), new Set(), 2026), false);
  assert.equal(matchesFilters(halo, createFilters({ includeHalo: true }), new Set(), 2026), true);
});

test('efficiency mode follows selected fuels and supports mixed results', () => {
  assert.equal(determineEfficiencyMode(createFilters({ fuels: ['ev'] })), 'range');
  assert.equal(determineEfficiencyMode(createFilters({ fuels: ['petrol'] })), 'mpg');
  assert.equal(determineEfficiencyMode(createFilters({ fuels: ['ev', 'hybrid'] })), 'either');
  const ev = car({ id: 'ev', fuels: ['ev'], mpg: null, evMiles: 260 });
  const petrol = car({ id: 'ice', fuels: ['petrol'], mpg: 55, evMiles: null });
  const mixed = createFilters({ fuels: ['ev', 'petrol'], efficiencyMin: 200 });
  assert.deepEqual(filterCars([petrol, ev], mixed, new Set(), 2026).map(item => item.id), ['ev']);
});

test('Best means score 88 or higher and score sorting is deterministic', () => {
  const cars = [car({ id: '87', vroom: 87 }), car({ id: '88b', vroom: 88, usedGBP: [20000, 30000] }), car({ id: '88a', vroom: 88, usedGBP: [10000, 20000] })];
  assert.deepEqual(filterCars(cars, createFilters({ bestOnly: true }), new Set(), 2026).map(item => item.id), ['88a', '88b']);
});

test('router round-trips shareable search state and decodes car routes', () => {
  const filters = createFilters({
    query: 'VW Golf', bodies: ['hatch'], fuels: ['petrol', 'hybrid'], vibes: ['discreet'],
    budget: [12500, 40500], age: [2, 12], mileage: [10000, 80000], accelMax: 8.2,
    efficiencyMin: 45, efficiencyMode: 'mpg', bestOnly: true, savedOnly: true,
    seatsMin: 5, bootMin: 300, onSaleOnly: true, sort: 'newest',
  });
  const hash = filtersToHash(filters);
  assert.ok(hash.startsWith('#q/'));
  assert.deepEqual(hashToFilters(hash), filters);
  assert.deepEqual(parseHash(carHash('bmw/m3')), { type: 'car', id: 'bmw/m3' });
  const comparison = compareHash(['bmw/m3', 'volkswagen-golf-mk8']);
  assert.deepEqual(parseHash(comparison), { type: 'compare', ids: ['bmw/m3', 'volkswagen-golf-mk8'] });
  assert.deepEqual(parseHash('#compare/one,one,one,one,two'), { type: 'compare', ids: ['one', 'two'] });
  assert.deepEqual(hashToFilters('#q/'), createFilters());
  assert.deepEqual(parseHash('#not-a-route'), { type: 'browse' });
});

test('storage helpers survive privacy exceptions and persist saved ids safely', () => {
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  assert.equal(safeWrite('x', { okay: true }, storage), true);
  assert.deepEqual(safeRead('x', null, storage), { okay: true });
  let saved = toggleSaved('one', new Set(), storage);
  assert.deepEqual([...saved], ['one']);
  assert.deepEqual([...loadSaved(storage)], ['one']);
  saved = toggleSaved('one', saved, storage);
  assert.equal(saved.size, 0);

  assert.equal(saveCompared(new Set(['one', 'two']), storage), true);
  assert.deepEqual([...loadCompared(storage)], ['one', 'two']);

  const throws = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(safeRead('x', ['fallback'], throws), ['fallback']);
  assert.equal(safeWrite('x', 1, throws), false);
});

test('comparison selection is unique, capped at four and renders an escaped scorecard', () => {
  const valid = new Set(['one', 'two', 'three', 'four', 'five']);
  assert.deepEqual(normalizeCompared(['one', 'one', 'missing', 'two'], valid), ['one', 'two']);
  let selected = new Set(['one', 'two', 'three', 'four']);
  const full = toggleCompared('five', selected);
  assert.equal(full.full, true);
  assert.deepEqual([...full.ids], [...selected]);
  selected = toggleCompared('two', selected).ids;
  assert.equal(selected.has('two'), false);
  selected = toggleCompared('five', selected).ids;
  assert.equal(selected.has('five'), true);

  const first = car({ id: 'one', make: '<BMW>', model: 'M3', vroom: 92, accel062: 3.9, usedGBP: [25000, 60000] });
  const second = car({ id: 'two', make: 'Volkswagen', model: 'Golf', vroom: 88, accel062: 6.2, usedGBP: [10000, 30000] });
  const markup = comparisonMarkup([first, second]);
  assert.equal(markup.includes('<BMW>'), false);
  assert.match(markup, /&lt;BMW&gt;/);
  assert.match(markup, /Side-by-side comparison/);
  assert.match(markup, /is-best/);
  assert.match(cardMarkup(first, false, true), /Comparing/);
  assert.match(detailMarkup(first, [], false, [], true), /Comparing/);
});

test('detail puts the buying decision before long specs and twins explain real overlap and savings', () => {
  const anchor = car({ id: 'anchor', tags: ['family-bus', 'discreet'], usedGBP: [20000, 30000], verdict: 'A clear choice.', buy: 'Check its service history.' });
  const twin = car({ id: 'twin', tags: ['family-bus', 'sporty'], usedGBP: [12000, 22000] });
  assert.equal(twinSummary(anchor, twin), 'Shares family bus · starts £8,000 lower');
  const markup = detailMarkup(anchor, [{ car: twin, score: 0.8 }]);
  assert.ok(markup.indexOf('Buy this one') < markup.indexOf('0–62 mph'));
  assert.match(markup, /Shares family bus · starts £8,000 lower/);
});

test('twin finder applies 50/35/15 scoring, adjacency and budget cap', () => {
  const anchor = car({
    id: 'halo', halo: true, segment: 'off-roader', usedGBP: [80000, 150000],
    tags: ['boxy-icon', 'go-anywhere', 'badge-value'], accel062: 6, bootL: 500, lenMM: 4700,
  });
  const close = car({
    id: 'close', segment: 'large-suv', usedGBP: [30000, 45000],
    tags: ['boxy-icon', 'go-anywhere', 'adventure-ready'], accel062: 6.5, bootL: 520, lenMM: 4750,
  });
  const expensive = car({ id: 'expensive', usedGBP: [60000, 70000], tags: anchor.tags });
  const wrong = car({ id: 'wrong', segment: 'city', usedGBP: [5000, 8000], tags: ['city-darling'] });

  assert.equal(jaccard(['a', 'b'], ['b', 'c']), 1 / 3);
  assert.equal(segmentAdjacency('off-roader', 'large-suv'), 0.7);
  assert.ok(numericCloseness(anchor, close) > 0.8);
  const expected = 0.5 * jaccard(anchor.tags, close.tags)
    + 0.35 * numericCloseness(anchor, close)
    + 0.15 * segmentAdjacency(anchor.segment, close.segment);
  assert.equal(twinScore(anchor, close), expected);
  assert.deepEqual(findTwins(anchor, [close, expensive, wrong], { maxBudget: 50000, limit: 3 }).map(result => result.car.id), ['close']);
});
