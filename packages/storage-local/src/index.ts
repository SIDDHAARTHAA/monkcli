import { existsSync, promises as fs } from "node:fs";
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

type StoredStatsFile = {
  version: 1;
  stats: StoredStats;
};

export type StoredStats = {
  totalTests: number;
  sumWpm: number;
  sumAccuracy: number;
  averageWpm: number;
  averageAccuracy: number;
};

const CURRENT_VERSION = 1;
const APP_NAME = "monkcli";

const EMPTY_STATS: StoredStats = {
  totalTests: 0,
  sumWpm: 0,
  sumAccuracy: 0,
  averageWpm: 0,
  averageAccuracy: 0,
};

function resolveConfigDir(): string {
  if (process.env.MONKCLI_CONFIG_DIR) {
    return process.env.MONKCLI_CONFIG_DIR;
  }

  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, APP_NAME);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  }

  const xdgConfig = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config");
  return path.join(xdgConfig, APP_NAME);
}

function resolveDataDir(): string {
  if (process.env.MONKCLI_DATA_DIR) {
    return process.env.MONKCLI_DATA_DIR;
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, APP_NAME);
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", APP_NAME);
  }

  const xdgState = process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local", "state");
  return path.join(xdgState, APP_NAME);
}

function resolveLegacyDir(): string {
  return path.join(os.homedir(), ".monkcli");
}

export function resolveResultsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(resolveDataDir(), "results.json");
}

export function resolveStatsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(resolveDataDir(), "stats.json");
}

export function resolveSettingsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(resolveConfigDir(), "settings.json");
}

function resolveLegacyResultsFilePath(): string {
  return path.join(resolveLegacyDir(), "results.json");
}

function resolveLegacySettingsFilePath(): string {
  return path.join(resolveLegacyDir(), "settings.json");
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

function normalizeStats(raw: unknown): StoredStats {
  if (!raw || typeof raw !== "object") return EMPTY_STATS;

  const candidate = raw as Partial<StoredStats>;
  const totalTests = Number.isFinite(candidate.totalTests) ? Math.max(0, Number(candidate.totalTests)) : 0;
  const sumWpm = Number.isFinite(candidate.sumWpm) ? Math.max(0, Number(candidate.sumWpm)) : 0;
  const sumAccuracy = Number.isFinite(candidate.sumAccuracy)
    ? Math.max(0, Number(candidate.sumAccuracy))
    : 0;

  if (totalTests === 0) return EMPTY_STATS;

  const averageWpm = sumWpm / totalTests;
  const averageAccuracy = sumAccuracy / totalTests;

  return {
    totalTests,
    sumWpm,
    sumAccuracy,
    averageWpm,
    averageAccuracy,
  };
}

function calculateStatsFromHistory(history: TestResult[]): StoredStats {
  if (history.length === 0) return EMPTY_STATS;

  let sumWpm = 0;
  let sumAccuracy = 0;

  for (const result of history) {
    sumWpm += result.wpm;
    sumAccuracy += result.accuracy;
  }

  const totalTests = history.length;

  return {
    totalTests,
    sumWpm,
    sumAccuracy,
    averageWpm: sumWpm / totalTests,
    averageAccuracy: sumAccuracy / totalTests,
  };
}

async function writeStats(stats: StoredStats, customPath?: string): Promise<void> {
  const filePath = resolveStatsFilePath(customPath);
  const payload: StoredStatsFile = {
    version: CURRENT_VERSION,
    stats,
  };

  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
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
    if (err.code === "ENOENT" && !customPath) {
      const legacyPath = resolveLegacyResultsFilePath();
      if (!existsSync(legacyPath)) return [];

      const rawLegacy = await fs.readFile(legacyPath, "utf8");
      const parsedLegacy = JSON.parse(rawLegacy) as StoredResultsFile;
      return Array.isArray(parsedLegacy.results) ? parsedLegacy.results : [];
    }

    if (err.code === "ENOENT") return [];
    throw error;
  }
}

export async function readStoredStats(customPath?: string): Promise<StoredStats> {
  const filePath = resolveStatsFilePath(customPath);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as StoredStatsFile;
    return normalizeStats(parsed.stats);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }

    const history = await readStoredResults();
    const derived = calculateStatsFromHistory(history);

    if (derived.totalTests > 0) {
      await writeStats(derived, customPath);
    }

    return derived;
  }
}

export async function saveResultAndUpdateStats(
  result: TestResult,
  customResultsPath?: string,
  customStatsPath?: string,
): Promise<StoredStats> {
  const filePath = resolveResultsFilePath(customResultsPath);
  const existing = await readStoredResults(filePath);

  const payload: StoredResultsFile = {
    version: CURRENT_VERSION,
    results: [result, ...existing],
  };

  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

  const currentStats = await readStoredStats(customStatsPath);
  const totalTests = currentStats.totalTests + 1;
  const sumWpm = currentStats.sumWpm + result.wpm;
  const sumAccuracy = currentStats.sumAccuracy + result.accuracy;

  const nextStats: StoredStats = {
    totalTests,
    sumWpm,
    sumAccuracy,
    averageWpm: sumWpm / totalTests,
    averageAccuracy: sumAccuracy / totalTests,
  };

  await writeStats(nextStats, customStatsPath);
  return nextStats;
}

export async function saveResult(
  result: TestResult,
  customPath?: string,
): Promise<void> {
  await saveResultAndUpdateStats(result, customPath);
}

export async function clearStoredResults(customPath?: string): Promise<void> {
  const filePath = resolveResultsFilePath(customPath);
  const payload: StoredResultsFile = {
    version: CURRENT_VERSION,
    results: [],
  };
  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  const customStatsPath = customPath ? path.join(path.dirname(customPath), "stats.json") : undefined;
  await writeStats(EMPTY_STATS, customStatsPath);
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

    if (err.code === "ENOENT" && !customPath) {
      const legacyPath = resolveLegacySettingsFilePath();
      if (!existsSync(legacyPath)) return defaultSettings;

      const rawLegacy = await fs.readFile(legacyPath, "utf8");
      const parsedLegacy = JSON.parse(rawLegacy) as StoredSettingsFile;
      return mergeSettings(defaultSettings, parsedLegacy);
    }

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
