// Acceptance test for api/dev-ask.js (POST /dev/ask): drives the handler with
// mock req/res objects and a stubbed global.fetch, so nothing leaves the box.
// Usage: node ask.test.js      (REPO_DIR overrides the repo location)
const crypto = require("crypto");
const { EventEmitter } = require("events");
const fs = require("fs");
const path = require("path");

const REPO = process.env.REPO_DIR || path.resolve(__dirname, "..", "..");
const PASS = process.env.DEV_PASSWORD || "test-pass-123";
const KEY = "test-gemini-key-not-real";
process.env.DEV_PASSWORD = PASS;
process.env.GEMINI_API_KEY = KEY;
delete process.env.DEV_TRUSTED_IPS;

// ---- fetch stub, installed before the module under test is required --------
let FETCH_IMPL = null;
let FETCH_CALLS = [];
global.fetch = async (url, init) => {
  FETCH_CALLS.push({ url: String(url), init });
  if (!FETCH_IMPL) throw new Error("no fetch stub installed");
  return FETCH_IMPL(url, init);
};

const handler = require(path.join(REPO, "api", "dev-ask.js"));
const { sign } = require(path.join(REPO, "api", "_lib", "dev-session.js"));

// ---- mocks ----------------------------------------------------------------
function makeReq({ method = "POST", url = "/dev/ask", headers = {}, body = null }) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = headers;
  process.nextTick(() => {
    if (body !== null) req.emit("data", Buffer.from(body));
    req.emit("end");
  });
  return req;
}
function makeRes() {
  const res = { statusCode: 200, headers: {}, body: "" };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (chunk) => { res.body = chunk == null ? "" : String(chunk); res._resolve(res); };
  res.done = new Promise((r) => { res._resolve = r; });
  return res;
}
const RESPONSES = [];
async function call(opts) {
  const res = makeRes();
  await handler(makeReq(opts), res);
  const out = await res.done;
  RESPONSES.push(out);
  try { out.json = JSON.parse(out.body); } catch { out.json = null; }
  return out;
}

// ---- helpers --------------------------------------------------------------
const token = () => { const t = Date.now(); return `${t}.${sign(PASS, t)}`; };
const authed = () => ({ cookie: "dev_session=" + token(), "content-type": "application/json" });
let ipN = 10;
const nextIp = () => `203.0.113.${ipN++}`;
const jsonBody = (obj) => JSON.stringify(obj);
const ASK = jsonBody({ q: "How do I connect to the dev box?" });

function geminiText(text) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
    text: async () => text,
  };
}
const geminiJson = (obj) => geminiText(JSON.stringify(obj));
function geminiError(status, detail) {
  return { ok: false, status, json: async () => ({}), text: async () => detail };
}

// Independent (crude) read of the guide, so the test does not lean on the
// module's own parser for the ids and titles it expects back.
const GUIDE_HTML = fs.readFileSync(path.join(REPO, "api", "_lib", "dev.html"), "utf8");
const GUIDE_TITLES = new Map();
{
  const re = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(GUIDE_HTML)) !== null) {
    const h3 = /<h3\b[^>]*>([\s\S]*?)<\/h3>/i.exec(m[2]);
    const title = h3
      ? h3[1].replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim()
      : "";
    GUIDE_TITLES.set(m[1], title);
  }
}
const IDS = [...GUIDE_TITLES.keys()];

const results = [];
const check = (name, cond) => { results.push([name, !!cond]); if (!cond) process.exitCode = 1; };

