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

## STATUS (handoff 2026-07-21)

> **Production checkpoint 2026-07-22:** `https://sam.toys/vroom/` is live with **1,129 model-generations / 87 catalogue files**, saved cars, twins and shareable two-to-four-car comparison, deterministic pipeline scripts, segment-calibrated scores (**p10=45 / p90=87**), zero unresolved rival references, and **98.7% image coverage**. The generated `cars.json` is **1,428,373 bytes**, beneath the 1.6 MB cap. The current refresh adds accessible Body/Fuel/Character menus, a warm stone-grey/charcoal/burnt-orange rounded visual system, and a separately sourced 8.4 KB new-car editorial dataset covering new and incoming Chinese cars in Europe. Shipping validation, **30/30 tests**, independent review, preview deployment, and public desktop/mobile verification pass. Read [`EXECPLAN.md`](./EXECPLAN.md) for the full evidence trail. The older bullets remain as provenance and should not be treated as current state.

- **Catalogue: 371/1,000+ cars, 35 makes** in `catalogue/*.mjs` — all validate clean (`05-validate.mjs --min=1`).
  Done: BMW, Mercedes, Audi, VW, Toyota, Ford, Honda, Hyundai, Kia, Land Rover, Porsche, Nissan, Mazda,
  Skoda, Volvo, Tesla, MINI, Renault, Peugeot, Vauxhall, Lexus, SEAT, Cupra, Citroën, MG, Fiat/Abarth,
  Alfa, Jaguar, Jeep, Dacia, Suzuki, Subaru, Mitsubishi, Polestar, BYD.
  **Still to author** (wave 1): Lotus, Alpine, Ineos, Genesis, Smart, DS, KGM/SsangYong, Isuzu, Saab,
  Chrysler, halo exotics (Bentley/Aston/McLaren refs used by rivals). **Wave 2**: older/extra generations
  per major make (Golf Mk6, Fiesta Mk6, Qashqai J10, RAV4 XA30/40, Leaf ZE0, 350Z, MX-5 NA/NB, Octavia Mk2,
  XC90 P1, T-Cross, Sharan, Galaxy, C-Max, EcoSport, Auris, Avensis, Verso, Jazz GK, Civic FK7, CR-V RE/RM,
  Micra K12/13, i10 previous, Ceed JD, Sportage QL/SL, A4 B7, A6 C6, X5 E70, E-Class W211, 1 Series F21…)
  until `05-validate.mjs` count gate ≥ 1000 passes.
- **Images: 364/371 (98.1%)** in `state/images.json` (committed despite gitignore, via -f). 7 stragglers listed in
  `state/missing-images.json` — overrides in `image-overrides.json` didn't take (likely no lead image or title
  edge case; debug `batchPageImages` or point overrides at `File:` names directly).
- **Score calibration TODO**: vroom-score histogram too compressed (p10=70/p90=79; gates want <62/>82).
  Plan: segment-specific weight profiles in `lib/vocab.mjs` (performance/utility/default) + bolder sub-scores
  for icons & duds, then re-run validator.
- **Rivals integrity**: ~240 rival ids reference not-yet-written entries — resolve after wave 2 (validator warns).
- **Not started**: `06-build.mjs` (emit `vroom/data/cars.json` + `meta.json`), the whole `vroom/` app UI
  (finca/bijou design language — tokens in the plan), landing-page TOYS card, deploy.
- **Blocked/creds**: GEMINI_API_KEY (in Vercel prod env) + Vercel deploy auth — needed for the grounded
  verify/regrade scripts (01/02/04, not yet written) and `vercel deploy`. Locally: `vercel login` then
  `vercel env pull` and `vercel link` (project **sam-toys**).

The catalogue was authored end-to-end with AI research and is graded on the same rubric the
Gemini scripts use; when `GEMINI_API_KEY` is present, `02-specs.mjs --verify` and `04-grade.mjs`
re-check and re-grade it (grounded) so the dataset can be refreshed without touching the app.
