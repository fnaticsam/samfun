# Handoff: askdev-ship

Written 2026-09-04 by the Mac session that built this. You are a fresh session on the box with this repo and this file. Nothing else.

## Goal

Ship **"Ask dev"** on the private, password-gated page `sam.toys/dev`: a question box at the top of the page that (a) searches the guide instantly in the browser and (b) on Enter asks a Gemini-backed endpoint `POST /dev/ask`, which answers from the guide and cites the sections it used. Sam knows it is done when: the code has been reviewed and fixed, all tests are green, a **draft** PR is open against `main`, and a `STATUS` section is appended to this file.

**Production deployment is NOT part of this handoff.** The box has no Vercel login. Sam deploys from the Mac with `vercel deploy --prod --yes` after merging.

## Where things stand

Done and verified on the Mac:

- The page gate `api/dev.js` is live in production (PR #3 and commit efc60bc): one-year HMAC sessions, cookie `Path=/dev`, trusted-IP auto-admit via `DEV_TRUSTED_IPS`. Verified live with curl from two vantage points.
- **Server side of Ask dev** is written: `api/_lib/dev-session.js` (shared session/auth module, new), `api/dev.js` (refactored to use it, external behaviour identical), `api/dev-ask.js` (new endpoint), `vercel.json` (function `api/dev-ask.js` maxDuration 30 + rewrite `/dev/ask` → `/api/dev-ask`).
  - `DEV_PASSWORD=test-pass-123 node tests/dev-page/gate.test.js` → `46/46 checks passed`
  - `node tests/dev-page/ask.test.js` → `50/50 checks passed` (Gemini is mocked; no key needed)
- **Client side of Ask dev** is written inside `api/_lib/dev.html`: panel `#ask` with `#ask-q`, `#ask-go`, `#ask-results`, `#ask-answer`; CSS under the comment `/* ── ask dev ── */`; a second inline `<script>` near the end of the file (the first script is the copy-button helper, untouched). Verified in headless Chromium against `tests/dev-page/local-serve.js` with `ASK_STUB=1`: typing shows ranked hits with snippets and anchors; Enter posts to `/dev/ask` and renders the answer with "In the guide:" links; 401/429/503/timeout/other error states render their messages; `/` focuses the box; Escape clears.
- **`api/_lib/dev.html` is git-ignored on purpose** (this repository is PUBLIC on GitHub; the page body must never be committed). It is therefore NOT in this branch. It was copied into this worktree with scp right after the worktree was created. First thing: `ls -la api/_lib/dev.html` — it must exist (about 74 KB, 27 `<section id=` blocks). If it is missing, STOP and write that into STATUS.

Half-done / unknown:

- An independent adversarial review of the Ask dev code was started on the Mac and had NOT reported when this handoff was made. Its findings are unknown to you. Do your own review pass (step 2 below).
- Two client polish items were observed in the browser and are not fixed yet (step 3 below).

## Next steps

1. **Sanity.** Run the Acceptance block below once. Everything must already pass except the polish items.
2. **Review pass, read-only first, then fix.** Read `api/_lib/dev-session.js`, `api/dev.js`, `api/dev-ask.js`, `vercel.json`, and ONLY the Ask dev parts of `api/_lib/dev.html` (markup `#ask…`, the CSS block, the second script). Check, adversarially:
   - `/dev/ask` is reachable only with a valid `dev_session` cookie or a trusted `x-real-ip`; try `x-forwarded-for`, HEAD, OPTIONS, trailing slash, the rewrite. Cookie `Path=/dev` covers `/dev/ask` (RFC 6265 path-match) — confirm the client sends it (same-origin fetch).
   - `api/dev.js` behaves exactly as before the refactor (status codes, headers, cookie attributes, logout parsing, trusted-IP admission, fail-closed 503 when the page body is missing). `gate.test.js` is the proof; extend it if you change anything.
   - The Gemini key never appears in a response, log line, URL or error detail. The key goes only in the `x-goog-api-key` header (same pattern as `api/tracks-ocr.js`).
   - Vercel's Node runtime may pre-parse `req.body` for JSON; both the stream path and the pre-parsed path must enforce the 4096-byte cap and the `q` validation (3..500 chars, string); a non-object body, an array, or a huge string must not throw synchronously (a throw = 500 with a stack trace in logs).
   - Client rendering: `answer` is HTML-escaped first, then backtick spans become `<code>`, then newlines become `<br>`. Confirm that order makes injection impossible (answers containing `<script>` or a backtick span containing `<` or `&`). Section links: ids and titles come from the server — a crafted id must not inject into the href or the link text.
   - Search snippet: the source text must be escaped before `<mark>` insertion and query terms must be regex-escaped.
   - Cost: 25 s model timeout, maxOutputTokens 700, no retries, per-instance rate limit 20/min/IP (defence in depth only).
   - Every `dev-ask.js` response carries `Content-Type: application/json`, `Cache-Control: no-store`, `X-Robots-Tag`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.
   - Nothing committed (everything except `dev.html`) contains an IP address, hostname, username, email, key path or secret.
   Fix each confirmed finding with the minimal change and add a test for every server-side fix in `tests/dev-page/ask.test.js`.
3. **Client polish** (all in the second script of `api/_lib/dev.html`; keep the escaping exactly as it is):
   - (a) The instant search highlights common words inside longer words ("to" inside "factory", "on" inside "one"). Add a stop-word list dropped from query tokens (at least: how, do, i, to, the, a, an, on, in, of, is, it, my, for, and, or, at, with, can, what, where, when, does, this, that, be, are, was) and switch both scoring and `<mark>` highlighting to whole-word matching (word-boundary regex built from regex-escaped terms). Keep the fallback that ranks any-term matches by distinct terms matched, then score.
   - (b) When an answer arrives, show it ABOVE the search hits, or hide the hits, so the answer is visible without scrolling.
   - (c) The top hit's snippet starts with the section title because the body text is the whole section's `textContent`; exclude the `<h3>` title from the body text used for snippets and body scoring (keep title scoring separate as it is).
4. **Browser re-check.** Playwright CLI and headless Chromium are installed on the box (no display). Start `ASK_STUB=1 node tests/dev-page/local-serve.js` (listens on `127.0.0.1:8766`, serves the page at `/dev` without auth and mounts the real `api/dev-ask.js` with a stubbed model), load `http://127.0.0.1:8766/dev`, type `how do I reconnect to a claude session on the box`, confirm the hits no longer mark inside words and that the "The tmux helpers" section ranks first, press Enter, confirm the answer renders above the hits with two "In the guide" links. If the browser is unusable, run the tests plus a static check and say so in STATUS.
5. **Final gates on the final tree** (Acceptance block), then `git diff --name-only main..HEAD` must NOT include `api/_lib/dev.html`, any `.env*`, or `CLAUDE.md`.
6. **Commit with explicit paths** (never `git add -A` in this repo), push the branch, open a **DRAFT** PR against `main` titled `Add Ask dev: instant guide search + Gemini answers on /dev`, body: what it is, the test counts, the review findings you fixed, and the sentence "Page body `api/_lib/dev.html` is git-ignored; the Mac copies it from the box worktree before deploying." Then append a `STATUS` section to this file (what you did, test counts, PR URL, what is left, the exact worktree path of the edited `dev.html`) and commit + push it.
7. Do NOT deploy. Do NOT merge. Do NOT touch `main`.

## Acceptance

```
ls -la api/_lib/dev.html
grep -c '<section id=' api/_lib/dev.html                                   # 27
node --check api/dev.js && node --check api/dev-ask.js && node --check api/_lib/dev-session.js
node -e 'JSON.parse(require("fs").readFileSync("vercel.json","utf8"))'
DEV_PASSWORD=test-pass-123 node tests/dev-page/gate.test.js                # 46/46 (or more) checks passed
node tests/dev-page/ask.test.js                                            # 50/50 (or more) checks passed
bash tests/dev-page/secret-scan.sh api/_lib/dev.html                       # secret-scan: CLEAN
git diff --name-only main..HEAD | grep -E 'dev\.html|\.env|CLAUDE\.md'; echo "(nothing may print above this line)"
```

## Files in flight

- `api/_lib/dev-session.js` — new shared session/auth module; change only for review fixes.
- `api/dev.js` — refactored gate; external behaviour must stay identical (gate.test.js proves it).
- `api/dev-ask.js` — new endpoint.
- `api/_lib/dev.html` — IGNORED, copied in by scp; Ask dev panel markup, CSS block, second script. Never `git add -f` it.
- `vercel.json` — function entry + rewrite for `/dev/ask`.
- `.vercelignore` — `tests/` added so the tests are not served as static files.
- `tests/dev-page/` — `gate.test.js`, `ask.test.js`, `local-serve.js`, `secret-scan.sh`, `verify-prod.sh` (the last one is Mac-only: it reads the password from a file on the Mac; ignore it here).
- Must NOT be touched: `api/londonplan.js`, `api/_lib/londonplan.html`, every other file under `api/`, `CLAUDE.md`, the existing `.gitignore` rules, any `.env*`, and `main`.

## Gotchas and decisions already made

- Public repo → `dev.html` is never committed. Its source of truth lives on the Mac. Because you will edit it here, your STATUS must say so plainly and give the worktree path, so the Mac session copies it back before deploying.
- Gemini via the repo's REST pattern (`api/tracks-ocr.js`): model `gemini-3.5-flash`, key in the `x-goog-api-key` header, AbortController timeout, `responseMimeType: application/json` with a schema `{answer, sections[], fromGuide}`. `GEMINI_API_KEY` is not on the box; the tests mock `fetch` and that is expected.
- The guide text is parsed from `dev.html` at cold start (27 sections; fewer than 10 → 503 not_configured). Restart `local-serve.js` after editing `dev.html`.
- Method check runs before auth on `/dev/ask` (GET → 405); rate limiting runs after auth; `fromGuide` defaults to true on a malformed model reply. All deliberate and tested.
- Client fetch timeout is 35 s against the function's 30 s cap, deliberately.
- `api/_lib/*` is never served statically by Vercel (verified: `/api/_lib/londonplan.html` → 404 on prod).
- The instant search index is built from the DOM once; sections without `<h4>` or with empty text must not break it.
- Do not run anything that needs real secrets. Tests use dummies.

## Who to report to and how

Push `agent/claude/askdev-ship`, open the DRAFT PR to `main`, append `STATUS` here and commit + push it. Sam merges and deploys from the Mac. If blocked, write the blocker into STATUS and stop.

## ADDENDUM (added by the Mac after handoff)

The Mac-side independent review finished after this file was written. Its confirmed findings are in REVIEW-FINDINGS-askdev.md in this worktree: two MAJOR defects in readBody() in api/dev-ask.js (a hang on pre-parsed scalar bodies, and an unguarded req.body lazy getter that throws on Vercel) plus one minor header-guard issue. Fix all three with tests before opening the PR and mention them in STATUS. Do not commit REVIEW-FINDINGS-askdev.md.

## STATUS (box session, 2026-09-04)

**Done.** Draft PR open: https://github.com/fnaticsam/samfun/pull/4 (`agent/claude/askdev-ship` → `main`). Nothing deployed, nothing merged, `main` untouched.

What I did:

1. Sanity block passed as handed over (46/46, 50/50, secret-scan CLEAN, 27 sections).
2. Review pass (independent of the Mac's, which landed in this worktree as `REVIEW-FINDINGS-askdev.md` while I was mid-fix; its two MAJORs were the same two I had found). Fixed, each with tests in `tests/dev-page/ask.test.js`:
   - `api/dev-ask.js` `readBody()`: Vercel's lazy `req.body` getter throwing on invalid JSON is now caught → 400 JSON with private headers (was an escaped throw → 500). Pre-parsed scalars (`42`, `true`, `null`) and a consumed stream with nothing pre-parsed now answer 400 (was a hang to maxDuration). Pre-parsed objects/strings/buffers, `{}` (empty JSON body), arrays, oversize (413) and circular objects all covered.
   - `api/_lib/dev-session.js` `clientIp()`: guarded `req.headers` (the Mac's MINOR) → header-less request is 401, no throw. `api/dev.js` unchanged; gate.test.js still 46/46.
   - `parseSections` id regex no longer matches `data-id="…"`.
   - Test harness: a rejecting or stalling handler now reports FAIL instead of crashing / silently exiting. Verified the new checks fail against the pre-fix handler (54/61) and pass after (63/63).
   - Confirmed with no change needed: `/dev/ask` auth (cookie or `x-real-ip` only; `x-forwarded-for` ignored; GET/HEAD/OPTIONS → 405), key only in the `x-goog-api-key` header and never in responses/logs, all five headers on every response, cost caps as specified, client escaping order (HTML-escape → backticks → `<br>`) and fragment-only section hrefs.
3. Client polish, all in the second `<script>` of `api/_lib/dev.html` plus one markup move: (a) stop-word list + whole-word matching (with a light `s/es/ed/ing/er/ers` suffix allowance so "session" finds "sessions" and "reconnect" finds "reconnecting") for scoring and `<mark>`; (b) `#ask-answer` moved above `#ask-results`; (c) `<h3>` excluded from the indexed body text. Escaping untouched.
4. Browser re-check in headless Chromium via `ASK_STUB=1 node tests/dev-page/local-serve.js`: query "how do I reconnect to a claude session on the box" → "The tmux helpers" is the sole/first hit, marks are whole words only (`box`, `sessions`), snippet no longer starts with the title; Enter → answer renders above the hits with two "In the guide" links; a mocked hostile answer (`<script>`, backtick spans with `<`/`&`, crafted ids/titles) produced no injected elements and fragment-only hrefs; stop-words-only query shows no hits; `/` focuses and selects; Escape clears both panels.

Test counts on the final tree: gate 46/46 · ask 63/63 · secret-scan CLEAN.

**The edited page body must be copied back to the Mac before deploying:**
`/home/sam/worktrees/samfun/claude/askdev-ship/api/_lib/dev.html` (git-ignored, 75 335 bytes, 27 sections). `REVIEW-FINDINGS-askdev.md` is left untracked in the same worktree, not committed.

Left open (Sam's call, not changed):
- `tests/dev-page/secret-scan.sh` (already public in `1eba8b5`) embeds scan patterns that are themselves identifiers: a username/home path, an email domain, two IPv4 prefixes, a hostname fragment and env-file names. Consider moving those to a git-ignored local pattern file; a history rewrite would be needed to truly remove them.
- The `ask` endpoint answers 401 (not 503) when `DEV_PASSWORD` is unset; the page gate answers 503. Deliberate fail-closed either way; noted for consistency only.
