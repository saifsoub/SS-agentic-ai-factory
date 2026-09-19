import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateOutputTree } from "../scripts/unrestricted-output-policy.mjs";

const execFileAsync = promisify(execFile);

test("accepts ordinary generated files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await mkdir(path.join(root, "site"));
  await writeFile(path.join(root, "site", "index.html"), "<h1>S/Factory</h1>");

  const result = await validateOutputTree(root);

  assert.deepEqual(result.files, ["site/index.html"]);
  assert.equal(result.totalBytes, 18);
});

test("rejects symbolic links so artifacts cannot escape the workspace", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await symlink("/etc/passwd", path.join(root, "leak"));

  await assert.rejects(
    validateOutputTree(root),
    /Symbolic links are forbidden: leak/,
  );
});

test("rejects output larger than the configured artifact budget", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await writeFile(path.join(root, "large.bin"), Buffer.alloc(11));

  await assert.rejects(
    validateOutputTree(root, { maxBytes: 10 }),
    /Output exceeds 10 bytes/,
  );
});

test("rejects credential-bearing files from the artifact", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await writeFile(path.join(root, "result.txt"), "token=github_pat_AAAAAAAAAAAAAAAAAAAA");

  await assert.rejects(
    validateOutputTree(root),
    /Potential credential material found: result.txt/,
  );
});

test("rejects runtime environment files but permits examples", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await writeFile(path.join(root, ".env"), "SAFE=false");

  await assert.rejects(validateOutputTree(root), /Forbidden output path: \.env/);
});

test("verification CLI adds a visible trusted manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "factory-output-"));
  await writeFile(path.join(root, "result.txt"), "ready");

  await execFileAsync(process.execPath, [
    new URL("../scripts/verify-unrestricted-output.mjs", import.meta.url).pathname,
    root,
  ]);

  const manifest = JSON.parse(
    await import("node:fs/promises").then(({ readFile }) =>
      readFile(path.join(root, "factory-validation.json"), "utf8"),
    ),
  );
  assert.deepEqual(manifest.files, ["result.txt"]);
});
