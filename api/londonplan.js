const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(
  path.join(__dirname, "_lib", "londonplan.html"),
  "utf8"
);

function passwordFrom(header) {
  if (typeof header !== "string") return null;
  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (!match) return null;

  const credentials = Buffer.from(match[1], "base64").toString("utf8");
  const separator = credentials.indexOf(":");
  return separator === -1 ? null : credentials.slice(separator + 1);
}

function passwordsMatch(candidate, expected) {
  if (candidate === null) return false;
  const supplied = Buffer.from(candidate, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  const comparable = Buffer.alloc(wanted.length);
  supplied.copy(comparable, 0, 0, wanted.length);
  return crypto.timingSafeEqual(comparable, wanted) && supplied.length === wanted.length;
}

module.exports = (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end("Method not allowed.");
  }

  const expected = process.env.LONDONPLAN_PASSWORD;
  if (!expected) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(req.method === "HEAD" ? "" : "Password not configured.");
  }

  if (!passwordsMatch(passwordFrom(req.headers.authorization), expected)) {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="Fnatic", charset="UTF-8"');
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.end(req.method === "HEAD" ? "" : "Password required.");
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.end(req.method === "HEAD" ? "" : HTML);
};
