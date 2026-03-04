import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { TestResult, UserSettings } from "@monkcli/contracts";

type StoredResultsFile = {
  version: 1;
  results: TestResult[];
};

type StoredSettingsFile = {
  version: 1;
  settings: UserSettings;
};

const CURRENT_VERSION = 1;

export function resolveResultsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(os.homedir(), ".monkcli", "results.json");
}

export function resolveSettingsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(os.homedir(), ".monkcli", "settings.json");
}

async function ensureParent(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function mergeSettings(defaultSettings: UserSettings, stored: unknown): UserSettings {
  if (!stored || typeof stored !== "object") return defaultSettings;

  const maybeSettings = (stored as { settings?: Partial<UserSettings> }).settings;
  if (!maybeSettings || typeof maybeSettings !== "object") return defaultSettings;

  return {
    language: maybeSettings.language ?? defaultSettings.language,
    mode: maybeSettings.mode ?? defaultSettings.mode,
    wordTarget: maybeSettings.wordTarget ?? defaultSettings.wordTarget,
    timeTargetSeconds: maybeSettings.timeTargetSeconds ?? defaultSettings.timeTargetSeconds,
  };
}

export async function readStoredResults(customPath?: string): Promise<TestResult[]> {
  const filePath = resolveResultsFilePath(customPath);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredResultsFile;
    if (!Array.isArray(parsed.results)) return [];
    return parsed.results;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveResult(
  result: TestResult,
  customPath?: string,
): Promise<void> {
  const filePath = resolveResultsFilePath(customPath);
  const existing = await readStoredResults(filePath);

  const payload: StoredResultsFile = {
    version: CURRENT_VERSION,
    results: [result, ...existing],
  };

  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function clearStoredResults(customPath?: string): Promise<void> {
  const filePath = resolveResultsFilePath(customPath);
  const payload: StoredResultsFile = {
    version: CURRENT_VERSION,
    results: [],
  };
  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function readStoredSettings(
  defaultSettings: UserSettings,
  customPath?: string,
): Promise<UserSettings> {
  const filePath = resolveSettingsFilePath(customPath);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredSettingsFile;
    return mergeSettings(defaultSettings, parsed);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return defaultSettings;
    }
    throw error;
  }
}

export async function saveSettings(
  settings: UserSettings,
  customPath?: string,
): Promise<void> {
  const filePath = resolveSettingsFilePath(customPath);
  const payload: StoredSettingsFile = {
    version: CURRENT_VERSION,
    settings,
  };

  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}
