# sam.toys/dev — where the page body lives

`/dev` is a password-gated operator guide (how the Codex factory works, how to use
the dev box). It is served by `api/dev.js`, which reads `api/_lib/dev.html`.

**`dev.html` is deliberately not in git.** This repository is public on GitHub, so
anything committed here is world-readable no matter what the gate does. The file is
listed in `.gitignore` and is deployed from the working tree with
`vercel deploy --prod --yes` (the repo's normal deploy path; `.vercelignore` does not
exclude it).

- Source of truth on the Mac: `~/.config/ai-dev/sam-toys-dev/dev.html` (0600).
  Copy it to `api/_lib/dev.html` before deploying from a fresh clone.
- If the file is missing at deploy time, `/dev` still fails closed: the gate answers
  503 "Page body not deployed" after a successful login, never a stack trace.
- The password is the `DEV_PASSWORD` environment variable (Production). Rotating it
  invalidates every session. Sessions are HMAC tokens bound to an issue time and
  expire server-side after one year, so a device logs in once.
- `DEV_TRUSTED_IPS` (Production, comma-separated public IPv4/IPv6 addresses) admits
  requests from those addresses with no password and hands them the same cookie.
  Only Vercel's `x-real-ip` header is consulted, never `x-forwarded-for`. Update it
  when the home address changes; until then the password still works.

This `.md` file is committed but not deployed (`.vercelignore` excludes `*.md`).

## Pipeline stats

Before previewing or deploying the page, generate its git-ignored stats payload:

```sh
node scripts/dev-stats.mjs
```

The generator reads the repo-radar JSON from its normal local configuration. Set
`REPO_RADAR_JSON` to use a different input file. It writes
`api/_lib/dev-stats.json`; `api/dev.js` embeds that JSON into the page without a
browser fetch. A missing or malformed output file does not stop the private page
from loading: every stat displays an em dash and the caption says the numbers are
not deployed yet.

The deploy order is: copy `dev.html` into place, run the stats generator, run the
page tests and secret scan, then use the normal deploy command above.
