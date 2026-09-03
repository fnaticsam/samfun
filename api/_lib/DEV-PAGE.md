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
  expire server-side after 30 days.

This `.md` file is committed but not deployed (`.vercelignore` excludes `*.md`).
