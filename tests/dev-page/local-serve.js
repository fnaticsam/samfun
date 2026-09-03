// Local preview for the /dev page and its "Ask dev" endpoint. No secrets, no
// network: the gate is bypassed (the loopback address is the trusted IP) and,
// with ASK_STUB=1, the Gemini call is answered by a local stub.
//
//   node local-serve.js            # real api/dev-ask.js, real model call (needs a key)
//   ASK_STUB=1 node local-serve.js # stubbed model, nothing leaves the machine
//
// REPO_DIR overrides the repo location.
const fs = require("fs");
const http = require("http");
const path = require("path");

const REPO = process.env.REPO_DIR || path.resolve(__dirname, "..", "..");
const PORT = 8766;
const HOST = "127.0.0.1";

process.env.DEV_PASSWORD = "stub";
process.env.DEV_TRUSTED_IPS = "127.0.0.1";
if (process.env.ASK_STUB === "1" || !process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = "stub";

const ask = require(path.join(REPO, "api", "dev-ask.js"));
const GUIDE = ask.guide();
const PAGE = path.join(REPO, "api", "_lib", "dev.html");

if (!GUIDE) {
  console.error("api/_lib/dev.html did not parse into sections - /dev/ask will answer 503.");
}

// ---- stubbed model ---------------------------------------------------------
if (process.env.ASK_STUB === "1") {
  const ids = GUIDE ? GUIDE.sections.map((s) => s.id) : [];
  const cite = ids.slice(0, 2);
  global.fetch = async (_url, init) => {
    let question = "";
    try { question = JSON.parse(init.body).contents[0].parts[0].text.split("QUESTION\n\n")[1] || ""; } catch { /* ignore */ }
    const offGuide = /nowhere/i.test(question);
    const payload = offGuide
      ? {
          answer: "The guide does not cover that. Speaking generally: the operator guide only documents the factory loop and the dev box, so anything outside those two areas needs a decision from you rather than a lookup here.",
          sections: [],
          fromGuide: false,
        }
      : {
          answer: [
            "Run the packet from an isolated clone, never from the tree you are editing.",
            "Brief it with the exact file set, the acceptance checks and `no commit/push/deploy`, then read the receipt before merging.",
            "Merges stay serial: one writer per file set, one queue.",
          ].join(" "),
          sections: cite,
          fromGuide: true,
        };
    await new Promise((r) => setTimeout(r, 600));
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }),
      text: async () => JSON.stringify(payload),
    };
  };
}

// Loopback shows up as ::1 or ::ffff:127.0.0.1; the gate compares the string
// exactly, so normalise before handing it over as Vercel's x-real-ip.
function realIp(req) {
  const raw = (req.socket && req.socket.remoteAddress) || "";
  if (raw === "::1" || raw === "") return "127.0.0.1";
  return raw.replace(/^::ffff:/, "");
}

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  req.headers["x-real-ip"] = realIp(req);

  if (url === "/dev/ask") return ask(req, res);

  if ((url === "/dev" || url === "/dev/" || url === "/") && (req.method === "GET" || req.method === "HEAD")) {
    let html;
    try { html = fs.readFileSync(PAGE, "utf8"); } catch {
      res.statusCode = 503;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.end("api/_lib/dev.html is not present.");
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(req.method === "HEAD" ? "" : html);
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.end("Not found. Try /dev");
});

server.listen(PORT, HOST, () => {
  console.log(`dev page preview:  http://${HOST}:${PORT}/dev`);
  console.log(`ask endpoint:      POST http://${HOST}:${PORT}/dev/ask`);
  console.log(process.env.ASK_STUB === "1"
    ? `model:             STUBBED (~600 ms; ask something with "nowhere" in it for the off-guide path)`
    : "model:             LIVE - needs a real GEMINI_API_KEY in the environment");
});
