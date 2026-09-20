const { assert, session, id, setup, cookie, privateHeaders, suite } = require('./helpers');
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
delete process.env.PLAYA_TRUSTED_IPS;
const { call, blob } = setup();
const valid = id(1);
const routes = [
  '/playa',
  '/playa/',
  '/playa/api/catalog',
  '/playa/api/shortlist',
  `/playa/m/thumb/${valid}.webp`,
  `/playa/m/preview/${valid}.webp`,
  '/api/playa',
  '/api/playa/api/catalog',
  '/playa%2fapi%2fcatalog',
  '/playa/../playa/api/catalog',
  '/playa//api/catalog',
  '/PLAYA/API/CATALOG',
  '/playa/api/Catalog',
  '/playa/m/THUMB/' + valid + '.webp',
  '/api/playa?path=api/catalog',
  '/playa/%2e%2e/api/catalog',
];
const secret = process.env.PLAYA_PASSWORD;
const token = (time) => `${time}.${session.sign(secret, time)}`;
const cookies = [
  '',
  'playa_session=invalid',
  'dev_session=' + session.issueToken(secret),
  'playa_session=' + token(Date.now() - 91 * 86400000),
  'playa_session=' + token(Date.now() + 120000),
];
for (const url of routes)
  test('no-leak sweep: ' + url.replace(valid, '<id>'), async () => {
    for (const cookie of cookies)
      for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
        const r = await call({
          url,
          method,
          headers: { cookie, 'x-vercel-original-path': '/playa', 'x-original-url': '/playa/api/catalog' },
        });
        assert.ok([401, 404].includes(r.statusCode));
        assert.equal(blob.calls.length, 0);
        assert.doesNotMatch(r.body, /synthetic-signed-url|generated_at|"photos"/);
        assert.equal(r.headers.location, undefined);
        if (method === 'HEAD') assert.equal(r.body, '');
        privateHeaders(r);
      }
  });
for (const path of [
  'thumb/' + valid.slice(1) + '.webp',
  'thumb/' + valid + '0.webp',
  'thumb/' + valid.slice(0, -1) + 'z.webp',
  'thumb/../../catalog/catalog.json',
  'thumb/' + valid + '.webp/extra',
  'thumb/' + valid + '.jpg',
  'original/' + valid + '.webp',
  'Thumb/' + valid + '.webp',
  'thumb/' + valid.toUpperCase() + '.webp',
  'thumb/%2f' + valid + '.webp',
  'thumb//' + valid + '.webp',
  'thumb/./' + valid + '.webp',
])
  test('media id table: ' + path.replaceAll(valid, '<id>'), async () => {
    blob.calls.length = 0;
    const r = await call({ url: '/playa/m/' + path, headers: cookie() });
    assert.equal(r.statusCode, 404);
    assert.equal(blob.calls.length, 0);
    privateHeaders(r);
  });
test('headers: fresh CSP nonce on every shell; all scripts carry it', async () => {
  const nonces = [];
  for (let i = 0; i < 2; i++) {
    const r = await call({ headers: cookie() });
    assert.equal(r.statusCode, 200);
    privateHeaders(r);
    const csp = r.headers['content-security-policy'];
    const nonce = /script-src 'nonce-([^']+)'/.exec(csp)[1];
    nonces.push(nonce);
    assert.equal(
      csp,
      `default-src 'none'; img-src 'self' https://*.blob.vercel-storage.com; style-src 'unsafe-inline'; ` +
        `script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
    );
    const scripts = [...r.body.matchAll(/<script\b([^>]*)>/g)];
    assert.ok(scripts.length > 0);
    for (const script of scripts) assert.ok(script[1].includes(`nonce="${nonce}"`));
    assert.doesNotMatch(r.body, /__PLAYA_NONCE__|\sonclick=/i);
  }
  assert.notEqual(nonces[0], nonces[1]);
});
test('routing: raw req.url wins over forged header and query after authorization', async () => {
  const r = await call({ url: '/playa/api/catalog?path=m/thumb', headers: { ...cookie(), 'x-vercel-original-path': '/playa' } });
  assert.equal(r.statusCode, 503);
  assert.equal(blob.calls.at(-1).path, 'catalog/catalog.json');
  const direct = await call({ url: '/api/playa', headers: cookie() });
  assert.equal(direct.statusCode, 200);
  assert.match(direct.body, /id="grid"/);
});
test('password rotation: old token rejected on every private route with zero store calls', async () => {
  const oldToken = session.issueToken(secret);
  blob.calls.length = 0;
  try {
    process.env.PLAYA_PASSWORD = secret + '-rotated';
    for (const url of routes) {
      for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
        const response = await call({ url, method, headers: { cookie: 'playa_session=' + oldToken } });
        assert.equal(response.statusCode, 401);
        assert.equal(blob.calls.length, 0);
        privateHeaders(response);
        if (method === 'HEAD') assert.equal(response.body, '');
      }
    }
  } finally {
    process.env.PLAYA_PASSWORD = secret;
  }
});
suite(tests);
