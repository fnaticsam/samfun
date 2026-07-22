# Ship the Vroom car picker at sam.toys/vroom

## Purpose

Vroom becomes a fast, slider-first UK car picker: choose budget, age, pace and efficiency, compare scored model-generations, save favourites, and find cheaper cars with the same character. The finished static app is available locally and at `https://sam.toys/vroom`.

## Completion contract

- Goal: ship a polished, responsive Vroom product backed by a validated, reproducible car dataset.
- Done when: the static app loads at `/vroom`, filters and shared hashes work, detail/twin/saved flows work, the root launcher links to it, current validation/build checks pass, the app is visually reviewed at mobile and desktop widths, and production responds successfully.
- Constraints: preserve the no-build static architecture; never touch `taotime/`; deploy only the linked `sam-toys` Vercel project; keep cars JSON at or below 1.6 MB; use real Wikimedia imagery with visible attribution where metadata is complete.
- Dataset target: 1,000 credible UK model-generations is the release floor, not the ceiling. Aim for roughly 1,100–1,200 useful entries without counting individual years or trim variants as separate cars. Do not manufacture low-quality filler just to satisfy a count.
- Non-goals: classifieds listings, finance quotes, accounts, a backend, or production mutation outside this repository and Vercel project.
- Required evidence: validator output, deterministic build output, logic tests, JSON size/coverage report, browser checks at 390px and 1440px, preview deployment, production deployment, and public URL verification.

## Context and orientation

- Repository: `/Users/sammathews/Code/sam.toys`
- Working branch: `cursor/bc-0d1e81a7-9803-489e-9a49-c3f919e3eacd-8320`
- Canonical sources: `scripts/vroom/catalogue/*.mjs`
- Pipeline: `scripts/vroom/*.mjs`; generated data: `vroom/data/*.json`
- Product: static files under `vroom/`; root launcher: `index.html`
- Current baseline (2026-07-22): 371 entries / 35 makes, score p10 70 / p90 79, 364 image URLs, 2 images with complete credit and licence, 238 unresolved rival occurrences, and five validator range failures caused by realistic edge values.
- The local Vercel link points to project `sam-toys`. The environment pull did not provide a Gemini key, so grounded verification is a resumable pipeline capability but not currently runnable.

## Work graph

| ID | Objective | Dependencies | Owner | Acceptance | Status |
|---|---|---|---|---|---|
| D1 | Audit catalogue and calibration | none | wave1 catalogue | reproducible counts/distribution and expansion plan | complete |
| D2 | Audit pipeline, images and build contract | none | wave1 pipeline | blocker report and interfaces | complete |
| D3 | Audit product architecture and reference styles | none | wave1 product | responsive UX and file contract | complete |
| P1 | Fix validation semantics and implement build/verification scripts | D1,D2 | wave2 pipeline | scripts run, outputs deterministic | complete |
| U1 | Build HTML/CSS app shell and responsive visual system | D3 | wave2 UI shell | accessible responsive shell | complete |
| U2 | Implement filtering, routing, cards, detail, twins and storage | D2,D3 | wave2 UI logic | logic tests and integrated flows | complete |
| C1 | Add German premium older/extra generations | D1 | wave3 German | 90 rows; targeted validation clean | complete |
| C2 | Add Japanese older/extra generations | D1 | wave3 Japanese | 98 rows; targeted validation clean | complete |
| C3 | Add VW/Skoda/SEAT older generations | D1 | wave3 Euro | 60 rows; validation clean after root fixes | complete |
| C4-C9 | Add remaining credible makes/generations in disjoint files | C1-C3 | restart swarm | per-file validation, no duplicate IDs | complete |
| I1 | Integrate data, UI, side-by-side comparison and root launcher | P1,U1,U2,C* | root | local app works from repository server, including persistent/shareable 2–4 car comparisons | complete |
| Q1 | Repair audited catalogue semantics and template-heavy grading | C4-C9 | repair swarm | body/seat/powertrain/identity/halo checks pass; useful within-make variance | complete |
| Q2 | Optimize frontend and expose image attribution | I1 | root + frontend worker | responsive images, bounded DOM, coalesced filters, visible credits | complete |
| V1 | Independent data and regression review | I1 | verification swarm | gates and spot checks audited | complete |
| V2 | Independent browser/accessibility/visual review | I1 | verification swarm | 390/1440 evidence and defect list | complete |
| S1 | Preview deploy, production deploy and public verification | V1,V2 | root | public `sam.toys/vroom` returns 200 and core assets load | complete |

