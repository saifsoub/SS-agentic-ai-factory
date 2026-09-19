import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
  "../.github/workflows/unrestricted-factory.yml",
  import.meta.url,
);
const ciPath = new URL("../.github/workflows/ci.yml", import.meta.url);

test("unrestricted executor has no S/Agency operational secrets", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  for (const forbidden of [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
    "MONDAY_API_TOKEN",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    assert.equal(workflow.includes(forbidden), false, `${forbidden} must stay outside the executor`);
  }
  assert.match(workflow, /S_FACTORY_EXECUTOR_COPILOT_TOKEN/);
});

test("unrestricted execution happens in a disposable Docker boundary", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  const executor = workflow.slice(workflow.indexOf("  execute:"));
  assert.match(workflow, /permissions:\s*\{\}/);
  assert.match(executor, /docker run --rm/);
  assert.match(executor, /--user "\$\(id -u\):\$\(id -g\)"/);
  assert.match(executor, /--cap-drop ALL/);
  assert.match(executor, /--security-opt no-new-privileges/);
  assert.match(executor, /--allow-all-tools/);
  assert.match(executor, /--allow-all-paths/);
  assert.match(executor, /--allow-all-urls/);
  assert.doesNotMatch(executor, /docker\.sock/);
  assert.doesNotMatch(executor, /--network[= ]host/);
  assert.doesNotMatch(executor, /actions\/checkout/);
});

test("only validated output is uploaded", async () => {
  const workflow = await readFile(workflowPath, "utf8");
  const validation = workflow.indexOf("verify-unrestricted-output.mjs");
  const upload = workflow.indexOf("actions/upload-artifact");
  assert.ok(validation >= 0, "output validation step is required");
  assert.ok(upload > validation, "artifact upload must happen after validation");
  assert.match(workflow, /path:\s*workspace\/output\//);
});

test("pull requests run the factory security tests", async () => {
  const ci = await readFile(ciPath, "utf8");
  assert.match(ci, /pull_request:/);
  assert.match(ci, /npm test/);
});
