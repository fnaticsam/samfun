// Plain-node tests: `node api/_lib/match.test.js`. No framework (repo has no build step).
const assert = require('node:assert');
const { normalizeTrack, scoreMatch, confidenceBadge, buildSearchLinks } = require('./match');

// remix token kept, artists split on comma
const n = normalizeTrack({ artist: 'Adam Ten, Asulin, Hot Since 82', title: 'Warawara - Hot Since 82 Remix' });
assert.deepStrictEqual(n.artistSet, ['adam ten', 'asulin', 'hot since 82']);
assert.strictEqual(n.baseTitle, 'warawara');
assert.match(n.version, /hot since 82 remix/i);

// parenthetical remix form
const p = normalizeTrack({ artist: 'Curol, 3030', title: 'Ogum (Curol Remix)' });
assert.strictEqual(p.baseTitle, 'ogum');
assert.match(p.version, /curol remix/i);

// "Original Mix" dropped from Beatport query, kept out; bandcamp track filter present
const l = buildSearchLinks({ artist: 'Damelo', title: 'Disco Cha Cha - Original Mix', version: 'original mix' });
assert.ok(l.beatport.includes('Damelo'), 'beatport has artist');
assert.ok(!/Original%20Mix/i.test(l.beatport), 'beatport drops Original Mix');
assert.ok(l.bandcamp.includes('item_type=t'), 'bandcamp track filter');
// but a real remix name stays in the query
const l2 = buildSearchLinks({ artist: 'Adam Ten', title: 'Warawara - Hot Since 82 Remix', version: 'hot since 82 remix' });
assert.ok(/Hot%20Since%2082%20Remix/i.test(l2.beatport), 'remix name kept in query');
// non-breaking space (Spotify artist strings) collapses to a normal space, never %C2%A0
const l3 = buildSearchLinks({ artist: 'Mita Gami, Rafael', title: 'What Is Luv - Extended Mix', version: 'extended mix' });
assert.ok(!/%C2%A0/.test(l3.beatport), 'non-breaking space normalized');
assert.ok(l3.beatport.includes('Mita%20Gami') && l3.beatport.includes('Rafael'), 'both artists present');

// scoring + badges
assert.ok(scoreMatch({ artist: 'X', title: 'Y' }, { artist: 'X', title: 'Y' }) > 0.95, 'identical ~1');
assert.ok(scoreMatch({ artist: 'X', title: 'Y' }, { artist: 'Q', title: 'Z' }) < 0.2, 'disjoint low');
// duration disambiguates same-name different-mix
const ext = { artist: 'A', title: 'Song - Extended Mix', durationMs: 420000 };
const rad = { artist: 'A', title: 'Song - Radio Edit', durationMs: 180000 };
assert.ok(scoreMatch(ext, { ...ext }) > scoreMatch(ext, rad), 'duration+version separates mixes');
assert.strictEqual(confidenceBadge(0.9), 'high');
assert.strictEqual(confidenceBadge(0.75), 'medium');
assert.strictEqual(confidenceBadge(0.4), 'low');

console.log('match.test OK — all assertions passed');