## Team topology and budgets

- Runtime capacity after the 2026-07-22 restart: nine slots including root, so eight workers per wave.
- Root owns requirements, shared contracts, integration, root launcher, final tests, commits, pushes and deployments.
- Wave 1 used three read-only auditors.
- Wave 2 uses disjoint write scopes for pipeline, HTML/CSS, and JS/test modules.
- Catalogue expansion runs in later bounded waves with non-overlapping make files.
- Final waves reserve independent agents for data regression, browser/accessibility review, and adversarial release review.
- No agent may commit, push, deploy, or touch `taotime/`.

## Milestones

1. Contract and blockers: reconcile README with actual validator/image state and freeze emitted JSON/UI interfaces.
2. Product foundation: implement deterministic data build and a complete usable static app.
3. Catalogue and calibration: broaden makes/generations, create useful score tails, repair rivals and refresh image metadata when network permits.
4. Integrated QA: build data, run pure logic tests, serve locally, and iterate visual/browser defects.
5. Release: add root card, preview deploy, production deploy, verify the public URL, then push the reviewed branch.

## Progress

- [x] 2026-07-22 D1-D3: three independent audits completed.
- [x] 2026-07-22 Contract: chose immediate slider deck, static ES modules, deterministic JSON, and honest beta fallback rather than synthetic catalogue filler.
- [x] 2026-07-22 P1/U1/U2: deterministic pipeline plus complete static app implemented; 16/16 tests pass.
- [x] 2026-07-22 C1-C3: added 248 entries, raising catalogue from 371 to 619.
- [x] 2026-07-22 Calibration: segment profiles plus explicit scale expansion produce p10 48 / p90 88 and a useful Best cohort.
- [x] 2026-07-22 Restart preflight: root re-verified 619 cars, zero schema errors, p10 48 / p90 88, 16/16 tests, and a 679,129-byte payload in the nine-slot runtime.
- [x] 2026-07-22 C4-C8: five parallel catalogue packets added 444 credible generations, reaching 1,063 with zero schema errors.
- [x] 2026-07-22 I1 comparison: persistent/shareable two-to-four-car comparison implemented across cards, detail views, mobile navigation and a responsive score/spec table; initial comparison unit checks pass.
- [x] 2026-07-22 C9: added 80 further distinct generations and froze catalogue inputs at 1,143 rows / 87 files.
- [x] 2026-07-22 Rival repair: deterministic reviewed override pass resolves 100% of rival references; check mode and repeat hash pass.
- [x] 2026-07-22 Image refresh: 1,128/1,143 entries resolved (98.69%); 1,122 resolved images have complete credit/licence/page metadata; 31 reviewed generation-specific overrides repair the most visible duplicates and Ioniq 5 N.
- [x] 2026-07-22 Browser QA: desktop/mobile filtering, saved, detail, twins, comparison, hash reload, keyboard dialogs, console and network smoke pass; follow-up fixes remain for the mobile skip target and favicon.
- [x] 2026-07-22 Q1/Q2: repaired body/seat/powertrain/identity/halo issues, removed non-generation rows, separated SsangYong/KGM identity, diversified grading, added responsive Commons imagery and legally useful attribution, bounded paging, coalesced filters and hardened persisted state.
- [x] 2026-07-22 Polish: completed three visual/product rounds; mobile skip/focus/compare flows, desktop first-result visibility, contrast, card/detail hierarchy and empty/error recovery were iterated through browser review.
- [x] 2026-07-22 Automotive refresh: replaced the beige/pink poster layer with warm stone-grey, charcoal and burnt orange; added rounded components and compact hover/focus/click Body, Fuel and Character menus.
- [x] 2026-07-22 Unified finder: merged the hero, search, primary filters and slider deck into one responsive configurator; replaced the Body menu with nine accessible side-profile silhouette toggles and verified state/hash/drawer sync across desktop, tablet and mobile.
- [x] 2026-07-22 New-car radar: added an optional, separately sourced editorial dataset for current and incoming cars in Europe, including OMODA, JAECOO, Leapmotor, XPENG, Zeekr and BYD; new prices remain independent of used-car hashes.
- [x] 2026-07-22 Dedicated radar: moved the editorial feed out of the used-car results page into `/vroom/new/`, replaced clipped nested rails with a responsive 1/2/3-column grid, expanded the feed to 21 unique sourced cars, added status/powertrain/price filters and explicit price-TBC support, and kept the finder entry as a normal link.
- [x] 2026-07-22 Dedicated radar release: 38/38 tests, shipping validation, HTML validation, independent accessibility/data/code/performance/responsive/visual reviews, preview verification, exact-preview promotion and public desktop/mobile checks passed; production deployment `dpl_6way4fMQmZBoYaMannzwJ2tCHtyf` is live.
- [x] 2026-07-22 Radar photography: Google/Commons discovery was followed by file-page identity and licence review; 13 approved card photos are locally cached as 480/960px WebP with visible creator/licence links, hashes and declared transformations. Eight uncertain, mismatched or restricted records retain silhouettes.
- [x] 2026-07-22 Radar photography release: replaced the predecessor Atto image with an exact CC0 2025 Yuan Plus/Atto 3 Evo facelift photo, fixed 16:10 silhouette geometry and 320px credit wrapping, passed 45/45 tests plus shipping validation, promoted preview `dpl_FCXSJ9NkS5K7hFbRtuKHZKxyxoc9`, and publicly verified production `dpl_C7scBcHKpqrnTK1vTGt3xqnWSH2H`.
- [x] 2026-07-22 Integrated verification and release: 30/30 Vroom tests, shipping validator, independent data/accessibility/performance/visual review, preview deployment, production deployment, and public desktop/mobile browser checks passed.

