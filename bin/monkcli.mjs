#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const thisFile = await realpath(fileURLToPath(import.meta.url));
const binDir = path.dirname(thisFile);
const packageDir = path.resolve(binDir, "..");
const packageJsonPath = path.join(packageDir, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const entrypoint = path.join(packageDir, "dist", "monkcli.js");

function printHelp() {
  process.stdout.write(
    [
      "monkcli",
      "",
      "Usage:",
      "  monkcli",
      "  monkcli --help",
      "  monkcli --version",
      "",
      "A terminal typing test inspired by Monkeytype.",
      "",
    ].join("\n"),
  );
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  process.stdout.write(`${packageJson.version}\n`);
  process.exit(0);
}

if (!existsSync(entrypoint)) {
  process.stderr.write(
    [
      "Error: monkcli is not built correctly.",
      "",
      "If you are developing locally, run:",
      "  npm install",
      "  npm run build",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

if (!process.env.MONKCLI_ENGINE_DATA_DIR) {
  process.env.MONKCLI_ENGINE_DATA_DIR = path.join(packageDir, "engine-data");
}

await import(pathToFileURL(entrypoint).href);
