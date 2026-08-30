import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const forbiddenBasenames = new Set([
  ".env",
  ".npmrc",
  ".pypirc",
  "id_ed25519",
  "id_rsa",
]);

const credentialPatterns = [
  /github_pat_[A-Za-z0-9_]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:COPILOT_GITHUB_TOKEN|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*\S+/,
];

function assertSafePath(relativePath) {
  const parts = relativePath.split("/");
  const basename = parts.at(-1);
  const forbiddenDirectory = parts.some((part) => part === ".git" || part === ".ssh");
  const forbiddenExtension = /\.(?:key|p12|pem|pfx)$/i.test(basename);
  if (forbiddenDirectory || forbiddenBasenames.has(basename) || forbiddenExtension) {
    throw new Error(`Forbidden output path: ${relativePath}`);
  }
}

export async function validateOutputTree(
  root,
  { maxBytes = 100 * 1024 * 1024, maxFiles = 5000 } = {},
) {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) {
    throw new Error("Factory output root must be a directory");
  }

  const files = [];
  let totalBytes = 0;

  async function walk(directory, relativeDirectory = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      const absolutePath = path.join(directory, entry.name);
      const stat = await lstat(absolutePath);

      if (stat.isSymbolicLink()) {
        throw new Error(`Symbolic links are forbidden: ${relativePath}`);
      }
      if (stat.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }
      if (!stat.isFile()) {
        throw new Error(`Only regular files are allowed: ${relativePath}`);
      }

      assertSafePath(relativePath);

      files.push(relativePath);
      if (files.length > maxFiles) {
        throw new Error(`Output exceeds ${maxFiles} files`);
      }
      totalBytes += stat.size;
      if (totalBytes > maxBytes) {
        throw new Error(`Output exceeds ${maxBytes} bytes`);
      }

      if (stat.size <= 2 * 1024 * 1024) {
        const content = await readFile(absolutePath, "utf8");
        if (credentialPatterns.some((pattern) => pattern.test(content))) {
          throw new Error(`Potential credential material found: ${relativePath}`);
        }
      }
    }
  }

  await walk(root);
  files.sort();
  return { files, totalBytes };
}
