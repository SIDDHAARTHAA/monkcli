import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type LanguageDataset = {
  name: string;
  words: string[];
  orderedByFrequency?: boolean;
};

type LoadLanguageOptions = {
  engineDataDir?: string;
};

export function resolveEngineDataDir(engineDataDir?: string): string {
  const envDir = process.env.MONKCLI_ENGINE_DATA_DIR;
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const moduleRelative = path.resolve(moduleDir, "../../../engine-data");

  const candidates = [
    engineDataDir,
    envDir,
    path.resolve(process.cwd(), "engine-data"),
    path.resolve(process.cwd(), "../engine-data"),
    path.resolve(process.cwd(), "../../engine-data"),
    moduleRelative,
  ].filter((candidate): candidate is string => !!candidate);

  for (const candidate of candidates) {
    const probe = path.join(candidate, "frontend", "static", "languages");
    if (existsSync(probe)) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to resolve engine-data directory. Set MONKCLI_ENGINE_DATA_DIR or run from monkcli root.",
  );
}

export async function loadLanguageDataset(
  language: string,
  options: LoadLanguageOptions = {},
): Promise<LanguageDataset> {
  const engineDataDir = resolveEngineDataDir(options.engineDataDir);
  const filePath = path.join(
    engineDataDir,
    "frontend",
    "static",
    "languages",
    `${language}.json`,
  );

  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as LanguageDataset;

  if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
    throw new Error(`Language dataset ${language} has no words`);
  }

  return parsed;
}

export async function loadLanguageWords(
  language: string,
  options: LoadLanguageOptions = {},
): Promise<string[]> {
  const dataset = await loadLanguageDataset(language, options);
  return dataset.words;
}

export async function listAvailableLanguages(
  options: LoadLanguageOptions = {},
): Promise<string[]> {
  const engineDataDir = resolveEngineDataDir(options.engineDataDir);
  const languagesDir = path.join(engineDataDir, "frontend", "static", "languages");
  const entries = await fs.readdir(languagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort();
}