## Discoveries

- `vroom/` is absent, not scaffolded.
- The validator's hard minimums reject five plausible facts (1970 classic, 2,000 annual miles, 78 mph, 85 L boot, 2.1 s acceleration); widen validation bounds instead of falsifying facts.
- Cached image title normalization prevents attribution joins: 362 of 364 image records lack credit and licence.
- 98 cars share an image URL inside 46 duplicate groups, including wrong-generation examples.
- The current payload projects below 1.6 MB at 1,000 entries if pipeline-only image fields are stripped.
- Weight profiles can create a useful high tail, but the low tail requires bolder source grades or an explicit reviewed calibration pass.
- `vercel env pull` produced Blob/OIDC variables only; no local Gemini key is available.
- The post-wave-3 checkpoint is 619 cars / 46 catalogue files, 0 schema errors, 0 duplicate IDs, 490 unresolved rival references, 364 image URLs, and 2 fully attributed images.
- Generated `cars.json` is 679,129 bytes at 619 cars; the 1.6 MB cap remains feasible at 1,000.
- The nine-slot wave added 444 entries across five disjoint packets; the stable post-wave-1 snapshot is 1,063 entries with zero schema errors and 460 unresolved rival occurrences before repair.
- A forced Wikimedia refresh against the 619 snapshot achieved 615/619 images and 611 complete attributions, proving the metadata path; it must be rerun after catalogue freeze because the source set grew during the request.
- The post-audit catalogue contains 1,129 model-generations in 87 files after removing duplicates, trims, fabricated/unavailable rows and incorrect identity splits. The final pre-deploy payload is 1,428,373 bytes, beneath the 1.6 MB release cap; p10 is 45 and p90 is 87.
- Rival repair now uses a deterministic full-array override file plus three exact legacy aliases. Shipping validation reports zero unresolved rival references.
- The final image state resolves 1,114/1,129 entries (98.7%); 1,108/1,114 resolved images have complete material/source attribution (99.5%). All emitted image sources are Wikimedia-hosted and every emitted `page` points to its Commons File page.
- Independent catalogue review found systemic semantic issues hidden by schema-only gates: Ford body overrides, eleven seven-seat rows with five seats, several electrified halo cars marked petrol-only, UK-availability mistakes, model/trim identity duplicates, halo inconsistencies and over-reused grade vectors. These are release work, not deferred cleanup.
- Browser and accessibility review found no critical/high UI defect. Remaining medium issues are faint text contrast, focus-ring contrast, visible image attribution, mobile skip-link occlusion and an overly tall first viewport. Performance review also measured slider jank under CPU throttling, fixed-size image waste and unbounded automatic card appends.
- The 1,129-row built catalogue has no gearbox or drivetrain fields. Generation-level records can include several transmissions or layouts, so Manual/Automatic and FWD/RWD/AWD filters must wait for a sourced availability-array data contract rather than inferred values.
- Upcoming European models cannot truthfully be added to the used-car catalogue: its contract requires used-price bands and current UK sale semantics. A small optional editorial artifact keeps market, price basis, checked date and official source explicit without affecting the core 1.6 MB payload gate.
- Manufacturer prices are mutable. The page visibly marks records once `reviewBy` passes, but a future scheduled source-refresh gate would be stronger than the current manual dated release check.
- Google Image Search is discovery, not permission. Manufacturer press imagery is excluded unless asset-specific web reuse permission is recorded; BYD UK media terms explicitly bar reposting. Approved radar images therefore come from reviewed Wikimedia Commons files and are served locally to avoid production hotlinks.

