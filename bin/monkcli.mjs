#!/usr/bin/env node
import { existsSync } from "node:fs";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const thisFile = await realpath(fileURLToPath(import.meta.url));
const binDir = path.dirname(thisFile);
const repoDir = path.resolve(binDir, "..");
const entrypoint = path.join(repoDir, "apps", "cli", "dist", "index.js");

if (!existsSync(entrypoint)) {
  process.stderr.write(
    [
      "Error: monkcli is not built yet.",
      "",
      "Run this once from the repo root:",
      "  npm run install:global",
      "",
      "Or manually:",
      "  npm install",
      "  npm run build",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (!process.env.MONKCLI_ENGINE_DATA_DIR) {
  process.env.MONKCLI_ENGINE_DATA_DIR = path.join(repoDir, "engine-data");
}

await import(pathToFileURL(entrypoint).href);
