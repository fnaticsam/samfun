const fs = require("fs");
const path = require("path");

const TOKEN = "__DEV_STATS_JSON__";

function loadStats(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, "dev-stats.json"), "utf8"));
  } catch {
    return null;
  }
}

function injectStats(html, stats) {
  if (!html.includes(TOKEN)) return html;
  const json = JSON.stringify(stats == null ? null : stats).replace(/<\//g, "<\\/");
  return html.replace(TOKEN, () => json);
}

module.exports = { injectStats, loadStats };
