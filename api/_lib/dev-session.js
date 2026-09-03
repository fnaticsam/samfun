// Shared session/auth for the private /dev surface.
//
// Extracted verbatim from api/dev.js so that api/dev.js (the page gate) and
// api/dev-ask.js (the "Ask dev" endpoint) enforce exactly one rule. Nothing in
// here renders HTML or reads a body: it is only "is this request allowed to see
// /dev?" plus the cookie mechanics and the private-response headers.
//
// A leading-underscore directory under api/ is not treated as a serverless
// function by Vercel; it is bundled into every function that requires it.

const crypto = require("crypto");

const SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // one year: a device logs in once, enforced server-side
const CLOCK_SKEW_MS = 60 * 1000;
const COOKIE = "dev_session";
const COOKIE_ATTRS = "Path=/dev; HttpOnly; Secure; SameSite=Lax";

// Constant-time comparison that does not leak the expected length: both sides
// are hashed to a fixed width before timingSafeEqual.
function matches(candidate, expected) {
  if (typeof candidate !== "string" || typeof expected !== "string") return false;
  const supplied = crypto.createHash("sha256").update(candidate, "utf8").digest();
  const wanted = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(supplied, wanted);
}
function sign(secret, issuedAt) {
  return crypto.createHmac("sha256", secret).update(`dev-session-v2|${issuedAt}`).digest("hex");
}
function issueToken(secret) {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(secret, issuedAt)}`;
}
function tokenIsValid(secret, value) {
  if (typeof value !== "string") return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const issuedText = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  if (!/^\d{1,16}$/.test(issuedText) || !/^[0-9a-f]{64}$/.test(mac)) return false;
  const issuedAt = Number(issuedText);
  if (String(issuedAt) !== issuedText) return false; // no leading zeros / malleable encodings
  const now = Date.now();
  if (issuedAt > now + CLOCK_SKEW_MS) return false;
  if (now - issuedAt > SESSION_TTL_MS) return false;
  return matches(mac, sign(secret, issuedAt));
}
function cookieValue(header, name) {
  if (typeof header !== "string") return null;
  const prefix = `${name}=`;
  const cookie = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}
// Requests from an allow-listed public address (DEV_TRUSTED_IPS, comma- or
// space-separated) are admitted without a password and given the normal
// session cookie, so the device keeps working elsewhere. Vercel sets x-real-ip
// from the connection itself, so a client cannot spoof it; when the header is
// absent nothing is trusted.
function trustedIps() {
  return (process.env.DEV_TRUSTED_IPS || "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}
function clientIp(req) {
  const real = req.headers["x-real-ip"];
  return typeof real === "string" && real.trim() ? real.trim() : null;
}
function fromTrustedIp(req) {
  const ip = clientIp(req);
  if (!ip) return false;
  return trustedIps().some((allowed) => matches(ip, allowed));
}
function privateHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
}
function wantsLogout(url) {
  try {
    return new URL(url || "/", "http://localhost").searchParams.get("logout") === "1";
  } catch {
    return false;
  }
}

// The single admission rule for every /dev surface: a valid session cookie, or
// a request arriving from a trusted address. Callers decide what to do with the
// distinction (the page gate mints a cookie for a trusted first visit; the ask
// endpoint never sets cookies).
function authorize(req, secret) {
  const hasSession = tokenIsValid(secret, cookieValue(req && req.headers ? req.headers.cookie : null, COOKIE));
  const trusted = !hasSession && fromTrustedIp(req);
  return { ok: hasSession || trusted, hasSession, trusted };
}

module.exports = {
  SESSION_TTL_MS,
  CLOCK_SKEW_MS,
  COOKIE,
  COOKIE_ATTRS,
  matches,
  sign,
  issueToken,
  tokenIsValid,
  cookieValue,
  trustedIps,
  clientIp,
  fromTrustedIp,
  privateHeaders,
  wantsLogout,
  authorize,
};
