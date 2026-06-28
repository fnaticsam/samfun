# sam.toys — repo guide & boundaries

This repo is **`fnaticsam/samfun`**, deployed as the Vercel project **`sam-toys`** → **https://sam.toys**.
It is a collection of independent, self-contained static toys, one per top-level folder. No build step; each is a single `index.html` (+ assets). Deploy with `vercel deploy --prod --yes` from this directory (the GitHub→Vercel webhook is unreliable). Always dry-run a preview deploy first, then read back the **public prod URL** (preview URLs are SSO-gated → 302).

## Folders → live URLs
- `tantra/index.html`  → **https://sam.toys/tantra** — "The Loom of Union" tantra course (Ink & Gold Thread design). `noindex`.
- `taotime/index.html` → **https://sam.toys/taotime** — *LEGACY* copy of the Watercourse Way site (see boundary below).

## ⚠️ CRITICAL BOUNDARY: there are TWO "taotime" things. Do not conflate them.
1. **taotime.me = the PRIMARY / live Watercourse Way site.** It is a *separate project entirely*:
   - codebase: **`~/Code/taotime`** (its own git repo, **no GitHub remote** — local only)
   - Vercel project: **`taotime`** (prj_qQXiAkwyEo095RpBGQCrMdiQKkty), domain **taotime.me**
   - **NOTHING in this repo affects taotime.me.** Editing/deleting `samfun`'s `taotime/` folder or any `samfun` branch has ZERO effect on taotime.me.
2. **sam.toys/taotime = a stale LEGACY mirror** living in this repo's `taotime/` folder. It is not the source of truth; taotime.me is. Don't invest work here; if anything, this folder may eventually be retired (but it's live at 200 today — don't delete without explicit say-so).

**Rule of thumb:** "watercourse / Tao / taotime.me work" → go to `~/Code/taotime`, deploy the `taotime` Vercel project. "sam.toys/anything" (incl. the legacy `taotime/` mirror, and `tantra/`) → this repo, deploy `sam-toys`. When in doubt, check `.vercel/project.json` (this repo = `sam-toys`) before deploying.

## Branches
Keep it to `main`. Stale/abandoned branches are deleted, not merged — and a samfun branch can never touch taotime.me regardless.
