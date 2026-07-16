# sam.toys/tracks — Spotify ⇄ Beatport/Bandcamp/Rekordbox bridge

**Status:** design (awaiting Sam's approval) · **Date:** 2026-07-13 · **Slug:** `sam.toys/tracks`

## 1. What it is

A two-way bridge between the streaming world and the "own the file" DJ world.

- **Forward (buy):** paste a Spotify playlist → get a per-track **direct buy link** on Beatport (primary) and Bandcamp (secondary), each with a match-confidence badge.
- **Reverse (find):** take DJ tracks you already own — a **Rekordbox screenshot** (anywhere) or an exported **`rekordbox.xml`** (laptop) — and get matched **Spotify track links** so you can preview/collect them.
- **Power path (laptop, live):** MCP servers wired into Sam's Claude Code so he can query his **live** Rekordbox library and Spotify account conversationally, with no export step.

Validated market gap (deep dive, 2026-07-13): incumbents (Soundiiz, TuneMyMusic, Crate Hackers, RemixRotation) do generic playlist transfers but **none** does remix-version-aware DJ matching + direct buy links + a Rekordbox flow.

### Locked product decisions (Sam, 2026-07-13)
1. **Buy links = free store search deep-links.** ~~Musicfetch direct links~~ **dropped 2026-07-13** — $50/mo not worth it; Odesli verified (live) to return no Beatport/Bandcamp for this genre + its 10/min free limit makes per-track playlist calls impractical. Beatport + Bandcamp **search** deep-links per track; each store's own search resolves the exact `artist+title+mix`. Optional future $0 upgrade: apply for Beatport's gated partner API → direct links if approved.
2. **Reverse = matched Spotify track links only** (Spotify **search** deep-link per track; no playlist auto-create, no Spotify OAuth in the web toy).
3. **MCP live-library path = set up this round** (rekordbox-mcp **DONE + live**; spotify-mcp prepped, pending Sam's dev-app creds), alongside the web toy.
4. Default read posture: **read any pasted playlist via its public page** (Sam did not object to the ToS-gray note).

**Architecture impact of dropping Musicfetch:** no `MUSICFETCH_TOKEN`, no `api/tracks-resolve.js`, no vendor/cost. Link-building is **pure client-side** logic (mirrors `api/_lib/match.js`). The toy now needs only **two** server functions: `api/tracks-playlist.js` (public read) and `api/tracks-ocr.js` (screenshot). See §4.3.

## 2. The two front doors (and the laptop split)

| | Web toy — `sam.toys/tracks` (works anywhere) | MCP path — Sam's Claude Code (laptop only) |
|---|---|---|
| Forward (buy) | Paste Spotify link → Beatport/Bandcamp direct links | "Find Beatport links for the tracks in playlist X" |
| Reverse (find) | Screenshot **or** drag-in `rekordbox.xml` → Spotify links | "Build/collect a Spotify playlist from my crate 'Warm-up'" |
| Spotify auth | **None** (public-page read + Musicfetch server-side) | Sam's own OAuth (his account, his playlists) |
| Rekordbox source | Exported XML (laptop) or screenshot OCR (anywhere) | **Live** `master.db` via rekordbox-mcp |
| Data accuracy | XML = exact; OCR = lower-confidence | Exact, live, incl. BPM/key/play-count/history |

The **laptop gate for the reliable Rekordbox path is intrinsic**: you export `rekordbox.xml` (or run the MCP) on the machine where Rekordbox lives. Nothing artificial is enforced.

## 3. Why these mechanisms (deep-dive findings, adversarially verified)

- **Spotify API is locked down (Feb/Mar 2026).** Official reads of *other people's* playlists are dead; Client Credentials returns 403 on playlist items. Only a user's **own** playlists are readable, and only via an OAuth'd Dev-Mode app whose owner has Premium (≤5 test users). → Web toy avoids this entirely by reading the **public playlist/embed page** and doing all resolution through Musicfetch. The own-account/private stuff is delegated to the **MCP path**.
- **No usable Beatport or Bandcamp catalog API.** Beatport v4 is partner-gated ("apply and hope"), scraping is Cloudflare-blocked; Bandcamp has no catalog API and `robots.txt` disallows `/search` + `/api/` (and names ClaudeBot). → We **never scrape** either store. Buy links come from **Musicfetch** (which holds its own commercial relationships) or, failing that, a **deep-link search URL** the user clicks.
- **The reliable Rekordbox path is the XML export, not OCR or the live DB.** `File → Export Collection in xml format` yields typed fields (Name, Artist, AverageBpm, Tonality/key, Label, Remixer, Genre) with zero OCR error and **zero decryption**. Reading `master.db` relies on a *leaked* SQLCipher key (plausible DMCA/ToS exposure) and broke in Rekordbox 6.6.5+ → **excluded from the shipped web toy**; only used in the MCP path on Sam's own machine/own library (personal use).
- **Mix/remix name is signal, not noise.** It lives inside the track title string on every platform and is often the deciding factor between two candidates. Normalization keeps it as a first-class field.

## 4. Components

### 4.1 `tracks/index.html` (static, vanilla — follows the `voicenotes` pattern)
Single self-contained file: `:root` design tokens, no build step, `noindex`. Three modes in one page:
- **Paste mode:** a Spotify playlist/track URL field → results list.
- **Drop mode:** drag a `rekordbox.xml` (or `.txt`/`.m3u8`) → results list. (Reuses `voicenotes` drag-drop.)
- **Screenshot mode:** drag/choose a Rekordbox screenshot (or multiple) → results list.

Result row (forward): `Artist — Title (Mix)` · **confidence badge** · **[Buy on Beatport]** (direct if resolved, else search) · **[Bandcamp]** (search/direct) · **[▶ Spotify]**.
Result row (reverse): `Artist — Title (Mix)` · **[▶ Open in Spotify]** (direct track if resolved, else Spotify search) · confidence badge · original BPM/key shown when present.
Bulk actions: **Copy all links**, **Export CSV**, per-row "not the right match?" → opens the store/Spotify search instead.

### 4.2 `api/tracks-playlist.js` (Vercel function) — enumerate a Spotify playlist
- Input: a Spotify playlist or track URL/URI.
- Reads the **public embed page** `https://open.spotify.com/embed/playlist/{id}` and parses its structured JSON (`__NEXT_DATA__` / web resource blob) → `[{artist, title, spotifyId, spotifyUrl, durationMs, isrc?}]`. Bootstraps an anonymous web token if required (same mechanism the embed player uses).
- Handles single-track and album URLs too.
- **ToS note:** unofficial/gray, personal use. Isolated here so it can be swapped for official OAuth later without touching the rest.

### 4.3 Link resolution — **client-side** (Musicfetch/`tracks-resolve.js` cut 2026-07-13)
No server resolver, no token, no cost. After the playlist read (forward) or XML/OCR parse (reverse), the **browser** builds the links directly with an inline copy of `buildSearchLinks`/`normalizeTrack` (same logic as `api/_lib/match.js`, §4.6): Beatport + Bandcamp **search** URLs (forward), Spotify **search** URL (reverse). Because these are searches, there is no per-link "match confidence" for the forward path — the affordance is simply "opens the store's search for this exact track." (OCR rows still carry an "OCR — verify" data-quality tag, §4.4.)

<details><summary>superseded original (Musicfetch server resolver)</summary>

- Holds the **`MUSICFETCH_TOKEN`** secret (env var, server-only).
- **Forward:** for each track, **URL lookup** (`GET https://api.musicfetch.io/url?url={spotifyTrackUrl}&services=beatport,bandcamp,spotify` with `x-token`) → collect Beatport/Bandcamp direct URLs.
- **Reverse:** **search** (`GET https://api.musicfetch.io/search?...&services=spotify`) with normalized `artist title (mix)` → best Spotify track → its URL.
- **Fallbacks / cost control:**
  - **Odesli** (`GET https://api.song.link/v1-alpha.1/links?url=...`) free tier for Bandcamp/streaming cross-links and as a Musicfetch-miss backup.
  - **Search deep-link** always available when nothing resolves: Beatport `https://www.beatport.com/search?q={enc(artist title mix)}` (drop the literal "Original Mix"), Bandcamp `https://bandcamp.com/search?q={enc(artist title)}&item_type=t`, Spotify `https://open.spotify.com/search/{enc(artist title)}`.
  - **Cache** resolutions by ISRC / Spotify ID (in-function warm cache like `transcribe.js`, optional KV later) to avoid re-paying Musicfetch and re-hitting rate limits. (Caching aggregator data is fine — it is not Spotify Content.)
- Reuses the `transcribe.js` guardrails: CORS allowlist to `sam.toys`, warm-instance rate limit, `Cache-Control: no-store` on the response.

</details>

### 4.4 `api/tracks-ocr.js` (Vercel function) — screenshot → rows (reuses `GEMINI_API_KEY`)
- Input: one or more base64 screenshots (client-encoded, ≤~3 MB each, like `voicenotes`).
- Calls `gemini-3.5-flash` (vision) with a **strict `responseSchema`**: `[{artist, title, remixer, bpm, key, label, genre}]`, `media_resolution: high`.
- **Prompt discipline (critical):** "Output exactly what is visible. Use null for any cell not clearly legible. Do NOT infer, autocomplete, normalize, or fix text. Preserve exact mix labels (Extended Mix / Original Mix / X Remix). De-duplicate rows repeated across overlapping screenshots." Screenshot-derived rows are tagged **lower confidence** in the UI.
- Multiple screenshots → one request (well under Gemini's caps), no stitching.

### 4.5 `rekordbox.xml` parser (client-side, in `index.html`)
- Parse `<TRACK>` nodes → `{artist:@Artist, title:@Name, remixer:@Remixer, bpm:@AverageBpm, key:@Tonality, label:@Label, genre:@Genre}`. Zero OCR error; rows tagged **high confidence**. Then hand to `api/tracks-resolve.js`.

### 4.6 The matching brain (shared, in `api/tracks-resolve.js`)
**Two confidence regimes.** A Musicfetch **URL-lookup** (paste-a-playlist forward path) resolves the *same recording* across services — those Beatport/Bandcamp links are **HIGH by construction** (the only question is resolved-vs-not). The fuzzy scoring below applies to the **text-search paths**: reverse (OCR/XML `artist+title` → Spotify) and any forward match where we only have text, not a Spotify URL.

Normalization before any search/lookup:
1. Lowercase; split multi-artist on `/ & , x feat. ft.` into an artist-set.
2. Extract mix/version token (`Original Mix`, `Extended Mix`, `Radio Edit`, `Club Mix`, `VIP`, `<name> Remix`) into a separate `version` field — **kept, weighted, never discarded**.
3. Strip `(feat. …)` into a feature field; strip label/catalog noise.
Scoring (when we must pick among candidates): `0.5·token_set(title) + 0.35·artist_set_overlap + 0.15·duration_match(±5s→decay)`; ISRC exact match short-circuits to HIGH (but still duration-sanity-checked, since extended mixes sometimes reuse an ISRC).
Badges: **HIGH ≥ ~0.88**, **MEDIUM 0.70–0.88** (show "verify"), **LOW / no-match** → present the search deep-link, not a false direct link. (Thresholds are our heuristic; documented for tuning.)

### 4.7 MCP path (laptop, one-time setup)
- **rekordbox-mcp** (`davehenke/rekordbox-mcp`): `git clone`, `uv sync`, config block in Sam's Claude Code MCP settings (`command: uv, args:[run, rekordbox-mcp], cwd:…`). **Back up the Rekordbox library first** (the server itself insists). Read tools work with Rekordbox open; playlist-write tools need it closed. 31 tools (search by BPM/key/rating, stats, DJ history, create/import playlists).
- **Spotify MCP** (`marcelmarais/spotify-mcp-server` or a Feb-2026-current fork): `npm i && npm run build && npm run auth` (Sam's own Spotify dev app; his account is the test user; Premium). **Verify/patch the create-playlist + add-items calls against the Feb-2026 endpoints** (`POST /me/playlists`, `POST /playlists/{id}/items`) before relying on writes; search + read-own-playlists should already work.
- Result: in Claude Code Sam can say "match my 'Warm-up' crate to Spotify and give me the links" or "find Beatport buy links for everything in playlist X" over **live** data — the reliable superset of the web toy.
- **Legal note:** rekordbox-mcp decrypts `master.db` with a known key — acceptable for Sam's personal use on his own library on his own machine; it is deliberately **not** part of the shipped public web toy.

## 5. Architecture & data flow

```
WEB TOY (no Spotify login)
  Paste playlist ──▶ api/tracks-playlist  ──▶ [tracks w/ spotifyId]
                                                     │
  Drop rekordbox.xml ─(client parse)────────────────┤
  Screenshot ──▶ api/tracks-ocr (Gemini) ───────────┤
                                                     ▼
                                        api/tracks-resolve (Musicfetch x-token, server-side)
                                          ├─ forward: URL-lookup → Beatport/Bandcamp direct links
                                          ├─ reverse: search → Spotify track link
                                          ├─ fallback: Odesli (free) then store/Spotify search deep-link
                                          └─ cache by ISRC/spotifyId
                                                     ▼
                                        result rows + confidence badges (index.html)

MCP PATH (laptop, Sam's Claude Code) — live
  rekordbox-mcp  ◀──▶  Claude  ◀──▶  spotify-mcp   (his account, create playlists, search)
```

Vercel: static file + 3 functions (well within 4.5 MB body / 300 s). Env: **`MUSICFETCH_TOKEN`** (new, server-only), **`GEMINI_API_KEY`** (existing). `vercel.json` gets `maxDuration` for the OCR/resolve functions. Deploy: `vercel deploy --prod --yes` from repo root (webhook unreliable), then read back the public prod URL.

## 6. ToS / legal posture (explicit)
- **Clean:** store **deep-link search** buttons (a normal hyperlink); **Musicfetch/Odesli** (licensed aggregators); **`rekordbox.xml`** you exported yourself; the **MCP path** over your own account/library on your own machine.
- **Gray (personal-use, isolated in `api/tracks-playlist.js`):** reading a public Spotify playlist page. Swappable for official OAuth later.
- **Excluded:** scraping Beatport/Bandcamp; decrypting `master.db` in the shipped web toy; representing buy links as commission-earning (no verified affiliate program exists — no such claims in the UI).

## 7. Cost model — **$0/month**
- **Buy/find links:** free — pure client-built store **search** deep-links (no API, no token, no rate limit). Musicfetch ($50/mo) rejected; Odesli dropped (no Beatport/Bandcamp for this genre + 10/min limit).
- **Gemini OCR:** existing `GEMINI_API_KEY`; ~1.5–2k tokens per screenshot — negligible.
- Only ongoing cost is the existing Gemini usage on the screenshot path.

## 8. Verification plan (per Sam's "make no mistakes" rule)
1. **Live Musicfetch check** (trial token) on 5 known tracks incl. a remix — confirm Beatport/Bandcamp direct URLs + response shape. Gate as in §7.
2. **OCR eval:** 10–15 real Rekordbox screenshots (dark UI, dense) with hand-checked ground truth → measure field accuracy; tune prompt/`media_resolution`; confirm lower-confidence tagging is honest.
3. **Matching eval:** run Sam's example playlist ("BM lil tease", 19 tracks incl. Hot Since 82 / Mita Gami remixes) end-to-end; eyeball each badge; confirm no confident-but-wrong direct links.
4. **Adversarial dynamic Workflow** before ship (data-loss/idempotency/edge-cases/security+perf on the functions; secret-leak check that `MUSICFETCH_TOKEN` never reaches the client).
5. **MCP smoke test:** rekordbox-mcp search over Sam's live library; spotify-mcp search + a throwaway playlist create (verifying the Feb-2026 endpoints).
6. Deploy → read back prod URL (200, not the SSO 302) and run one real playlist through the live site.

## 9. Phasing
- **P1 — Forward web toy:** paste → Beatport/Bandcamp direct links + confidence. (Highest value, the core ask.)
- **P2 — Reverse web toy:** `rekordbox.xml` drag-in + screenshot OCR → Spotify links.
- **P3 — MCP path:** rekordbox-mcp + spotify-mcp wired into Sam's Claude Code (can run parallel to P1/P2 — independent).

## 10. YAGNI (explicitly out)
- Spotify OAuth / playlist auto-create in the web toy (delegated to MCP path).
- Any Beatport/Bandcamp scraping or unofficial API keys.
- `master.db` decryption in the shipped toy.
- Accounts, persistence, multi-user, affiliate monetization.
- Audio fingerprinting (metadata + duration is enough for v1).

## 11. Open items to confirm during build
- Musicfetch actual pricing + whether Beatport direct URLs are reliably present (§7 gate).
- Which Spotify MCP is cleanest post-Feb-2026 (marcelmarais vs a maintained fork), and patch scope.
- Public-embed JSON parser robustness (breakage risk) — keep it isolated + monitored.