## Decision log

- 2026-07-22: Preserve Vroom as a static toy with no framework or backend. Evidence: repository convention and no capability requires a server.
- 2026-07-22: Put the slider deck directly in the first viewport. Evidence: the picker task is clearer than the map/landing structure in the visual references.
- 2026-07-22: Treat credited/licensed images, not merely non-null URLs, as the image quality metric.
- 2026-07-22: Do not pad the catalogue with fabricated rows. If 1,000 credible generations remain unfinished, ship and label an honest beta only if all product, schema, attribution and release checks otherwise pass.
- 2026-07-22: Treat 1,000 as a floor and target roughly 1,100–1,200 distinct model-generations, never separate rows for individual years or trims. Evidence: explicit user direction plus the projected payload remains under 1.6 MB.
- 2026-07-22: Make side-by-side comparison a release requirement with persistent selection, deep links and responsive two-to-four-car tables. Evidence: explicit user request.
- 2026-07-22: Replace the long chip rail with supported Body, Fuel and Character menus. Defer gearbox/drivetrain until every filter value has trustworthy source data; do not ship controls that silently match nothing.
- 2026-07-22: Treat the new-car radar as editorial data independent of the used-car filters. Every price names a market and source; stale launch prices are visibly qualified.
- 2026-07-22: Use a dedicated static `/vroom/new/` destination rather than loading editorial data beneath used-car results. Keep cross-currency prices separate: the price sort is explicitly GBP-first and labelled “Lowest UK price.”
- 2026-07-22: Require an allowlisted Commons licence, canonical file page, original URL, retrieval date, local hash and declared changes for radar photography. Prefer an honest silhouette to a search thumbnail, restricted press asset or uncertain model/generation match.

## Verification matrix

