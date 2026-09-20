# Private Playa gallery

The single function `api/playa.js` gates the shell, catalog, media and shortlist.
The shell is generic, committed, and bundled with the function; it contains no
gallery records. All data is fetched after admission. No external scripts,
fonts or styles are loaded.

## Environment names

- `PLAYA_PASSWORD`
- `PLAYA_TRUSTED_IPS` (optional)
- `PLAYA_READ_WRITE_TOKEN`

Use an independent password and a dedicated **private** Blob store. No values
belong in this repository. Missing password fails every route closed. Missing
store credentials or an unpublished catalog leave the shell available with a
“Gallery not published yet” message. Trusted addresses are an explicit password
bypass; an unset or empty `PLAYA_TRUSTED_IPS` admits nobody by IP. Production
leaves this variable unset for now. Only the platform's connection-derived `x-real-ip` is consulted.

## Blob layout contract

- `catalog/catalog.json`: `{version, generated_at, years, photos}`. A photo has
  `{id, y, w, h, t, tags, score, pick, sel, sel_src, burst, sens}`. Optional
  `reason` (or `note`) appears beside the score. `id` is lowercase SHA-256 hex.
  Years may be scalar years or objects with `y`; no year or photo data is built in.
- `thumb/<aa>/<id>.webp` and `preview/<aa>/<id>.webp`: first two ID characters
  supply `<aa>`. Only those two sizes can be signed.
- `state/shortlist.json`: `{ids, updated_at}`. The Blob ETag is returned separately
  to clients. A missing object reads as an empty shortlist; first creation uses
  `allowOverwrite: false`. Updates use `allowOverwrite: true` with Blob `ifMatch`.
  Reads bypass the CDN cache so a conflict retry sees the latest state.

Blob SDK 2.6.1 exposes the four operations used here: `get`, `put`,
`issueSignedToken`, `presignUrl`. Catalog reads stream through the function;
media redirects use private, path-scoped, GET-only grants expiring in five
minutes. A signed URL is a temporary bearer capability: anyone receiving it
can fetch that one derivative until expiry, including after password rotation.
This is the specified signed-media design, not revocable per-request media auth.
Never log these URLs. The signing material and store credential stay server-side.

## Routing evidence

The handler uses the raw pathname from `req.url`, without normalizing dot segments
or decoding slashes. It ignores original-path headers and query routing hints.
Vercel's Node dev proxy preserves `origUrl.pathname` when invoking functions,
merging only routing query parameters. The Node handler passes `request.url`
through to the function. Sources:

