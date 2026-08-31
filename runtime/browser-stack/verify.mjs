import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OPENBROWSER_DIR = join(HERE, ".vendor", "openbrowser");
const OPENBROWSER_COMMIT = "b04fcf631fe67ddf7ab6d54f6388635d16f468f9";

function capture(command, args, cwd = HERE) {
  return execFileSync(command, args, { cwd, encoding: "utf8", env: process.env }).trim();
}

const report = {
  node: process.versions.node,
  stagehand: { ok: false, version: "4.0.2" },
  agentBrowser: { ok: false, version: null, smoke: false },
  openBrowser: { ok: false, commit: null },
};

const stagehand = await import("@browserbasehq/stagehand");
report.stagehand.ok = Boolean(stagehand.Stagehand);

report.agentBrowser.version = capture("npx", ["--no-install", "agent-browser", "--version"]);
report.agentBrowser.ok = report.agentBrowser.version.includes("0.35.2") || report.agentBrowser.version === "0.35.2";

try {
  capture("npx", ["--no-install", "agent-browser", "open", "about:blank"]);
  capture("npx", ["--no-install", "agent-browser", "snapshot"]);
  report.agentBrowser.smoke = true;
} finally {
  try { capture("npx", ["--no-install", "agent-browser", "close"]); } catch {}
}

if (existsSync(join(OPENBROWSER_DIR, ".git"))) {
  report.openBrowser.commit = capture("git", ["rev-parse", "HEAD"], OPENBROWSER_DIR);
  report.openBrowser.ok = report.openBrowser.commit === OPENBROWSER_COMMIT;
}

console.log(JSON.stringify(report, null, 2));

if (!report.stagehand.ok || !report.agentBrowser.ok || !report.agentBrowser.smoke || !report.openBrowser.ok) {
  process.exitCode = 1;
}
