#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, "..");

const buildTargets = [
  path.join(repoDir, "packages", "contracts"),
  path.join(repoDir, "packages", "engine"),
  path.join(repoDir, "packages", "storage-local"),
  path.join(repoDir, "apps", "cli"),
];

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const cwd of buildTargets) {
  run("npm", ["run", "build"], cwd);
}