- [Vercel CLI function invocation](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/dev/server.ts)
- [Vercel Node handler](https://github.com/vercel/vercel/blob/main/packages/node/src/serverless-functions/serverless-handler.mts)
- [Vercel rewrite configuration](https://vercel.com/docs/project-configuration/vercel-json#rewrites)

`tests/playa/routing-check.js` runs the three rewrites through Vercel's routing
compiler and models that invocation path. Forged routing hints are covered by
the endpoint security suite. A real preview rewrite check remains part of the
owner's deploy validation; this packet does not deploy. Direct function hits
use the same admission rule. Unauthenticated non-login requests return 401;
unsupported methods return 405 only after admission.

## Deploy order (owner action; not performed by this packet)

1. Complete independent security review and the packet's local gates.
2. Create the private store and configure the environment names above. Publish
   the catalog and the two derivative sizes through the separate publisher.
   Do not upload or expose originals through this function.
3. Deploy the function and bundled shell through the existing toys workflow.
4. Check original-path routing on a preview, then verify anonymous GET and HEAD
   requests cannot retrieve any catalog or media data. Check password login,
   private media redirects, shortlist conflict retries and mobile navigation.

Rotate the password by changing `PLAYA_PASSWORD` through the existing environment
workflow and activating that configuration. This invalidates all HMAC cookies;
trusted addresses still bypass password login. Cookies otherwise expire after
90 days. Logout clears the cookie at `Path=/playa`. Login failures wait 400 ms;
this is defence in depth, not distributed rate limiting.

## Deliberately absent from git

Photos, catalog records, private source paths, camera filenames, personal names,
store identifiers, credentials, and all generated derivatives are private runtime
data. Shortlists also live only in the private store. No originals, larger renders,
zip download, publisher, AI processor or connection to the source machine is built
here. Download controls explain that downloads arrive with the next update.

Tests generate synthetic IDs and data at runtime. The public scan calls the
unchanged dev secret scanner and adds catalog/image identifier checks, suppressing
matching content. Browser and routing checks use optional test tools installed
outside the repo, via `NODE_PATH`; no application dependency changes are needed.

## Outcome and transition coverage

Names below are the separately reported checks. Catalog, media and shortlist
checks live in `tests/playa/store.test.js`; rotation and no-leak checks live in
`tests/playa/security.test.js`; gate checks live in `tests/playa/gate.test.js`.

| Input or event | Outcome | Persisted | Retry rule | Covering check |
| --- | --- | --- | --- | --- |
| Unauthenticated private route | 401; zero store calls | Nothing | Log in | `no-leak sweep: <route>` |
| Correct password POST | 303 and scoped cookie | Stateless cookie | None | `gate parity: correct POST redirects and issues scoped 90-day HMAC cookie` |
| Wrong password POST | Delayed 401 | Nothing | Delayed retry | `gate parity: wrong delayed at least 390 ms` |
| Trusted connection address | 200 and cookie | Stateless cookie | None | `gate parity: trusted x-real-ip issues valid cookie, including HEAD` |
| Missing password | 503 on every route | Nothing | Configure password | `gate parity: missing secret returns 503 on every route with zero store calls` |
| Missing store token | Data 503; shell available | Nothing | Reload after configuration | `store-error: missing Blob token fails data closed while shell loads` |
| Store error | Generic private 503 | Nothing | Reload | `store-error: upstream failures are private generic 503s, shell still loads` |
| Invalid media ID | 404; zero store calls | Nothing | None | `media id table: <invalid path>` |
| Stale shortlist ETag | 412 | Nothing | Refetch, merge, retry once | `shortlist: stale If-Match returns 412 and changes nothing` |
| Cross-site shortlist PUT | 403; zero writes | Nothing | None | `shortlist cross-site PUT: cross-site` |
| Logout | 303 and cleared cookie | Cookie removed | Log in again | `gate parity: logout clears the scoped cookie` |
| Authenticated catalog GET | 200, JSON and ETag | Nothing | Revalidate | `catalog: authenticated GET 200 with ETag` |
| Catalog GET with matching ETag | 304, no body | Nothing | Reuse catalog | `catalog: authenticated If-None-Match returns 304` |
| Authenticated thumb GET | 302, exact constructed signed pathname, private max-age 300 | Nothing | Fetch signed URL | `media: authenticated thumb GET 302 exact signed pathname and max-age 300` |
| Authenticated preview GET | 302, exact constructed signed pathname, private max-age 300 | Nothing | Fetch signed URL | `media: authenticated preview GET 302 exact signed pathname and max-age 300` |
| Authenticated shortlist GET | 200, IDs, timestamp and ETag | Nothing | None | `shortlist: authenticated GET returns empty state` |
| Successful shortlist PUT then GET | 200; order retained, duplicates removed | Private shortlist | None | `shortlist: authenticated PUT then GET keeps order and removes duplicates` |
| PUT with wrong content type | 415; zero writes | Nothing | Correct type | `shortlist validation: wrong content type has zero writes` |
| PUT stream exceeds byte cap before end | 413 before request completion; zero writes | Nothing | Smaller request | `shortlist validation: oversized stream rejected before end with zero writes` |
| PUT with bad ID | 400; zero writes | Nothing | Correct ID | `shortlist validation: bad id has zero writes` |
| PUT with more than 5,000 valid IDs | 413 (also exceeds byte cap); zero writes | Nothing | Fewer IDs | `shortlist validation: more than 5,000 valid ids has zero writes` |
| PUT with malformed JSON | 400; zero writes | Nothing | Correct JSON | `shortlist validation: malformed JSON has zero writes` |
| Password rotation, old cookie on private routes | 401; zero store calls | Nothing | Log in again | `password rotation: old token rejected on every private route with zero store calls` |

`tests/playa/browser-check.js` separately reports `browser: keyboard navigation`,
`browser: focus trap`, `browser: focus restore`, `browser: keyboard shortlist persistence`,
and `browser: shortlist conflict refetch merges concurrent addition and retries once`.
The rotation sweep covers GET and HEAD on every private endpoint, plus unauthorized
write methods and malformed/direct paths. Login and logout remain their existing
explicit exceptions; this round does not change either behavior.
