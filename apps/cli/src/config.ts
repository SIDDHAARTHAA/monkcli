import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UserSettings } from "@monkcli/contracts";

export const DEFAULT_LANGUAGE = "english";
export const WORD_TARGET_OPTIONS = [10, 20, 50, 100] as const;
export const TIME_TARGET_OPTIONS = [15, 30, 60, 120] as const;
export const TIME_MODE_WORD_POOL = 120;

export const DEFAULT_SETTINGS: UserSettings = {
  language: DEFAULT_LANGUAGE,
  mode: "time",
  wordTarget: 10,
  timeTargetSeconds: 30,
};

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ENGINE_DATA_DIR = path.resolve(APP_DIR, "../../../engine-data");
