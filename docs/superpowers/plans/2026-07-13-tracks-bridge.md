# sam.toys/tracks Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `sam.toys/tracks` — paste a Spotify playlist → per-track direct Beatport/Bandcamp buy links; and turn Rekordbox tracks (XML export or screenshot) into Spotify track links — plus wire live-library MCP servers into Sam's Claude Code.

**Architecture:** Static `tracks/index.html` (vanilla, no build, follows the `voicenotes` pattern) + three Vercel serverless functions in `api/`. All cross-platform resolution runs **server-side** through Musicfetch (secret `x-token`) with a free Odesli fallback and store **search deep-links** as the always-works floor. The web toy uses **no Spotify login**; live/private/create operations live in a separate MCP path on Sam's laptop.

**Tech Stack:** HTML/CSS/vanilla JS (no framework, no bundler); Node.js Vercel functions (CommonJS `module.exports`, same as `api/transcribe.js`); Gemini `gemini-3.5-flash` vision; Musicfetch API; Odesli/Songlink API; MCP (`davehenke/rekordbox-mcp` via `uv`, `marcelmarais/spotify-mcp-server` via Node).

## Global Constraints

- Repo `fnaticsam/samfun`, Vercel project `sam-toys` (`.vercel/project.json`). Deploy: `vercel deploy --prod --yes` from repo root; read back the **public** prod URL (preview URLs 302 via SSO). Webhook is unreliable — always CLI deploy.
- No build step. One self-contained `tracks/index.html`. `<meta name="robots" content="noindex">`.
- Serverless functions: CommonJS `module.exports = async (req, res) => {}`; CORS allowlist regex `^https?:\/\/(sam\.toys|www\.sam\.toys|localhost(:\d+)?|127\.0\.0\.1(:\d+)?|sam-toys-[\w-]+\.vercel\.app)$`; warm-instance rate limiting; `res.setHeader('Cache-Control','no-store')`. Copy these guards verbatim from `api/transcribe.js`.
- Secrets are **server-only env vars**, never in client JS or `NEXT_PUBLIC_`-style: `MUSICFETCH_TOKEN` (new — Sam to provide from the 7-day trial), `GEMINI_API_KEY` (exists in prod, set 2026-07-13). Add `MUSICFETCH_TOKEN` to Vercel prod env before P1 Task 6.
- `.vercelignore` already blocks `*.md` — spec/plan/docs never deploy. Client base64 upload cap ~3 MB (Vercel 4.5 MB body limit).
- **Never scrape Beatport or Bandcamp.** Buy links come from Musicfetch/Odesli or a deep-link **search** URL only. No affiliate/commission claims in UI copy.
- **Git:** work on branch `feat/tracks` (never main). Commit locally per task; do **not** push or open a PR without Sam's explicit ask (his standing rule).
- **Before shipping (P4):** run an adversarial dynamic Workflow (Sam's non-negotiable rule) and a prod read-back.

---

## File structure

- `tracks/index.html` — Create. The whole UI: 3 input modes (paste / drop-XML / screenshot), result rows, bulk copy/CSV. Vanilla, inline `<style>` token block + `<script>` IIFE.
- `api/_lib/match.js` — Create. Pure functions: `normalizeTrack`, `scoreMatch`, `confidenceBadge`, `buildSearchLinks`. No I/O. Node-testable.
- `api/_lib/match.test.js` — Create. Plain-`node` assertions for `match.js`.
- `api/tracks-playlist.js` — Create. Reads a public Spotify playlist/track/album page → `{tracks:[...]}`.
- `api/tracks-resolve.js` — Create. Server-side resolver: Musicfetch (URL-lookup + search) → Odesli fallback → search links; consumes `_lib/match.js`.
- `api/tracks-ocr.js` — Create. Screenshot(s) → rows via Gemini vision.
- `vercel.json` — Modify. Add `maxDuration` for the three new functions.
- `docs/superpowers/…` — spec + this plan (already present).

---

## PHASE 1 — Forward web toy (paste Spotify → buy links)

### Task 1: Branch + page shell + vercel config

**Files:**
- Create: `tracks/index.html`
- Modify: `vercel.json`

**Interfaces:**
- Produces: a loadable static page with element IDs `#paste-url`, `#paste-go`, `#drop-zone`, `#shot-input`, `#results`; a JS namespace `window.TRACKS` (empty for now). Later tasks attach handlers.

- [ ] **Step 1: Create the branch**

```bash
cd ~/Code/sam.toys && git checkout -b feat/tracks
```

- [ ] **Step 2: Write `tracks/index.html` shell.** Copy the `voicenotes/index.html` head/reset/`:root` token approach, but a records/buy theme (dark, vinyl-warm accent e.g. `--accent:#1DB954`-adjacent but distinct, e.g. Beatport-lime `--accent:#01FF95` on `--bg:#0c0d10`). Include: `noindex`; a header ("Tracks — buy what you stream, find what you spin"); a **mode switcher** (Paste / Drop XML / Screenshot); the paste input (`#paste-url` + `#paste-go`), a drag `#drop-zone`, a hidden `<input type=file id=shot-input accept="image/*" multiple>`; an empty `#results` list; a footer note that buy links open the store and nothing is scraped. Add `<script>const TRACKS={};</script>` placeholder.

- [ ] **Step 3: Add function config to `vercel.json`:**

```json
{
  "functions": {
    "api/transcribe.js": { "maxDuration": 60 },
    "api/tracks-playlist.js": { "maxDuration": 30 },
    "api/tracks-resolve.js": { "maxDuration": 60 },
    "api/tracks-ocr.js": { "maxDuration": 60 }
  }
}
```

- [ ] **Step 4: Verify locally.** Run `npx serve ~/Code/sam.toys` (or open the file) and confirm the page renders, the mode switcher toggles the three input areas, no console errors.

- [ ] **Step 5: Commit** `git add tracks/index.html vercel.json && git commit -m "tracks: page shell + fn config"`

---

### Task 2: `api/tracks-playlist.js` — read a public Spotify playlist

**Files:**
- Create: `api/tracks-playlist.js`

**Interfaces:**
- Produces: `POST /api/tracks-playlist` body `{url}` → `200 {kind:'playlist'|'track'|'album', name, tracks:[{artist, title, spotifyId, spotifyUrl, durationMs, isrc}]}` (`isrc` may be `null`). Errors as `{error}` with status, same shape as `transcribe.js`.

- [ ] **Step 1: Implement the reader.** Parse the Spotify ID from any `open.spotify.com/{playlist|track|album}/{id}` or `spotify:` URI. Fetch the **embed** page `https://open.spotify.com/embed/{kind}/{id}` and extract the JSON island (`<script id="__NEXT_DATA__">…</script>` → `props.pageProps.state.data.entity` / `trackList`, or the newer resource blob). Map each entry to the output shape (`title` from the entry name incl. any "- Extended Mix" suffix; `artist` from joined subtitle/artist array). Paginate playlists if the embed truncates (fall back to the anonymous-token web endpoint `https://api.spotify.com/... ` only if the embed is incomplete — bootstrap the anon token from `https://open.spotify.com/get_access_token`). Keep this parser **isolated** — it's the only ToS-gray surface. Reuse the CORS/rate-limit/`no-store` guards from `transcribe.js`.

- [ ] **Step 2: Verify with Sam's example playlist:**

```bash
curl -s -X POST http://localhost:3000/api/tracks-playlist \
  -H 'content-type: application/json' \
  -d '{"url":"https://open.spotify.com/playlist/3Qv58hdw0G2icgyfEsBQt0"}' | python3 -m json.tool | head -40
```
Expected: `kind:"playlist"`, ~19 tracks, first = `What Is Luv - Extended Mix` / `Mita Gami, Rafael`, mix suffixes preserved. (Run via `vercel dev` for local functions.)

- [ ] **Step 3: Verify a single-track URL and a bad URL** return sensible `{kind:'track',…}` and a `400 {error}` respectively.

- [ ] **Step 4: Commit** `git commit -am "tracks: public Spotify playlist reader"`

---

### Task 3: `api/_lib/match.js` — the matching brain (pure, Node-tested)

**Files:**
- Create: `api/_lib/match.js`, `api/_lib/match.test.js`

**Interfaces:**
- Produces:
  - `normalizeTrack({artist,title}) → {artistSet:string[], baseTitle, version, feat}` — splits multi-artist on `/ & , x feat. ft.`; extracts mix/version token (`Original Mix|Extended Mix|Radio Edit|Club Mix|VIP|<name> Remix|<name> Edit`) into `version`; pulls `(feat. …)` into `feat`; leaves `version` in place (never discarded).
  - `scoreMatch(a, b) → number` in [0,1] = `0.5*tokenSet(baseTitle) + 0.35*artistOverlap + 0.15*durationMatch` (durationMatch=1 within ±5s, decaying; if either duration missing, redistribute its weight to title).
  - `confidenceBadge(score) → 'high'|'medium'|'low'` (≥0.88 high, ≥0.70 medium, else low).
  - `buildSearchLinks({artist,title,version}) → {beatport, bandcamp, spotify}` deep-link search URLs (Beatport drops a literal "Original Mix"; Bandcamp `&item_type=t`; Spotify `open.spotify.com/search/…`). All `encodeURIComponent`-safe.

- [ ] **Step 1: Write the failing tests** in `api/_lib/match.test.js`:

```js
const assert = require('node:assert');
const { normalizeTrack, scoreMatch, confidenceBadge, buildSearchLinks } = require('./match');

// remix token kept, artists split
const n = normalizeTrack({ artist: 'Adam Ten, Asulin, Hot Since 82', title: 'Warawara - Hot Since 82 Remix' });
assert.deepStrictEqual(n.artistSet, ['adam ten','asulin','hot since 82']);
assert.strictEqual(n.baseTitle, 'warawara');
assert.match(n.version, /hot since 82 remix/i);

// original mix dropped from beatport query, kept in bandcamp/spotify text is fine
const l = buildSearchLinks({ artist: 'Damelo', title: 'Disco Cha Cha - Original Mix', version: 'original mix' });
assert.ok(l.beatport.includes('Damelo') && !/Original%20Mix/i.test(l.beatport));
assert.ok(l.bandcamp.includes('item_type=t'));

// scoring + badges
assert.ok(scoreMatch({artist:'X',title:'Y'},{artist:'X',title:'Y'}) > 0.95);
assert.strictEqual(confidenceBadge(0.9),'high');
assert.strictEqual(confidenceBadge(0.75),'medium');
assert.strictEqual(confidenceBadge(0.4),'low');
console.log('match.test OK');
```

- [ ] **Step 2: Run to verify it fails:** `node api/_lib/match.test.js` → Expected: `Cannot find module './match'` / assertion error.
- [ ] **Step 3: Implement `api/_lib/match.js`** with the four functions per the Interfaces block (pure, no I/O; use a small token-set ratio — Jaccard over word sets — no external deps).
- [ ] **Step 4: Run to verify it passes:** `node api/_lib/match.test.js` → Expected: `match.test OK`.
- [ ] **Step 5: Commit** `git commit -am "tracks: matching brain + node tests"`

---

### Task 4: `api/tracks-resolve.js` — resolver (Odesli + search links; NO Musicfetch yet)

**Files:**
- Create: `api/tracks-resolve.js`

**Interfaces:**
- Produces: `POST /api/tracks-resolve` body `{direction:'buy'|'find', tracks:[{artist,title,spotifyUrl?,isrc?,durationMs?}]}` → `200 {results:[{input, confidence, links:{beatport?,bandcamp?,spotify?}, source:'odesli'|'search'}]}`. This task ships the **token-free** path so the toy works before Musicfetch exists.

- [ ] **Step 1: Implement resolve (buy direction).** For each track: if `spotifyUrl` present, call **Odesli** `GET https://api.song.link/v1-alpha.1/links?url={enc(spotifyUrl)}&userCountry=GB` → read `linksByPlatform.bandcamp?.url` (+ any store Odesli returns). Always compute `buildSearchLinks(...)` from `_lib/match.js` and use them as the floor: `links.beatport = odesliBeatport || searchLinks.beatport` (Odesli usually has no Beatport → Beatport starts as a **search** link here; Musicfetch upgrades it in Task 6), `links.bandcamp = odesli.bandcamp || searchLinks.bandcamp`. `source` reflects whichever won. `confidence='high'` when Odesli resolved the exact recording, else `'medium'`/search. Guards from `transcribe.js`. Respect Odesli 10 req/min: small concurrency limit + brief backoff on 429.
- [ ] **Step 2: Implement resolve (find direction).** For each `{artist,title}` (no Spotify URL): compute `searchLinks.spotify` as the floor; (Musicfetch search added Task 6/9 to upgrade to a direct track link). Return `links.spotify`, `confidence` from `confidenceBadge` when a direct match later exists, else `'low'` + search link.
- [ ] **Step 3: Verify buy direction** with two tracks incl. a remix:

```bash
curl -s -X POST http://localhost:3000/api/tracks-resolve -H 'content-type: application/json' -d '{
 "direction":"buy",
 "tracks":[{"artist":"Adam Ten, Asulin, Hot Since 82","title":"Warawara - Hot Since 82 Remix","spotifyUrl":"https://open.spotify.com/track/PLACEHOLDER"}]
}' | python3 -m json.tool
```
Expected: a `links.beatport` (search URL), `links.bandcamp` (Odesli or search), `source` set, no crash on Odesli miss.

- [ ] **Step 4: Commit** `git commit -am "tracks: resolver (Odesli + search-link floor)"`

---

### Task 5: Wire the forward flow in `index.html`

**Files:**
- Modify: `tracks/index.html`

**Interfaces:**
- Consumes: `POST /api/tracks-playlist`, `POST /api/tracks-resolve`.

- [ ] **Step 1: Implement paste flow.** On `#paste-go`: POST the URL to `/api/tracks-playlist`; render a skeleton row per track; POST all tracks `{direction:'buy'}` to `/api/tracks-resolve` (chunk to ~20/tracks per call); fill each row with `Artist — Title (version)`, a **confidence badge** (green/amber/grey), **[Buy on Beatport]**, **[Bandcamp]**, **[▶ Spotify]** buttons (each `target=_blank rel=noopener`), and a subtle "not right? search instead" that swaps to the search link. Add **Copy all links** and **Export CSV** buttons. Escape all injected text (reuse `esc()` from `voicenotes`).
- [ ] **Step 2: Verify end-to-end in a browser** against Sam's example playlist via `vercel dev`: all ~19 rows render with working Beatport (search) + Bandcamp + Spotify links and confidence badges; remix names visible; Copy/CSV work.
- [ ] **Step 3: Playwright screenshot check** (headless) — capture the results state; confirm layout on mobile width (390px) and desktop.
- [ ] **Step 4: Commit** `git commit -am "tracks: forward flow UI (paste → buy links)"`

---

### Task 6: Musicfetch direct links (behind the token gate) — §7 live check

**Files:**
- Modify: `api/tracks-resolve.js`

**Interfaces:**
- Consumes: env `MUSICFETCH_TOKEN`. Upgrades `links.beatport`/`links.bandcamp` (buy) and `links.spotify` (find) from **search** to **direct** when Musicfetch resolves.

- [ ] **Step 1: LIVE GATE (do first, with the trial token).** With `MUSICFETCH_TOKEN` set, curl the real API on 5 of Sam's tracks (incl. the Hot Since 82 remix) via **URL lookup** and confirm the response actually contains Beatport (and Bandcamp) direct URLs, and note the price/limits from the dashboard:

```bash
curl -s 'https://api.musicfetch.io/url?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F<ID>&services=beatport,bandcamp,spotify' -H "x-token: $MUSICFETCH_TOKEN" | python3 -m json.tool
```
**Decision:** if Beatport direct URLs are reliably present → Musicfetch is primary for Beatport. If weak/absent → keep Beatport as the **search** link (Task 4) and downgrade Musicfetch to opportunistic. Record the outcome in the spec's §7.

- [ ] **Step 2: Integrate URL-lookup (buy).** When `spotifyUrl` present and token set: call Musicfetch URL-lookup, map `beatport`/`bandcamp`/`spotify` direct URLs over the search-link floor; `source='musicfetch'`, `confidence='high'` (same-recording, per spec §4.6). Cache by `spotifyId`/`isrc` in a warm-instance `Map` to avoid re-paying. Fail soft to Odesli/search on any Musicfetch error/timeout.
- [ ] **Step 3: Integrate search (find).** For `{artist,title}` with no URL: call Musicfetch **search** (`services=spotify`) with the normalized query; take the top Spotify result, score it with `_lib/match.js` against the input, attach `links.spotify` (direct) + real `confidence` badge; fall back to the Spotify search link on miss/low.
- [ ] **Step 4: Re-verify** the buy curl from Task 4 Step 3 now returns **direct** Beatport/Bandcamp URLs (if the gate passed) with `source:"musicfetch"`; confirm no token leaks to the client (grep the served HTML/JS for the token — must be absent).
- [ ] **Step 5: Commit** `git commit -am "tracks: Musicfetch direct-link resolution (gated)"`

---

## PHASE 2 — Reverse web toy (Rekordbox → Spotify links)

### Task 7: `rekordbox.xml` drop parser (client-side)

**Files:**
- Modify: `tracks/index.html`

**Interfaces:**
- Produces: on XML drop, `rows:[{artist,title,version,bpm,key,label,genre,confidence:'high'}]` → POST `{direction:'find'}` to `/api/tracks-resolve` → render Spotify-link rows.

- [ ] **Step 1: Implement XML parse.** On drop into `#drop-zone`, read the file, `DOMParser` the XML, select `COLLECTION > TRACK`, map attributes `Artist,Name,Remixer,AverageBpm,Tonality,Label,Genre` → rows (tag `confidence:'high'` — exact data). Reuse `voicenotes` drag-drop handlers. Then run the find flow (render `Artist — Title`, original **BPM/key** chip, **[▶ Open in Spotify]**, badge).
- [ ] **Step 2: Verify** with a real exported `rekordbox.xml` (Sam to export via `File → Export Collection in xml format`, or use a small hand-made fixture): rows populate with correct artist/title/BPM/key and Spotify links resolve.
- [ ] **Step 3: Commit** `git commit -am "tracks: rekordbox.xml drop → Spotify links"`

---

### Task 8: `api/tracks-ocr.js` — screenshot → rows (Gemini vision)

**Files:**
- Create: `api/tracks-ocr.js`

**Interfaces:**
- Produces: `POST /api/tracks-ocr` body `{images:[{data,mime}]}` (base64) → `200 {rows:[{artist,title,remixer,bpm,key,label,genre}]}` (nulls for illegible cells).

- [ ] **Step 1: Implement.** Mirror `api/transcribe.js` structure (guards, key check, timeout) but with image parts + a strict `responseSchema` (array of the row object) and `media_resolution:'high'`. Prompt (verbatim discipline): *"Extract every track row from these Rekordbox screenshot(s) into JSON. Output exactly what is visible — use null for any cell not clearly legible. Do NOT infer, autocomplete, normalize, or fix text. Preserve exact mix labels (Extended Mix / Original Mix / X Remix). De-duplicate rows repeated across overlapping screenshots."* Accept multiple images in one request.
- [ ] **Step 2: Verify** with a real Rekordbox screenshot:

```bash
# base64 a screenshot and POST it
IMG=$(base64 -i ~/Desktop/rb-shot.png); curl -s -X POST http://localhost:3000/api/tracks-ocr -H 'content-type: application/json' -d "{\"images\":[{\"data\":\"$IMG\",\"mime\":\"image/png\"}]}" | python3 -m json.tool | head -30
```
Expected: rows with legible artist/title/BPM/key; illegible cells `null`, not hallucinated.

- [ ] **Step 3: Commit** `git commit -am "tracks: Rekordbox screenshot OCR via Gemini"`

---

### Task 9: Screenshot flow wiring + lower-confidence tagging

**Files:**
- Modify: `tracks/index.html`

- [ ] **Step 1: Wire screenshot mode.** On `#shot-input`/drop of images: client base64-encode (≤3 MB each, reuse `voicenotes` chunked encoder), POST to `/api/tracks-ocr`, then feed rows to the find flow. Tag all screenshot-derived rows with a visible **"OCR — verify"** lower-confidence marker regardless of match score (per spec §4.4).
- [ ] **Step 2: Verify** end-to-end in browser: screenshot → rows → Spotify links, with the OCR-verify tag present.
- [ ] **Step 3: Commit** `git commit -am "tracks: screenshot → Spotify links flow"`

---

## PHASE 3 — MCP live-library path (Sam's laptop; independent of P1/P2)

### Task 10: rekordbox-mcp in Sam's Claude Code

**Files:** (no repo files — local machine + Claude Code MCP config)

- [ ] **Step 1: BACK UP the Rekordbox library first** (the server requires it): copy `~/Library/Pioneer/rekordbox` to a dated backup folder. Confirm the copy.
- [ ] **Step 2: Install.** `git clone https://github.com/davehenke/rekordbox-mcp ~/Code/rekordbox-mcp && cd ~/Code/rekordbox-mcp && uv sync`. Ensure `uv` + Python 3.12+ present.
- [ ] **Step 3: Configure** in Sam's Claude Code MCP settings: `{"mcpServers":{"rekordbox-database":{"command":"uv","args":["run","rekordbox-mcp"],"cwd":"/Users/sammathews/Code/rekordbox-mcp"}}}`.
- [ ] **Step 4: Smoke test** (Rekordbox open, read-only): ask Claude to search the library by BPM/key and return 5 tracks; confirm real results. Note: write tools need Rekordbox closed.
- [ ] **Step 5:** Record the working config + the master.db-key/personal-use caveat in a local note (not the public repo).

---

### Task 11: Spotify MCP in Sam's Claude Code (Feb-2026 verified)

**Files:** (local machine + Claude Code MCP config)

- [ ] **Step 1: Install** `marcelmarais/spotify-mcp-server` (`git clone`, `npm i`, `npm run build`). Create a Spotify dev app (Sam's account, Premium; add himself as the sole test user). Set client id/secret + redirect URI.
- [ ] **Step 2: OAuth** via `npm run auth`; confirm `spotify-config.json` tokens written + auto-refresh.
- [ ] **Step 3: VERIFY Feb-2026 endpoints.** Test create-playlist + add-tracks. If they 404/400, patch the server to `POST /v1/me/playlists` and `POST /v1/playlists/{id}/items` (fork locally). Confirm search + read-own-playlists work.
- [ ] **Step 4: Configure** in Claude Code MCP settings (`command:node, args:[".../build/index.js"]`).
- [ ] **Step 5: Smoke test** the bridge: with both MCPs live, ask Claude to "match my 'Warm-up' crate to Spotify and give me the links" — confirm end-to-end over live data.

---

## PHASE 4 — Adversarial review + ship

### Task 12: Adversarial dynamic Workflow (Sam's non-negotiable gate)

- [ ] **Step 1: Run** an adversarial dynamic Workflow over the three functions + `index.html`, panels for: **secret-leak** (MUSICFETCH_TOKEN/GEMINI_API_KEY never reach client; CORS/rate-limit intact), **data-loss/idempotency** (chunking, dedupe, cache correctness), **input abuse/edge-cases** (huge playlist, non-Spotify URL, corrupt XML, non-track screenshot, Odesli 429, Musicfetch timeout), **ToS posture** (no store scraping; playlist reader isolated), **perf** (concurrency, function duration). Scale the panel to blast radius.
- [ ] **Step 2: Fix** every confirmed finding; re-verify the specific curl/browser check for each.
- [ ] **Step 3: Commit** `git commit -am "tracks: adversarial-review fixes"`

### Task 13: Deploy + prod read-back

- [ ] **Step 1: Ensure** `MUSICFETCH_TOKEN` is in Vercel prod env (`vercel env add` / dashboard); `GEMINI_API_KEY` already set.
- [ ] **Step 2: Preview deploy** first (`vercel deploy`), smoke the functions, then `vercel deploy --prod --yes`.
- [ ] **Step 3: Read back the PUBLIC prod URL** `https://sam.toys/tracks` → 200 (not SSO 302). Run Sam's example playlist live end-to-end; confirm direct/search buy links + a screenshot + an XML file all work on prod.
- [ ] **Step 4:** Report completion (full summary + URL). Merge/push only if Sam asks.

---

## Self-review (plan vs spec)

- **Spec coverage:** §4.1 UI→Tasks 1/5/7/9; §4.2 playlist read→Task 2; §4.3 resolver→Tasks 4/6; §4.4 OCR→Task 8; §4.5 XML→Task 7; §4.6 matching→Task 3 (+ two-regime confidence applied in 4/6/9); §4.7 MCP→Tasks 10/11; §6 ToS→Global Constraints + Task 2 isolation + Task 12; §7 cost gate→Task 6 Step 1; §8 verification→per-task cur/browser + Task 12/13; §9 phasing→Phases 1–4. No gaps.
- **Placeholder scan:** the only "PLACEHOLDER" strings are literal curl track-ID stand-ins the executor substitutes at run time — intended, not plan gaps. Musicfetch pricing is a gated live-check (Task 6 Step 1), not an unresolved TODO.
- **Type consistency:** `normalizeTrack/scoreMatch/confidenceBadge/buildSearchLinks` names match across Tasks 3/4/6/9; resolve I/O shape `{direction,tracks[]}→{results[]}` consistent; playlist output shape consumed unchanged by resolve.

## Dependencies I need from Sam (external blockers)
1. **Musicfetch trial token** → unblocks Task 6 (P1 ships token-free up to Task 5 without it).
2. **Go-ahead + a Rekordbox library backup** for the MCP install (Tasks 10–11), which run on your laptop.
3. (Optional) an exported `rekordbox.xml` and a Rekordbox screenshot as test fixtures for Tasks 7–9.
