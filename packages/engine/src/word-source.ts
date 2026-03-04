import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type LanguageDataset = {
  name: string;
  words: string[];
  orderedByFrequency?: boolean;
};

type QuoteRecord = {
  text: string;
  source?: string;
  length?: number;
  id?: number;
};

type QuoteDataset = {
  language: string;
  groups?: number[][];
  quotes: QuoteRecord[];
};

type LoadLanguageOptions = {
  engineDataDir?: string;
};

function normalizeLanguageDataset(raw: unknown, fallbackName: string): LanguageDataset {
  // Support both Monkeytype object datasets and plain string[] word lists.
  if (Array.isArray(raw)) {
    const words = raw.filter((entry): entry is string => typeof entry === "string");
    return {
      name: fallbackName,
      words,
      orderedByFrequency: false,
    };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as {
      name?: unknown;
      words?: unknown;
      orderedByFrequency?: unknown;
    };
    const words = Array.isArray(obj.words)
      ? obj.words.filter((entry): entry is string => typeof entry === "string")
      : [];

    return {
      name: typeof obj.name === "string" ? obj.name : fallbackName,
      words,
      orderedByFrequency:
        typeof obj.orderedByFrequency === "boolean" ? obj.orderedByFrequency : undefined,
    };
  }

  return {
    name: fallbackName,
    words: [],
  };
}

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
  const parsed = normalizeLanguageDataset(JSON.parse(raw), language);

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

export async function loadQuoteDataset(
  language: string,
  options: LoadLanguageOptions = {},
): Promise<QuoteDataset> {
  const engineDataDir = resolveEngineDataDir(options.engineDataDir);
  const filePath = path.join(
    engineDataDir,
    "frontend",
    "static",
    "quotes",
    `${language}.json`,
  );

  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as QuoteDataset;

  if (!Array.isArray(parsed.quotes) || parsed.quotes.length === 0) {
    throw new Error(`Quote dataset ${language} has no quotes`);
  }

  return parsed;
}

export async function loadQuoteTexts(
  language: string,
  options: LoadLanguageOptions = {},
): Promise<string[]> {
  const dataset = await loadQuoteDataset(language, options);
  return dataset.quotes
    .map((quote) => quote.text)
    .filter((text): text is string => typeof text === "string" && text.trim().length > 0);
}
