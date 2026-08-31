import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VENDOR_DIR = join(HERE, ".vendor");
const OPENBROWSER_DIR = join(VENDOR_DIR, "openbrowser");
const OPENBROWSER_REPO = "https://github.com/OpenBrowserAI/openbrowser.git";
const OPENBROWSER_COMMIT = "b04fcf631fe67ddf7ab6d54f6388635d16f468f9";

function run(command, args, cwd = HERE) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd, stdio: "inherit", env: process.env });
}

function requireNode24() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 24) {
    throw new Error(`S/Browser Stack requires Node >=24; current=${process.versions.node}`);
  }
}

function pnpm(args, cwd) {
  try {
    execFileSync("pnpm", ["--version"], { stdio: "ignore" });
    run("pnpm", args, cwd);
  } catch {
    run("corepack", ["pnpm", ...args], cwd);
  }
}

requireNode24();
mkdirSync(VENDOR_DIR, { recursive: true });

// 1) Browserbase Stagehand + Vercel Labs agent-browser, pinned in this subproject.
run("npm", ["install", "--no-audit", "--no-fund"], HERE);

// 2) Install the Chrome-for-Testing runtime used by agent-browser.
const chromeInstallArgs = ["--no-install", "agent-browser", "install"];
if (process.env.AGENT_BROWSER_INSTALL_WITH_DEPS === "1") chromeInstallArgs.push("--with-deps");
run("npx", chromeInstallArgs, HERE);

// 3) Materialize OpenBrowser at an explicit reviewed commit, then install/build it.
if (!existsSync(join(OPENBROWSER_DIR, ".git"))) {
  run("git", ["clone", "--filter=blob:none", OPENBROWSER_REPO, OPENBROWSER_DIR], VENDOR_DIR);
} else {
  run("git", ["fetch", "origin", "--tags", "--prune"], OPENBROWSER_DIR);
}
run("git", ["checkout", "--detach", OPENBROWSER_COMMIT], OPENBROWSER_DIR);
pnpm(["install", "--frozen-lockfile"], OPENBROWSER_DIR);
// Call the recursive workspace build directly so it also works when pnpm is supplied by Corepack only.
pnpm(["-r", "--sequential", "build"], OPENBROWSER_DIR);

console.log("\nS/Browser Stack bootstrap complete.");
console.log("- OpenBrowser: source installed and built at pinned commit");
console.log("- Stagehand: installed locally (Browserbase credentials are injected only at runtime)");
console.log("- agent-browser: installed locally with Chrome for Testing");
console.log("Run: npm run browser:verify");
