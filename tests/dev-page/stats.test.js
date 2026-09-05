// Acceptance tests for the /dev pipeline-stat generator and HTML injection.
// Usage: node stats.test.js      (REPO_DIR overrides the repo location)
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

const REPO = process.env.REPO_DIR || path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(REPO, "scripts", "dev-stats.mjs");
const REAL_OUTPUT = path.join(REPO, "api", "_lib", "dev-stats.json");
const FIXTURE = path.join(__dirname, "fixtures", "repo-radar.code_stats.sample.json");
const AGENT_FIXTURE = path.join(__dirname, "fixtures", "agent-stats.sample.json");
const { injectStats, loadStats } = require(path.join(REPO, "api", "_lib", "dev-stats.js"));
const TOKEN = "__DEV_STATS_JSON__";
const results = [];
const check = (name, condition) => {
  results.push([name, !!condition]);
  if (!condition) process.exitCode = 1;
};

function stamp(file) {
  try {
    const stat = fs.statSync(file);
    return { exists: true, mtimeMs: stat.mtimeMs };
  } catch (error) {
    if (error && error.code === "ENOENT") return { exists: false, mtimeMs: null };
    throw error;
  }
}

async function run() {
  const { generateStats } = await import(pathToFileURL(SCRIPT).href);
  const realBefore = stamp(REAL_OUTPUT);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "dev-stats-test-"));
  const output = path.join(temp, "dev-stats.json");
  const periods = {
    month: { commits: 10, merges: 4, additions: 300, deletions: 40, files: 25 },
    week: { commits: 6, merges: 2, additions: 180, deletions: 20, files: 14 },
  };

  function sourceFile(name, value) {
    const file = path.join(temp, name + ".json");
    fs.writeFileSync(file, JSON.stringify(value));
    return file;
  }

  function radar(commits) {
    return {
      generated_at: "2024-01-31T12:00:00Z",
      code_stats: { periods, commits },
    };
  }

  function generate(file) {
    generateStats(file, output, AGENT_FIXTURE);
    return JSON.parse(fs.readFileSync(output, "utf8"));
  }

  function runGenerator(radarFile, agentFile, outputName) {
    const cliOutput = path.join(temp, outputName);
    const warnings = [];
    const originalError = console.error;
    console.error = (...args) => warnings.push(args.join(" "));
    try {
      const stats = generateStats(radarFile, cliOutput, agentFile);
      return { status: 0, stats, stderr: warnings.join("\n") };
    } catch (error) {
      return { status: 1, stats: null, stderr: warnings.join("\n"), error };
    } finally {
      console.error = originalError;
    }
  }

  function rejectsShape(name, value) {
    try {
      generateStats(sourceFile(name, value), output);
      return false;
    } catch (error) {
      return error && error.code === "NO_CODE_STATS_COMMITS";
    }
  }

  try {
    const counted = generate(sourceFile("distinct", radar([
      { repo: "alpha", committer_date: "2024-01-31T11:00:00Z" },
      { repo: "alpha", committer_date: "2024-01-30T11:00:00Z" },
      { repo: "beta", committer_date: "2024-01-24T12:00:00Z" },
      { repo: "vendor", committer_date: "2024-01-31T10:00:00Z", third_party: true },
    ])));
    check("generator counts distinct eligible month repositories", counted.month.repos === 2);
    check("generator counts distinct eligible week repositories", counted.week.repos === 2);

    const atCutoff = generate(sourceFile("at-cutoff", radar([
      { repo: "cutoff", committer_date: "2024-01-01T12:00:00Z" },
    ])));
    check("repository exactly at the month cutoff is included", atCutoff.month.repos === 1);

    const beforeCutoff = generate(sourceFile("before-cutoff", radar([
      { repo: "before", committer_date: "2023-12-31T12:00:00Z" },
    ])));
    check("repository one day before the month cutoff is excluded", beforeCutoff.month.repos === 0);

    const afterGenerated = generate(sourceFile("after-generated", radar([
      { repo: "future", committer_date: "2024-02-01T12:00:00Z" },
    ])));
    check("repository after generated_at is excluded", afterGenerated.month.repos === 0);

    check("generator requires a code_stats object and commits array",
      rejectsShape("root-fallback", { generated_at: "2024-01-31T12:00:00Z", periods, commits: [] })
      && rejectsShape("non-array", { code_stats: { periods, commits: {} } }));

    const sample = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
    const wrappedFixture = sourceFile("fixture", {
      generated_at: sample.generated_at,
      code_stats: { periods: sample.periods, commits: [] },
    });
    const generated = generate(wrappedFixture);
    const expected = {
      generated_at: "2026-09-05T16:40:33.533945+00:00",
      window_days: 30,
      month: {
        commits: 1416,
        merges: 521,
        additions: 903437,
        deletions: 97931,
        files: 9039,
        repos: 0,
      },
      week: {
        commits: 664,
        merges: 301,
        additions: 293541,
        deletions: 56388,
        files: 3713,
        repos: 0,
      },
      agents: {
        sessions: 1830,
        per_day_avg: 61,
        claude: 640,
        codex: 1190,
        peak_day: "2026-09-04",
        peak: 143,
      },
      fleet: { machines: 3, cores: 40, memory_gb: 90, disk_gb: 1536 },
    };
    check("fixture generates the exact deployment object",
      assert.deepStrictEqual(generated, expected) === undefined);
    check("generator copies the selected agent summary",
      generated.agents.per_day_avg === 61 && generated.agents.claude === 640);
    check("generator copies the selected fleet summary",
      generated.fleet.cores === 40 && generated.fleet.disk_gb === 1536);
    check("generator omits detailed agent breakdowns",
      !("by_day" in generated.agents) && !("by_machine" in generated.agents));
    check("loadStats reads the generated file",
      assert.deepStrictEqual(loadStats(temp), expected) === undefined);

    const warning = "dev-stats: no agent stats (fleet/agents left empty)";
    const missingAgent = runGenerator(
      wrappedFixture,
      path.join(temp, "missing-agent.json"),
      "missing-output.json",
    );
    check("missing agent stats do not fail generation", missingAgent.status === 0);
    check("missing agent stats leave both summaries null",
      missingAgent.stats.agents === null && missingAgent.stats.fleet === null);
    check("missing agent stats print one warning line", missingAgent.stderr === warning);

    const malformedAgentFile = path.join(temp, "malformed-agent.json");
    fs.writeFileSync(malformedAgentFile, "{not json");
    const malformedAgent = runGenerator(wrappedFixture, malformedAgentFile, "malformed-output.json");
    check("malformed agent stats do not fail generation", malformedAgent.status === 0);
    check("malformed agent stats leave both summaries null",
      malformedAgent.stats.agents === null && malformedAgent.stats.fleet === null);
    check("malformed agent stats print one warning line", malformedAgent.stderr === warning);

    const missingDir = path.join(temp, "missing");
    check("loadStats returns null for a missing file", loadStats(missingDir) === null);
    fs.mkdirSync(missingDir);
    fs.writeFileSync(path.join(missingDir, "dev-stats.json"), "not json");
    check("loadStats returns null for malformed JSON", loadStats(missingDir) === null);

    const shell = `<script type="application/json">${TOKEN}</script>`;
    const injected = injectStats(shell, { month: { commits: 12 } });
    check("injectStats inserts JSON and removes the token",
      injected.includes('{"month":{"commits":12}}') && !injected.includes(TOKEN));
    check("injectStats inserts null", injectStats(shell, null).includes(">null</script>"));
    const escaped = injectStats(shell, { value: "</script><p>unsafe</p>" });
    check("injectStats escapes closing tags for script safety",
      escaped.includes("<\\/script>") && escaped.includes("<\\/p>") && !escaped.includes("</script><p>"));
    const dollars = injectStats(shell, { value: "keep $& verbatim" });
    check("injectStats preserves replacement-pattern text verbatim",
      dollars.includes('{"value":"keep $& verbatim"}'));
    const withoutToken = "<p>Nothing to inject.</p>";
    check("injectStats leaves HTML without the token unchanged",
      injectStats(withoutToken, generated) === withoutToken);
  } finally {
    const realAfter = stamp(REAL_OUTPUT);
    check("stats test leaves the real output file untouched",
      realAfter.exists === realBefore.exists && realAfter.mtimeMs === realBefore.mtimeMs);
    fs.rmSync(temp, { recursive: true, force: true });
  }

  for (const [name, ok] of results) console.log((ok ? "PASS" : "FAIL") + "  " + name);
  console.log(results.filter((result) => result[1]).length + "/" + results.length + " checks passed");
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
