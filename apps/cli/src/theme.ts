export type ThemeMode = "auto" | "high-contrast" | "mono";

function parseThemeMode(value: string | undefined): ThemeMode {
  if (!value) return "auto";
  const normalized = value.trim().toLowerCase();
  if (normalized === "high-contrast") return "high-contrast";
  if (normalized === "mono" || normalized === "no-color") return "mono";
  return "auto";
}

export const THEME_MODE: ThemeMode = parseThemeMode(process.env.MONKCLI_THEME);

const noColorEnv =
  process.env.NO_COLOR !== undefined ||
  process.env.MONKCLI_NO_COLOR === "1" ||
  process.env.MONKCLI_NO_COLOR === "true";

const colorDepth = typeof process.stdout.getColorDepth === "function"
  ? process.stdout.getColorDepth()
  : 1;

const ttySupportsColor = Boolean(process.stdout.isTTY) && colorDepth >= 4;

export const COLORS_ENABLED = THEME_MODE !== "mono" && ttySupportsColor && !noColorEnv;
export const HIGH_CONTRAST = THEME_MODE === "high-contrast" || !COLORS_ENABLED;