(async () => {
  check("guide has enough sections to test against", IDS.length >= 10);

  // 1. auth ---------------------------------------------------------------
  FETCH_IMPL = () => geminiJson({ answer: "ok", sections: [], fromGuide: true });
  let r = await call({ headers: { "content-type": "application/json" }, body: ASK });
  check("no cookie -> 401 unauthorized", r.statusCode === 401 && r.json && r.json.error === "unauthorized");
  check("401 sets no cookie", !r.headers["set-cookie"]);

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("valid cookie -> 200", r.statusCode === 200);
  check("200 body shape: answer/sections/fromGuide/model", r.json
    && typeof r.json.answer === "string" && r.json.answer.length > 0
    && Array.isArray(r.json.sections)
    && typeof r.json.fromGuide === "boolean"
    && r.json.model === "gemini-3.5-flash");
  check("200 sets no cookie", !r.headers["set-cookie"]);

  process.env.DEV_TRUSTED_IPS = "203.0.113.5";
  r = await call({ headers: { "content-type": "application/json", "x-real-ip": "203.0.113.5" }, body: ASK });
  check("trusted x-real-ip, no cookie -> 200", r.statusCode === 200 && r.json && typeof r.json.answer === "string");
  r = await call({ headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.5" }, body: ASK });
  check("x-forwarded-for alone -> 401", r.statusCode === 401 && r.json.error === "unauthorized");
  r = await call({ headers: { "content-type": "application/json", "x-real-ip": nextIp(), "x-forwarded-for": "203.0.113.5" }, body: ASK });
  check("spoofed x-forwarded-for with untrusted x-real-ip -> 401", r.statusCode === 401);
  delete process.env.DEV_TRUSTED_IPS;

  const savedPass = process.env.DEV_PASSWORD;
  delete process.env.DEV_PASSWORD;
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("no DEV_PASSWORD -> 401 (fails closed)", r.statusCode === 401);
  process.env.DEV_PASSWORD = savedPass;

  // 2. method and request shape -------------------------------------------
  r = await call({ method: "GET", headers: { ...authed(), "x-real-ip": nextIp() } });
  check("GET -> 405 with Allow: POST", r.statusCode === 405 && r.headers["allow"] === "POST");

  r = await call({ headers: { cookie: "dev_session=" + token(), "content-type": "text/plain", "x-real-ip": nextIp() }, body: ASK });
  check("wrong content-type -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: "{not json" });
  check("invalid JSON -> 400", r.statusCode === 400 && r.json.error === "bad_request" && typeof r.json.detail === "string");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody(["q"]) });
  check("JSON array body -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({ q: "hi" }) });
  check("q too short -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({ q: "x".repeat(501) }) });
  check("q too long (501) -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({ q: 42 }) });
  check("non-string q -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({}) });
  check("missing q -> 400", r.statusCode === 400 && r.json.error === "bad_request");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({ q: "x".repeat(5000) }) });
  check("body > 4096 bytes -> 413", r.statusCode === 413 && r.json.error === "payload_too_large");

  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: jsonBody({ q: "  what   is\tthe   box?  " }) });
  check("whitespace-collapsed q is accepted -> 200", r.statusCode === 200);
  const sent = JSON.parse(FETCH_CALLS[FETCH_CALLS.length - 1].init.body);
  check("collapsed question reaches the model once, normalized",
    /QUESTION\n\nwhat is the box\?$/.test(sent.contents[0].parts[0].text));

  // 3. configuration -------------------------------------------------------
  delete process.env.GEMINI_API_KEY;
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("GEMINI_API_KEY unset -> 503 not_configured", r.statusCode === 503 && r.json.error === "not_configured");
  process.env.GEMINI_API_KEY = KEY;

  // 4. model failures ------------------------------------------------------
  FETCH_IMPL = () => geminiError(500, "upstream exploded");
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("model HTTP 500 -> 502 model_error", r.statusCode === 502 && r.json.error === "model_error");

  FETCH_IMPL = () => geminiText("I am not JSON at all.");
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("model returns non-JSON -> 502", r.statusCode === 502 && r.json.error === "model_error");

  FETCH_IMPL = () => geminiText("```json\n" + JSON.stringify({ answer: "fenced but fine", sections: [], fromGuide: true }) + "\n```");
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("fenced JSON is parsed leniently -> 200", r.statusCode === 200 && r.json.answer === "fenced but fine");

  FETCH_IMPL = () => geminiJson({ answer: "   ", sections: [], fromGuide: true });
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("empty answer -> 502", r.statusCode === 502 && r.json.error === "model_error");

  FETCH_IMPL = () => { throw Object.assign(new Error("aborted"), { name: "AbortError" }); };
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("timeout / network failure -> 502", r.statusCode === 502 && r.json.error === "model_error");

  // 5. section mapping -----------------------------------------------------
  FETCH_IMPL = () => geminiJson({ answer: "a", sections: ["not-a-real-section", IDS[0], "also-fake"], fromGuide: true });
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("unknown section ids are dropped", r.statusCode === 200
    && r.json.sections.length === 1 && r.json.sections[0].id === IDS[0]);
  check("kept section carries its guide title",
    r.json.sections[0].title === GUIDE_TITLES.get(IDS[0]) && r.json.sections[0].title.length > 0);

  FETCH_IMPL = () => geminiJson({ answer: "a", sections: IDS.slice(0, 8), fromGuide: true });
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("8 ids -> capped to 6", r.statusCode === 200 && r.json.sections.length === 6);
  check("capped ids are the first 6, in order, with titles",
    r.json.sections.every((s, i) => s.id === IDS[i] && s.title === GUIDE_TITLES.get(IDS[i])));

  FETCH_IMPL = () => geminiJson({ answer: "a", sections: [IDS[0], IDS[0], IDS[1]], fromGuide: true });
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("duplicate ids are de-duplicated", r.json.sections.length === 2);

  FETCH_IMPL = () => geminiJson({ answer: "not in the guide", sections: [], fromGuide: false });
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("fromGuide false is passed through", r.statusCode === 200 && r.json.fromGuide === false);

  // 6. the request we make of the model ------------------------------------
  FETCH_IMPL = () => geminiJson({ answer: "ok", sections: [], fromGuide: true });
  FETCH_CALLS = [];
  r = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  const fc = FETCH_CALLS[0];
  check("one model call per request", FETCH_CALLS.length === 1);
  check("model endpoint is the repo's Gemini REST pattern",
    fc.url === "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent");
  check("key travels in the x-goog-api-key header only", fc.init.headers["x-goog-api-key"] === KEY);
  check("key is not in the URL", !fc.url.includes(KEY));
  const payload = JSON.parse(fc.init.body);
  check("instructions go in systemInstruction",
    /Ask dev/.test(payload.systemInstruction.parts[0].text) && !/Ask dev/.test(payload.contents[0].parts[0].text));
  check("guide + question go in the user content",
    payload.contents[0].parts[0].text.includes("### " + IDS[0]) && payload.contents[0].parts[0].text.includes("How do I connect"));
  check("guide payload is capped at 70k chars", payload.contents[0].parts[0].text.length <= 70000 + 600);
  check("generationConfig matches the contract",
    payload.generationConfig.temperature === 0.2
    && payload.generationConfig.maxOutputTokens === 700
    && payload.generationConfig.responseMimeType === "application/json"
    && payload.generationConfig.responseSchema.required.join(",") === "answer,sections,fromGuide"
    && payload.generationConfig.responseSchema.properties.fromGuide.type === "BOOLEAN");

  // 7. rate limit ----------------------------------------------------------
  const rlIp = "203.0.113.200";
  let rl = null;
  for (let i = 0; i < 21; i += 1) {
    rl = await call({ headers: { ...authed(), "x-real-ip": rlIp }, body: ASK });
    if (i === 19) check("20th request from one IP still 200", rl.statusCode === 200);
  }
  check("21st request in a minute -> 429 rate_limited", rl.statusCode === 429 && rl.json.error === "rate_limited");
  const other = await call({ headers: { ...authed(), "x-real-ip": nextIp() }, body: ASK });
  check("a different IP is unaffected by the limit", other.statusCode === 200);

  // 8. headers and leakage, over every response captured above -------------
  const HEADERS = ["content-type", "cache-control", "x-robots-tag", "x-content-type-options", "referrer-policy"];
  const missing = RESPONSES.filter((x) => !HEADERS.every((h) => x.headers[h]));
  check("every response carries all five headers", missing.length === 0);
  const wrong = RESPONSES.filter((x) =>
    !/^application\/json; charset=utf-8$/.test(x.headers["content-type"] || "")
    || x.headers["cache-control"] !== "no-store"
    || !/noindex/.test(x.headers["x-robots-tag"] || "")
    || x.headers["x-content-type-options"] !== "nosniff"
    || x.headers["referrer-policy"] !== "no-referrer");
  check("every response has the right header values", wrong.length === 0);
  check("no response body contains the key", RESPONSES.every((x) => !x.body.includes(KEY)));
  check("no response body contains the password", RESPONSES.every((x) => !x.body.includes(PASS)));
  check("every response body is JSON", RESPONSES.every((x) => { try { JSON.parse(x.body); return true; } catch { return false; } }));
  check("no response set a cookie", RESPONSES.every((x) => !x.headers["set-cookie"]));

  for (const [name, ok] of results) console.log((ok ? "PASS" : "FAIL") + "  " + name);
  console.log(results.filter((x) => x[1]).length + "/" + results.length + " checks passed");
  if (results.some((x) => !x[1])) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
