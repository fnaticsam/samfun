const { assert, session, setup, cookie, privateHeaders, suite } = require('./helpers');
const dev = require('../../api/_lib/dev-session');
const crypto = require('node:crypto');
const env = process.env.PLAYA_PASSWORD;
assert.ok(env, 'Set the test password');
delete process.env.PLAYA_TRUSTED_IPS;
const { call, blob } = setup();
const signed = (time, label = 'playa-session-v1') =>
  `${time}.${crypto.createHmac('sha256', env).update(`${label}|${time}`).digest('hex')}`;
const post = (body, headers = {}) =>
  call({ method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers }, body });
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test('gate parity: anonymous GET is private login', async () => {
  const r = await call();
  assert.equal(r.statusCode, 401);
  assert.match(r.body, /<form method="post" action="\/playa">/);
  assert.doesNotMatch(r.body, /Wrong password|id="grid"/);
  privateHeaders(r);
});
test('gate parity: anonymous HEAD has no body', async () => {
  const r = await call({ method: 'HEAD' });
  assert.equal(r.statusCode, 401);
  assert.equal(r.body, '');
  privateHeaders(r);
});
for (const [name, body, headers] of [
  ['wrong', 'password=wrong', {}],
  ['wrong length', 'password=' + encodeURIComponent(env + 'x'), {}],
  ['wrong content type', JSON.stringify({ password: env }), { 'content-type': 'application/json' }],
]) {
  test(`gate parity: ${name} delayed at least 390 ms`, async () => {
    const start = performance.now();
    const r = await post(body, headers);
    assert.equal(r.statusCode, 401);
    assert.ok(performance.now() - start >= 390);
    assert.match(r.body, /Wrong password/);
    assert.equal(r.headers['set-cookie'], undefined);
    privateHeaders(r);
  });
}
let token;
test('gate parity: correct POST redirects and issues scoped 90-day HMAC cookie', async () => {
  const r = await post('password=' + encodeURIComponent(env));
  assert.equal(r.statusCode, 303);
  assert.equal(r.headers.location, '/playa');
  privateHeaders(r);
  const match = /^playa_session=(\d+\.[0-9a-f]{64}); Max-Age=7776000; Path=\/playa; HttpOnly; Secure; SameSite=Lax$/.exec(
    r.headers['set-cookie'],
  );
  assert.ok(match);
  token = match[1];
  const time = Number(token.split('.')[0]);
  assert.ok(Math.abs(Date.now() - time) < 5000);
  assert.equal(token, signed(time));
  assert.ok(!token.includes(env));
});
test('gate parity: separate logins issue separate tokens', async () => {
  await new Promise((r) => setTimeout(r, 3));
  const r = await post('password=' + encodeURIComponent(env));
  assert.ok(!r.headers['set-cookie'].includes(token));
});
test('gate parity: authenticated GET and HEAD', async () => {
  for (const method of ['GET', 'HEAD']) {
    const r = await call({ method, headers: { cookie: 'other=value; playa_session=' + token } });
    assert.equal(r.statusCode, 200);
    privateHeaders(r);
    if (method === 'HEAD') assert.equal(r.body, '');
    else assert.match(r.body, /id="grid"/);
  }
});
for (const [name, make] of [
  ['tampered mac', () => token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')],
  ['tampered time', () => `${Number(token.split('.')[0]) + 1}.${token.split('.')[1]}`],
  ['expired', () => signed(Date.now() - 91 * 86400000)],
  ['future', () => signed(Date.now() + 10 * 60000)],
  ['constant token', () => token.split('.')[1]],
  ['other label', () => signed(Date.now(), 'dev-session-v2')],
  ['old label', () => signed(Date.now(), 'playa-session-v0')],
  ['leading zero', () => `0${token}`],
])
  test(`gate parity: ${name} rejected`, async () => {
    const r = await call({ headers: { cookie: 'playa_session=' + make() } });
    assert.equal(r.statusCode, 401);
    privateHeaders(r);
  });
test('gate parity: 89-day token remains valid', async () => {
  assert.equal((await call({ headers: { cookie: 'playa_session=' + signed(Date.now() - 89 * 86400000) } })).statusCode, 200);
});
test('isolation: foreign cookie names rejected', async () => {
  for (const name of ['dev_session', 'lp_session'])
    assert.equal((await call({ headers: { cookie: `${name}=${token}` } })).statusCode, 401);
});
test('isolation: valid dev token cannot open Playa and Playa cannot open dev', async () => {
  const other = dev.issueToken(env);
  assert.ok(dev.tokenIsValid(env, other));
  assert.equal((await call({ headers: { cookie: 'dev_session=' + other } })).statusCode, 401);
  assert.equal((await call({ headers: { cookie: 'playa_session=' + other } })).statusCode, 401);
  assert.equal(dev.tokenIsValid(env, token), false);
});
test('gate parity: logout clears the scoped cookie', async () => {
  for (const url of ['/playa?logout', '/playa?logout=1&other=2']) {
    const r = await call({ url, headers: cookie() });
    assert.equal(r.statusCode, 303);
    assert.equal(r.headers['set-cookie'], 'playa_session=; Max-Age=0; Path=/playa; HttpOnly; Secure; SameSite=Lax');
    privateHeaders(r);
  }
  assert.equal((await call({ url: '/playa?notlogout=1&x=logout=1', headers: cookie() })).statusCode, 200);
});
// Synthetic documentation-range addresses assembled at runtime; no addresses in git.
const ip = [192, 0, 2, 1].join('.'),
  second = [192, 0, 2, 2].join('.'),
  stranger = [192, 0, 2, 3].join('.');
test('gate parity: trusted x-real-ip issues valid cookie, including HEAD', async () => {
  process.env.PLAYA_TRUSTED_IPS = ip + ', ' + second;
  for (const [method, address] of [
    ['GET', ip],
    ['HEAD', second],
  ]) {
    const r = await call({ method, headers: { 'x-real-ip': address } });
    assert.equal(r.statusCode, 200);
    const value = session.cookieValue(r.headers['set-cookie'], 'playa_session');
    assert.ok(session.tokenIsValid(env, value));
    if (method === 'HEAD') assert.equal(r.body, '');
    privateHeaders(r);
  }
});
test('gate parity: forwarded-for never grants trust', async () => {
  for (const headers of [{ 'x-real-ip': stranger }, { 'x-forwarded-for': ip }, { 'x-real-ip': stranger, 'x-forwarded-for': ip }])
    assert.equal((await call({ headers })).statusCode, 401);
});
test('gate parity: trusted valid session not reissued; expired one renewed', async () => {
  assert.equal((await call({ headers: { 'x-real-ip': ip, ...cookie() } })).headers['set-cookie'], undefined);
  const r = await call({ headers: { 'x-real-ip': ip, cookie: 'playa_session=' + signed(Date.now() - 91 * 86400000) } });
  assert.equal(r.statusCode, 200);
  assert.ok(r.headers['set-cookie']);
});
test('gate parity: empty or unset allow-list trusts nobody', async () => {
  process.env.PLAYA_TRUSTED_IPS = '';
  assert.equal((await call({ headers: { 'x-real-ip': ip } })).statusCode, 401);
  delete process.env.PLAYA_TRUSTED_IPS;
  assert.equal((await call({ headers: { 'x-real-ip': ip } })).statusCode, 401);
});
test('gate parity: oversized POST returns 413', async () => {
  const r = await post('password=' + 'x'.repeat(5000));
  assert.equal(r.statusCode, 413);
  privateHeaders(r);
});
test('gate parity: authenticated unsupported method returns 405', async () => {
  const r = await call({ method: 'PUT', headers: cookie() });
  assert.equal(r.statusCode, 405);
  assert.equal(r.headers.allow, 'GET, HEAD, POST');
  assert.match(r.headers['content-type'], /text\/plain/);
  privateHeaders(r);
});
test('gate parity: body error returns private 400', async () => {
  const r = await call({ method: 'POST', error: true });
  assert.equal(r.statusCode, 400);
  privateHeaders(r);
});
test('gate parity: missing secret returns 503 on every route with zero store calls', async () => {
  delete process.env.PLAYA_PASSWORD;
  for (const url of ['/playa', '/playa/api/catalog', '/playa/api/shortlist', '/playa/m/thumb/anything', '/api/playa'])
    for (const method of ['GET', 'HEAD', 'POST', 'PUT']) {
      const r = await call({ url, method, headers: { cookie: 'playa_session=' + token, 'x-real-ip': ip } });
      assert.equal(r.statusCode, 503);
      privateHeaders(r);
    }
  assert.equal(blob.calls.length, 0);
  process.env.PLAYA_PASSWORD = env;
});
suite(tests);
