import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../../vroom/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../../vroom/static/js/app.mjs', import.meta.url), 'utf8');

test('the finder consolidates search, body shapes, menus and sliders before results', () => {
  const finder = html.indexOf('<section class="finder-shell"');
  const search = html.indexOf('id="search-input"');
  const bodies = html.indexOf('class="body-shape-picker"');
  const menus = html.indexOf('id="filter-menu-root"');
  const sliders = html.indexOf('id="slider-deck"');
  const results = html.indexOf('id="results"');

  assert.ok(finder >= 0);
  assert.ok(finder < search && search < bodies && bodies < menus && menus < sliders && sliders < results);
  assert.equal((html.match(/id="search-input"/g) || []).length, 1);
  assert.equal((html.match(/id="filter-menu-root"/g) || []).length, 1);
  assert.equal((html.match(/id="slider-deck"/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('all catalogue body shapes are always-visible labelled toggle buttons', () => {
  const matches = [...html.matchAll(/<button class="body-shape-option"[^>]*data-filter="body"[^>]*data-value="([^"]+)"[^>]*aria-pressed="false"[^>]*>([\s\S]*?)<\/button>/g)];
  const iconFiles = {
    hatch: 'hatchback.png', saloon: 'saloon.png', estate: 'estate.png', suv: 'suv.png',
    coupe: 'coupe.png', convertible: 'convertible.png', mpv: 'mpv.png', van: 'van.png', pickup: 'pickup.png',
  };
  const iconHashes = {
    'hatchback.png': '0ca8d7e64bf318c6cd582edf421587a426ec20f6592bcff67bd438de7d7e7f6a',
    'saloon.png': 'fdf5999e2a4855209cb3d36eb76ffc82eafe9f4a9eeddb49f918bd8f7b4ee183',
    'estate.png': 'b28e9e2c2ff742d92b9578f32f82316aacab69bc87d2362c4e794e5395b05742',
    'suv.png': 'd523ca56cf20cdeb48a6bcd9a8dbd56934bda0f7f41a51c2f5986269d7b5f8c1',
    'coupe.png': 'c2ee0c89a8f0ae7de5f9e371624446e7f9df01bd808ea0b36fd7b667bc83312f',
    'convertible.png': '91e61eabc44b85918206d3ee54513211c1e3019b3893b4828d9387862ca45467',
    'mpv.png': 'c0538a7a56f9307d08bc7df65ff0846d68385a976f15e1191ca6bf60054b2636',
    'van.png': '46af3c5220ef08628037812ae8cefdecdfff17babe191752686df2c60e3ea532',
    'pickup.png': 'eae9924dd25b33ddd751e7ed96ee669121e3ea51b92228e9f79504bfc2a42ead',
  };
  assert.deepEqual(matches.map(match => match[1]), Object.keys(iconFiles));
  for (const [, value, content] of matches) {
    assert.match(content, new RegExp(`<img[^>]*src="/vroom/media/body-icons/${iconFiles[value]}"[^>]*width="1024"[^>]*height="1024"[^>]*alt=""[^>]*aria-hidden="true"`));
    assert.match(content, /<span>[^<]+<\/span>/, `${value} needs a visible label`);
    assert.doesNotMatch(content, /<svg\b/, `${value} should use the supplied PNG directly`);
    const png = readFileSync(new URL(`../../../vroom/media/body-icons/${iconFiles[value]}`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${value} icon must be a PNG`);
    assert.equal(createHash('sha256').update(png).digest('hex'), iconHashes[iconFiles[value]], `${value} icon bytes changed`);
  }
  assert.match(html, /<fieldset class="body-shape-picker"[^>]*>[\s\S]*?<legend>Body shape<\/legend>/);
  assert.match(html, /data-action="clear-bodies">Any body<\/button>/);
});

test('body is removed from the compact menus and Any body clears only body state', () => {
  assert.match(app, /groups: FILTER_MENU_GROUPS\.filter\(group => group\.id !== 'body'\)/);
  assert.match(app, /if \(action === 'clear-bodies'\) \{\s*filters\.bodies = \[\];\s*render\(\);/);
});
