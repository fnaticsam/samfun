const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const HTML = fs.readFileSync(path.join(__dirname, "_lib", "londonplan.html"), "utf8");
const LOGIN = (failed) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Valorant 2027 · Location Model</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;1,600;1,700&amp;family=Barlow:wght@400;500;600;700&amp;display=swap">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#0A0A0C;color:#F4F4F1;font-family:Barlow,Arial,sans-serif}.card{width:min(100%,400px)}.eyebrow{margin:0 0 12px;color:#FF5900;font:600 13px/1 "Barlow Condensed","Arial Narrow",Arial,sans-serif;letter-spacing:.16em}.title{margin:0;font:700 clamp(44px,12vw,68px)/.9 "Barlow Condensed","Arial Narrow",Arial,sans-serif;letter-spacing:-.02em}.intro{margin:20px 0 28px;color:#b9b9b5;font-size:16px}input{width:100%;height:52px;border:1px solid #444449;border-radius:2px;padding:0 14px;background:#17171a;color:#F4F4F1;font:500 18px Barlow,Arial,sans-serif;outline:none}input:focus{border-color:#FF5900}.button{width:100%;height:52px;margin-top:12px;border:0;border-radius:2px;background:#FF5900;color:#0A0A0C;font:700 18px "Barlow Condensed","Arial Narrow",Arial,sans-serif;text-transform:uppercase;cursor:pointer}.error{margin:14px 0 0;color:#ff8b55;font-size:14px}
</style>
</head>
<body><main class="card">
<p class="eyebrow">FNATIC · VALORANT 2027</p>
<h1 class="title">LOCATION MODEL</h1>
<p class="intro">Enter the password to continue.</p>
<form method="post" action="/londonplan">
<input type="password" name="password" autocomplete="current-password" autofocus required>
<button class="button" type="submit">Enter</button>
</form>
${failed ? '<p class="error">Wrong password — try again.</p>' : ""}
</main></body>
</html>`;
function matches(candidate, expected) {
  if (typeof candidate !== "string") return false;
  const supplied = Buffer.from(candidate, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return supplied.length === wanted.length && crypto.timingSafeEqual(supplied, wanted);
}
function cookieValue(header, name) {
  if (typeof header !== "string") return null;
  const prefix = `${name}=`;
  const cookie = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}
function sendLogin(req, res, failed) {
  res.statusCode = 401;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  return res.end(req.method === "HEAD" ? "" : LOGIN(failed));
}
function redirect(res, cookie) {
  res.statusCode = 303;
  res.setHeader("Location", "/londonplan");
  res.setHeader("Set-Cookie", cookie);
  res.setHeader("Cache-Control", "no-store");
  return res.end();
}

function handlePost(req, res, secret, token) {
  const chunks = [];
  let size = 0;
  let finished = false;
  req.on("data", (chunk) => {
    if (finished) return;
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += data.length;
    if (size > 4096) {
      finished = true;
      res.statusCode = 413;
      res.setHeader("Cache-Control", "no-store");
      return res.end("Payload too large.");
    }
    chunks.push(data);
  });
  req.on("end", () => {
    if (finished) return;
    finished = true;
    const type = req.headers["content-type"] || "";
    const form = /^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(type);
    const password = form
      ? new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get("password")
      : null;
    if (!matches(password === null ? null : password.trim(), secret)) return sendLogin(req, res, true);
    return redirect(res, `lp_session=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
  });
  req.on("error", () => {
    if (finished) return;
    finished = true;
    res.statusCode = 400;
    res.setHeader("Cache-Control", "no-store");
    return res.end("Invalid request.");
  });
}

module.exports = (req, res) => {
  const SECRET = process.env.LONDONPLAN_PASSWORD;
  if (!SECRET) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(req.method === "HEAD" ? "" : "Password not configured.");
  }

  if (!["GET", "HEAD", "POST"].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD, POST");
    return res.end("Method not allowed.");
  }

  const token = crypto.createHmac("sha256", SECRET).update("londonplan-session-v1").digest("hex");
  if (req.method === "GET" && (req.url || "").includes("logout=1")) {
    return redirect(res, "lp_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  }
  if (req.method === "POST") return handlePost(req, res, SECRET, token);

  if (!matches(cookieValue(req.headers.cookie, "lp_session"), token)) return sendLogin(req, res, false);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.end(req.method === "HEAD" ? "" : HTML);
};
