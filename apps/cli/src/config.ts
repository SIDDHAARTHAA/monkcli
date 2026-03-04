import path from "node:path";
import { fileURLToPath } from "node:url";

export const LANGUAGE = "english";
export const WORD_TARGET = 10;
export const TIME_TARGET_SECONDS = 30;
export const TIME_MODE_WORD_POOL = 120;

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ENGINE_DATA_DIR = path.resolve(APP_DIR, "../../../engine-data");
