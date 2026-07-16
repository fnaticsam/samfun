// Pure matching helpers for sam.toys/tracks. No I/O — Node-testable in isolation.
// Cross-platform track matching lives or dies on the mix/remix token, so we keep it
// as a first-class field rather than stripping it as "noise".

const ARTIST_SPLIT = /\s*,\s*|\s+&\s+|\s*\/\s*|\s+x\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+featuring\s+/i;
const VERSION_WORDS = /(original mix|extended mix|extended|radio edit|club mix|dub mix|instrumental|vip|re-?edit|edit|rework|remix|bootleg|mix)$/i;

function lc(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

// "Warawara - Hot Since 82 Remix" -> baseTitle "warawara", version "hot since 82 remix"
// "Disco Cha Cha (Curol Remix)"   -> baseTitle "disco cha cha", version "curol remix"
function splitTitleVersion(title) {
  let t = String(title == null ? '' : title).trim();
  let feat = '';
  const featM = t.match(/\s*[([]\s*(feat\.?|ft\.?|featuring)\s+([^)\]]+)[)\]]/i);
  if (featM) { feat = featM[2].trim(); t = t.replace(featM[0], '').trim(); }

  // Preferred delimiter: " - Mix" (Spotify/Beatport convention)
  const dash = t.split(/\s+-\s+/);
  if (dash.length > 1) {
    return { baseTitle: lc(dash[0]), version: lc(dash.slice(1).join(' - ')), feat: lc(feat) };
  }
  // Fallback: trailing "(… Remix/Mix/Edit)" parenthetical that looks like a version
  const paren = t.match(/^(.*?)\s*[([]\s*([^)\]]+?)\s*[)\]]\s*$/);
  if (paren && VERSION_WORDS.test(paren[2].trim())) {
    return { baseTitle: lc(paren[1]), version: lc(paren[2]), feat: lc(feat) };
  }
  return { baseTitle: lc(t), version: '', feat: lc(feat) };
}

function normalizeTrack({ artist, title } = {}) {
  const artistSet = String(artist == null ? '' : artist)
    .split(ARTIST_SPLIT)
    .map((a) => lc(a))
    .filter(Boolean);
  const { baseTitle, version, feat } = splitTitleVersion(title);
  return { artistSet, baseTitle, version, feat };
}

function tokens(s) {
  return new Set(lc(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean));
}
function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// score in [0,1]: 0.5 title + 0.35 artist-set overlap + 0.15 duration (±5s, decaying).
// If either duration is missing, its weight folds into title (still a valid comparison).
function scoreMatch(a, b) {
  const na = normalizeTrack(a);
  const nb = normalizeTrack(b);
  const title = jaccard(tokens(na.baseTitle + ' ' + na.version), tokens(nb.baseTitle + ' ' + nb.version));
  const artist = jaccard(new Set(na.artistSet), new Set(nb.artistSet));
  const da = a.durationMs, db = b.durationMs;
  let titleW = 0.5, artistW = 0.35, durW = 0.15, dur = 0;
  if (typeof da === 'number' && typeof db === 'number') {
    const diff = Math.abs(da - db) / 1000;
    dur = diff <= 5 ? 1 : Math.max(0, 1 - (diff - 5) / 30);
  } else {
    titleW += durW; durW = 0; // no duration signal -> lean on title
  }
  return +(titleW * title + artistW * artist + durW * dur).toFixed(4);
}

function confidenceBadge(score) {
  if (score >= 0.88) return 'high';
  if (score >= 0.70) return 'medium';
  return 'low';
}

// Always-works floor: deep-link SEARCH urls the user clicks (never scraped).
// Beatport treats "Original Mix" as implicit, so drop it from the query; keep remix names.
function isOriginal(version) { return /^original( mix)?$/i.test(String(version || '').trim()); }

function buildSearchLinks({ artist, title, version } = {}) {
  // \s collapses regular AND non-breaking spaces (Spotify artist strings use U+00A0)
  const clean = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const base = clean(String(title == null ? '' : title)
    .split(/\s+-\s+/)[0]
    .replace(/\s*[([][^)\]]*[)\]]\s*$/, ''));
  const v = version && !isOriginal(version) ? ' ' + clean(version) : '';
  const core = clean(`${artist || ''} ${base}`);
  const withV = clean(`${core}${v}`);
  return {
    beatport: `https://www.beatport.com/search?q=${encodeURIComponent(withV)}`,
    bandcamp: `https://bandcamp.com/search?q=${encodeURIComponent(core)}&item_type=t`,
    spotify: `https://open.spotify.com/search/${encodeURIComponent(withV)}`,
  };
}

module.exports = { normalizeTrack, splitTitleVersion, scoreMatch, confidenceBadge, buildSearchLinks };
