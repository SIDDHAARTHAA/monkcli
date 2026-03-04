import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { TestResult } from "@monkcli/contracts";

type StoredResultsFile = {
  version: 1;
  results: TestResult[];
};

const CURRENT_VERSION = 1;

export function resolveResultsFilePath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(os.homedir(), ".monkcli", "results.json");
}

async function ensureParent(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
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