| Done condition | Check | Result | Evidence |
|---|---|---|---|
| Schema and vocabulary | `node scripts/vroom/05-validate.mjs --shipping --min=1000 --warn` | pass | 1,129 cars, zero schema errors, zero unresolved rivals |
| Score calibration | p10 < 62, p90 > 82, useful >=88 cohort | pass | p10 48 / p90 88 at 619 cars |
| Data reproducibility | run `06-build.mjs` twice and compare | pass | identical cars/meta hashes; editorial artifact unchanged |
| Payload | parse cars/meta, raw cars JSON <=1.6 MB | pass | cars.json 1,428,373 bytes; editorial.json 26,714 bytes and is loaded only by `/vroom/new/` |
| Images | >=95% usable; complete metadata measured separately | pass | 98.7% coverage; 99.5% complete attribution among resolved images |
| UI logic | Node tests for filters/router/twins/storage/editorial/menus/radar route | pass | 45/45 Vroom tests |
| Responsive UI | browser review at 320/390/700/701/768/1000/1001/1440px | pass | radar grid switches 1/2/3 columns; 13 photos and 8 equal-geometry fallbacks; no card, credit or document overflow |
| Release | preview and production deploy plus public HTTP/browser checks | pass | preview `dpl_FCXSJ9NkS5K7hFbRtuKHZKxyxoc9`; production `dpl_C7scBcHKpqrnTK1vTGt3xqnWSH2H`; public feed has 21 cars/13 local photos, exact Atto Evo asset hash, zero image errors |

## Risks and recovery

- Catalogue quality: expansion may exceed the time available for grounded review. Keep each make isolated so questionable additions can be removed without destabilizing the app.
- Gemini blocker: scripts must be resumable and safe, but the grounded pass remains skipped until a key exists.
- Image licensing: render a designed placeholder when complete attribution is absent; never invent credits.
- Deployment: preview first. Production is a static replacement and can be rolled back through Vercel; no database or destructive migration is involved.
- Shared worktree: agents receive disjoint write scopes; root reviews every patch before integration.

## Outcomes and handoff

### Restart checkpoint — 2026-07-22

The worktree is intentionally uncommitted on branch `cursor/bc-0d1e81a7-9803-489e-9a49-c3f919e3eacd-8320`. It is syntactically and schema-valid at 619 cars. The app, pipeline, root Vroom launcher card, tests and generated data are present. Do not discard untracked files.

Current passing checkpoint:

```bash
cd /Users/sammathews/Code/sam.toys
git branch --show-current
node scripts/vroom/05-validate.mjs --min=1
node --test scripts/vroom/tests/pipeline.test.mjs scripts/vroom/tests/ui-logic.test.mjs
node scripts/vroom/06-build.mjs
```

Observed results: 619 cars, p10 48, p90 88, zero schema errors, 16/16 tests passing, and `vroom/data/cars.json` at 679,129 bytes.

Start the next runtime with nine total slots as one root plus eight workers. Recommended first wave:

1. **Catalogue UK:** Ford, Vauxhall, Lotus, Ineos, Jaguar, Land Rover, Isuzu; target 70–85 new generations in new `*-extra` files.
2. **Catalogue France:** Renault, Peugeot, Citroen, DS, Alpine; target 65–80.
3. **Catalogue Korea/China:** Hyundai, Kia, Genesis, KGM/SsangYong, MG, BYD, Smart; target 65–80.
4. **Catalogue character brands:** Volvo, Saab, Alfa Romeo, Fiat/Abarth, MINI, Jeep, Dacia; target 65–80.
5. **Catalogue halo/performance:** Porsche, Bentley, Aston Martin, McLaren, Ferrari, Lamborghini, Maserati, Tesla, Polestar; target 55–70 useful anchors, not trim filler.
6. **Rival/identity repair:** read-only inventory first, then fix canonical aliases and unresolved rivals after packets 1–5 land. Own only existing rival arrays/alias tooling; avoid files being authored concurrently.
7. **Image pipeline:** run the repaired `03-images.mjs --force` with network access, validate credit/licence/page metadata, and review duplicate/wrong-generation sources. Do not invent attribution.
8. **Browser/product QA:** serve the already-built app, test 390×844 and 1440×900, capture screenshots, check console/network, and return defects without editing during the catalogue wave.

Root responsibilities after wave 1: integrate catalogue files, rebuild, resolve contradictions, dispatch a second verification/fix wave, update README status, perform three visual polish iterations, run preview deployment, production deployment, public URL checks, then commit/merge/push as authorized.

Known blockers still open: catalogue count 619/1,000, 490 unresolved rival references, image coverage 58.8% after expansion, complete attribution 0.5%, no local Gemini key, and browser automation was not available in the current in-app browser session. A local server can be started with `python3 -m http.server 80120 --bind 127.0.0.1`.
