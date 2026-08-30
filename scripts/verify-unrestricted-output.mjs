import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { validateOutputTree } from "./unrestricted-output-policy.mjs";

const outputRoot = path.resolve(process.argv[2] ?? "workspace/output");
const summary = await validateOutputTree(outputRoot);
await writeFile(
  path.join(outputRoot, "factory-validation.json"),
  `${JSON.stringify({ schemaVersion: 1, ...summary }, null, 2)}\n`,
  { flag: "w" },
);
process.stdout.write(`${JSON.stringify(summary)}\n`);
