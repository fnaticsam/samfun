import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FILTER_MENU_GROUPS, filterMenuGroup, filterMenuPatch, menuSelection,
} from '../../../vroom/static/js/filter-menus.mjs';

test('filter-menu definitions use stable state and URL vocabulary', () => {
  assert.deepEqual(FILTER_MENU_GROUPS.map(group => [group.id, group.stateKey, group.queryKey]), [
    ['body', 'bodies', 'b'], ['fuel', 'fuels', 'f'], ['character', 'vibes', 'v'],
  ]);
  assert.equal(filterMenuGroup('fuels').id, 'fuel');
  assert.equal(filterMenuGroup('unknown'), null);
  assert.deepEqual(FILTER_MENU_GROUPS[0].options.map(option => option.value), [
    'hatch', 'saloon', 'estate', 'suv', 'coupe', 'convertible', 'mpv', 'van', 'pickup',
  ]);
});

test('menu selections remove malformed values and deduplicate while retaining option order', () => {
  assert.deepEqual(menuSelection({ bodies: ['suv', 'bad', 'suv', 'hatch'] }, 'body'), ['suv', 'hatch']);
  assert.deepEqual(menuSelection({ fuels: 'ev' }, 'fuel'), []);
});

test('multi-select patches toggle values and explicit All clears only its group', () => {
  const filters = { bodies: ['suv'], fuels: ['ev'], vibes: ['drivers-car'] };
  assert.deepEqual(filterMenuPatch(filters, 'body', 'hatch'), { bodies: ['hatch', 'suv'] });
  assert.deepEqual(filterMenuPatch(filters, 'body', 'suv'), { bodies: [] });
  assert.deepEqual(filterMenuPatch(filters, 'fuel', 'all'), { fuels: [] });
  assert.deepEqual(filterMenuPatch(filters, 'character', 'family-bus'), { vibes: ['drivers-car', 'family-bus'] });
  assert.throws(() => filterMenuPatch(filters, 'character', 'automatic'), /Unknown character/);
});
