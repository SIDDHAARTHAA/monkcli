#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, "..");
const customPrefix = process.env.MONKCLI_NPM_PREFIX?.trim() || "";
const defaultUnixPrefix = process.platform === "win32" ? "" : path.join(os.homedir(), ".local");
const targetPrefix = customPrefix || defaultUnixPrefix;

const installTargets = [
  repoDir,
  path.join(repoDir, "packages", "contracts"),
  path.join(repoDir, "packages", "engine"),
  path.join(repoDir, "packages", "storage-local"),
  path.join(repoDir, "apps", "cli"),
];

function run(cmd, args, cwd = repoDir) {
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

function capture(cmd, args, cwd = repoDir) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return (result.stdout ?? "").trim();
}

function resolveBinDir(prefix) {
  return process.platform === "win32" ? prefix : path.join(prefix, "bin");
}

async function clearPnpmNodeModules(cwd) {
  const nodeModules = path.join(cwd, "node_modules");
  const pnpmLayout = path.join(nodeModules, ".pnpm");

  if (existsSync(pnpmLayout)) {
    process.stdout.write(`Detected pnpm layout in ${nodeModules}; resetting for npm install.\n`);
    await rm(nodeModules, { recursive: true, force: true });
  }
}

if (!existsSync(path.join(repoDir, "package.json"))) {
  process.stderr.write(`Error: package.json not found in ${repoDir}\n`);
  process.exit(1);
}

for (const cwd of installTargets) {
  await clearPnpmNodeModules(cwd);
  run("npm", ["install", "--no-package-lock", "--legacy-peer-deps"], cwd);
}

run("npm", ["run", "build"], repoDir);

const linkArgs = ["link"];
let prefixForInfo = targetPrefix;

if (targetPrefix) {
  const binDir = resolveBinDir(targetPrefix);
  const libDir = path.join(targetPrefix, "lib");
  const nodeModulesDir = path.join(targetPrefix, "node_modules");

  await mkdir(binDir, { recursive: true });
  await mkdir(libDir, { recursive: true });
  await mkdir(nodeModulesDir, { recursive: true });

  const legacyBin = path.join(binDir, process.platform === "win32" ? "monkcli.cmd" : "monkcli");
  if (existsSync(legacyBin)) {
    try {
      await rm(legacyBin, { force: true });
    } catch {
      // Ignore cleanup failures and let npm link handle overwrite/diagnostics.
    }
  }

  linkArgs.push("--prefix", targetPrefix);
} else {
  prefixForInfo = capture("npm", ["config", "get", "prefix"]);
}

linkArgs.push(repoDir);
run("npm", linkArgs);

const binDir = resolveBinDir(prefixForInfo);
const commandPath = path.join(binDir, process.platform === "win32" ? "monkcli.cmd" : "monkcli");

process.stdout.write(
  [
    "Global launcher installed via npm link.",
    "",
    `Binary location: ${commandPath}`,
    "",
    "You can now run:",
    "  monkcli",
    "",
  ].join("\n"),
);

const finder = process.platform === "win32" ? "where" : "which";
const check = spawnSync(finder, ["monkcli"], {
  stdio: "ignore",
  shell: process.platform === "win32",
});

if ((check.status ?? 1) !== 0) {
  if (process.platform === "win32") {
    process.stdout.write("If command is not found, restart terminal so PATH updates are applied.\n");
  } else {
    process.stdout.write(
      `If command is not found, add this to your shell profile:\n  export PATH=\"${binDir}:\\$PATH\"\n`,
    );
  }
}
