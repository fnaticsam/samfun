# Vroom data pipeline

Builds the static dataset for **sam.toys/vroom** (`vroom/data/cars.json` + `meta.json`).
Nothing in this folder deploys — it runs locally / in CI by hand and its output is committed.

## Unit of data
One entry = one **model-generation** (e.g. `bmw-3-series-g20`). This is what lets a single
budget slider surface a brand-new MG4 and a 2016 Cayman at the same £25k.

## Entry schema (final JSON, `vroom/data/cars.json`)

```jsonc
{
  "id": "bmw-3-series-g20",          // slug: make-model-gen
  "make": "BMW", "model": "3 Series",
  "gen": "G20",                       // generation code or short name ("Mk8", "W463")
  "genName": null,                    // optional friendly name ("Typhoon", "8Y")
  "years": [2019, 0],                 // production years; 0 = still on sale
  "bodies": ["saloon", "estate"],    // subset of BODY vocabulary
  "segment": "compact-exec",         // SEGMENTS vocabulary
  "priceNewGBP": [38000, 60000],      // launch→today typical UK list span (mainstream trims)
  "usedGBP": [17000, 45000],          // TODAY's UK used band across the generation (£)
  "accel062": 4.4,                    // seconds, best commonly-sold variant
  "powerBHP": [184, 510],             // min–max across range
  "topMph": 155,
  "fuels": ["petrol","diesel","phev"],// petrol|diesel|hybrid|phev|ev
  "mpg": 47,                          // combined, representative ICE/hybrid variant (null for EV)
  "evMiles": null,                    // WLTP range, EV/PHEV-electric (null otherwise)
  "seats": 5, "doors": 4, "bootL": 480,
  "lenMM": 4713, "kgKerb": 1545,
  "milesPerYear": 10000,              // typical UK annual mileage for this kind of car
  "ncap": [5, 2019],                  // Euro NCAP stars + test year (null if untested)
  "onSale": true, "halo": false,      // halo = above-budget anchor (kept out of default browse)
  "grades": { "build": 86, "drive": 90, "practicality": 80,
              "value": 84, "design": 78, "running": 72 },   // each /100
  "vroom": 84,                        // weighted: build .22 drive .20 value .20 prac .15 design .13 running .10
  "verdict": "…",                     // ≤150 chars, finca voice
  "issues": ["…"],                    // 0–2 known-issue strings
  "buy": "…",                         // which year/engine to buy, ≤110 chars
  "tags": ["boxy-icon", "wafty"],     // 3–8 from TAGS vocabulary (twin-finder fuel)
  "rivals": ["audi-a4-b9"],           // 2–5 entry ids
  "img": { "src": "https://upload.wikimedia.org/…", "w": 900, "h": 600,
           "credit": "…", "license": "CC BY-SA 4.0", "page": "https://en.wikipedia.org/…" }
}
```

Vocabularies (BODY / SEGMENTS / TAGS / FUELS) live in `lib/vocab.mjs` and are enforced by
`05-validate.mjs`.

## Steps

| script | needs | what |
|---|---|---|
| `catalogue/*.mjs` | — | curated per-make source files (the committed canonical data) |
| `01-enumerate.mjs` | `GEMINI_API_KEY` | (refresh path) expand model lines → generations |
| `02-specs.mjs` | `GEMINI_API_KEY` | (refresh path) grounded spec fill / verification of the catalogue |
| `03-images.mjs` | network only | Wikipedia/Commons page-image per generation + attribution → `state/images.json` |
| `04-grade.mjs` | `GEMINI_API_KEY` | (refresh path) re-grade catalogue with segment-calibrated rubric |
| `05-validate.mjs` | — | schema, vocab, ranges, dedupe, score-spread, image-coverage gates |
| `06-build.mjs` | — | catalogue + images + overrides → `vroom/data/cars.json` + `meta.json` |

Typical full build: `node scripts/vroom/03-images.mjs && node scripts/vroom/05-validate.mjs && node scripts/vroom/06-build.mjs`

The catalogue was authored end-to-end with AI research and is graded on the same rubric the
Gemini scripts use; when `GEMINI_API_KEY` is present, `02-specs.mjs --verify` and `04-grade.mjs`
re-check and re-grade it (grounded) so the dataset can be refreshed without touching the app.
