#!/usr/bin/env node
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, "..");
const customPrefix = process.env.MONKCLI_NPM_PREFIX?.trim() || "";
const defaultUnixPrefix = process.platform === "linux" ? path.join(os.homedir(), ".local") : "";
const targetPrefix = customPrefix || defaultUnixPrefix;

function runBestEffort(cmd, args, cwd = repoDir) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function resolveBinDir(prefix) {
  return process.platform === "win32" ? prefix : path.join(prefix, "bin");
}

const unlinkArgs = targetPrefix
  ? ["unlink", "--prefix", targetPrefix, "monkcli"]
  : ["unlink", "-g", "monkcli"];

const status = runBestEffort("npm", unlinkArgs);
if (status !== 0) {
  process.stdout.write("monkcli was not globally linked (or already removed). Continuing cleanup.\n");
}

if (targetPrefix) {
  const binDir = resolveBinDir(targetPrefix);
  const names = process.platform === "win32"
    ? ["monkcli", "monkcli.cmd", "monkcli.ps1"]
    : ["monkcli"];

  for (const name of names) {
    const p = path.join(binDir, name);
    if (existsSync(p)) {
      await rm(p, { force: true });
    }
  }
}

process.stdout.write("monkcli global launcher removed.\n");
