import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const defaultSourceFile = process.env.REPO_RADAR_JSON
  || path.join(os.homedir(), ".config", "ai-dev", "repo-radar", "repo-radar.json");
const defaultOutputFile = process.env.DEV_STATS_OUT
  || path.join(repo, "api", "_lib", "dev-stats.json");
const defaultAgentStatsFile = process.env.AGENT_STATS_JSON
  || path.join(os.homedir(), ".config", "ai-dev", "agent-stats.json");

const AGENT_KEYS = ["sessions", "per_day_avg", "claude", "codex", "peak_day", "peak"];
const FLEET_KEYS = ["machines", "cores", "memory_gb", "disk_gb"];

function selectedValues(source, keys) {
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(source, key))
    .map((key) => [key, source[key]]));
}

function readAgentStats(agentStatsFile) {
  try {
    const source = JSON.parse(fs.readFileSync(agentStatsFile, "utf8"));
    const validAgents = source && typeof source.agents === "object"
      && !Array.isArray(source.agents);
    const validFleet = source && typeof source.fleet === "object"
      && !Array.isArray(source.fleet);
    if (!validAgents || !validFleet) return null;
    return {
      agents: selectedValues(source.agents, AGENT_KEYS),
      fleet: selectedValues(source.fleet, FLEET_KEYS),
    };
  } catch {
    return null;
  }
}

export function generateStats(
  sourceFile = defaultSourceFile,
  outputFile = defaultOutputFile,
  agentStatsFile = defaultAgentStatsFile,
) {
  const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
  const validCodeStats = source && typeof source.code_stats === "object"
    && !Array.isArray(source.code_stats) && Array.isArray(source.code_stats.commits);
  if (!validCodeStats) {
    const error = new Error("invalid code_stats.commits");
    error.code = "NO_CODE_STATS_COMMITS";
    throw error;
  }
  const codeStats = source.code_stats;
  const generatedAt = codeStats.generated_at || source.generated_at;
  const generatedMs = Date.parse(generatedAt);

  function repoCount(days) {
    if (!Number.isFinite(generatedMs)) return 0;
    const cutoff = generatedMs - days * 24 * 60 * 60 * 1000;
    const repos = new Set();
    for (const commit of codeStats.commits) {
      const committedMs = Date.parse(commit.committer_date);
      if (commit.third_party === true || typeof commit.repo !== "string" || !commit.repo) continue;
      if (!Number.isFinite(committedMs) || committedMs < cutoff || committedMs > generatedMs) continue;
      repos.add(commit.repo);
    }
    return repos.size;
  }

  function period(name, days) {
    const value = codeStats.periods[name];
    return {
      commits: value.commits,
      merges: value.merges,
      additions: value.additions,
      deletions: value.deletions,
      files: value.files,
      repos: repoCount(days),
    };
  }

  const agentStats = readAgentStats(agentStatsFile);
  if (!agentStats) {
    console.error("dev-stats: no agent stats (fleet/agents left empty)");
  }
  const stats = {
    generated_at: generatedAt,
    window_days: 30,
    month: period("month", 30),
    week: period("week", 7),
    agents: agentStats ? agentStats.agents : null,
    fleet: agentStats ? agentStats.fleet : null,
  };

  fs.writeFileSync(outputFile, `${JSON.stringify(stats, null, 2)}\n`, { mode: 0o600 });
  return stats;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    generateStats();
  } catch (error) {
    console.error(error && error.code === "NO_CODE_STATS_COMMITS"
      ? "dev-stats: source has no code_stats.commits"
      : "dev-stats: could not read the source file");
    process.exitCode = 1;
  }
}
