import { useCallback, useEffect, useMemo, useState } from "react";
import type { TestMode, TestResult, UserSettings } from "@monkcli/contracts";
import {
  TypingSession,
  generateWordSequence,
  listAvailableLanguages,
  loadLanguageWords,
  loadQuoteTexts,
} from "@monkcli/engine";
import {
  readStoredResults,
  readStoredSettings,
  resolveResultsFilePath,
  resolveSettingsFilePath,
  saveResult,
  saveSettings,
} from "@monkcli/storage-local";
import {
  DEFAULT_SETTINGS,
  ENGINE_DATA_DIR,
  TIME_MODE_WORD_POOL,
  TIME_TARGET_OPTIONS,
  WORD_TARGET_OPTIONS,
} from "../config";
import type { Phase } from "../types";

const MODE_OPTIONS: TestMode[] = ["time", "words", "quote"];

function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

function cycleValue<T>(values: readonly T[], current: T, delta: number): T {
  if (values.length === 0) return current;
  const currentIndex = values.indexOf(current);
  const baseIndex = currentIndex >= 0 ? currentIndex : 0;
  return values[wrapIndex(baseIndex + delta, values.length)] as T;
}

function languageRank(language: string): number {
  if (language === "english") return 0;
  const match = language.match(/^english_(\d+)k$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

function getEnglishLanguageOptions(languages: string[]): string[] {
  const englishOnly = languages.filter(
    (language) => language === "english" || /^english_\d+k$/.test(language),
  );

  const source = englishOnly.length > 0 ? englishOnly : languages;
  return [...source].sort((a, b) => {
    const rankDiff = languageRank(a) - languageRank(b);
    if (Number.isFinite(rankDiff) && rankDiff !== 0) return rankDiff;
    return a.localeCompare(b);
  });
}

function normalizeSettings(
  stored: UserSettings,
  availableLanguages: string[],
): UserSettings {
  return {
    language: availableLanguages.includes(stored.language)
      ? stored.language
      : availableLanguages[0] ?? DEFAULT_SETTINGS.language,
    mode: MODE_OPTIONS.includes(stored.mode) ? stored.mode : DEFAULT_SETTINGS.mode,
    wordTarget: WORD_TARGET_OPTIONS.some((option) => option === stored.wordTarget)
      ? stored.wordTarget
      : DEFAULT_SETTINGS.wordTarget,
    timeTargetSeconds: TIME_TARGET_OPTIONS.some((option) => option === stored.timeTargetSeconds)
      ? stored.timeTargetSeconds
      : DEFAULT_SETTINGS.timeTargetSeconds,
  };
}

export function useTypingController(): {
  phase: Phase;
  mode: TestMode;
  menuCursor: number;
  menuItemCount: number;
  language: string;
  availableLanguages: string[];
  wordTarget: number;
  wordTargetOptions: readonly number[];
  timeTargetSeconds: number;
  timeTargetOptions: readonly number[];
  quoteCount: number;
  dictionarySize: number;
  historyCount: number;
  errorMessage: string;
  lastResult: TestResult | null;
  progress: ReturnType<TypingSession["getProgress"]> | null;
  targetText: string;
  inputText: string;
  extraTyped: string;
  remainingSeconds: number;
  hasRunningSession: boolean;
  engineDataDir: string;
  resultsFilePath: string;
  settingsFilePath: string;
  moveMenuCursor: (delta: number) => void;
  adjustFocusedSetting: (delta: number) => void;
  startSession: () => void;
  goToMenu: () => void;
  applyBackspace: () => void;
  applyInputText: (input: string) => void;
} {
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<TestMode>(DEFAULT_SETTINGS.mode);
  const [menuCursor, setMenuCursor] = useState(0);

  const [language, setLanguage] = useState(DEFAULT_SETTINGS.language);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [dictionaries, setDictionaries] = useState<Record<string, string[]>>({});
  const [quotes, setQuotes] = useState<string[]>([]);

  const [wordTarget, setWordTarget] = useState(DEFAULT_SETTINGS.wordTarget);
  const [timeTargetSeconds, setTimeTargetSeconds] = useState(
    DEFAULT_SETTINGS.timeTargetSeconds,
  );

  const [session, setSession] = useState<TypingSession | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [inputVersion, setInputVersion] = useState(0);

  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const resultsFilePath = useMemo(() => resolveResultsFilePath(), []);
  const settingsFilePath = useMemo(() => resolveSettingsFilePath(), []);

  const menuItemCount = mode === "quote" ? 2 : 3;

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      try {
        const [languages, history, storedSettings, loadedQuotes] = await Promise.all([
          listAvailableLanguages({ engineDataDir: ENGINE_DATA_DIR }),
          readStoredResults(),
          readStoredSettings(DEFAULT_SETTINGS),
          loadQuoteTexts("english", { engineDataDir: ENGINE_DATA_DIR }).catch(() => []),
        ]);

        if (cancelled) return;

        const languageOptions = getEnglishLanguageOptions(languages);
        if (languageOptions.length === 0) {
          throw new Error("No language datasets found in engine-data");
        }

        const dictionarySettled = await Promise.allSettled(
          languageOptions.map(async (languageName) => {
            const words = await loadLanguageWords(languageName, {
              engineDataDir: ENGINE_DATA_DIR,
            });
            return [languageName, words.map((word) => word.toLowerCase())] as const;
          }),
        );

        if (cancelled) return;

        const successfulEntries: Array<readonly [string, string[]]> = [];
        for (const entry of dictionarySettled) {
          if (entry.status === "fulfilled") {
            successfulEntries.push(entry.value);
          }
        }

        const dictionaryMap = Object.fromEntries(successfulEntries) as Record<string, string[]>;

        const validLanguages = languageOptions.filter(
          (languageName) => (dictionaryMap[languageName]?.length ?? 0) > 0,
        );

        if (validLanguages.length === 0) {
          throw new Error("No valid language datasets found in engine-data");
        }

        const normalized = normalizeSettings(storedSettings, validLanguages);

        setAvailableLanguages(validLanguages);
        setDictionaries(dictionaryMap);
        setQuotes(loadedQuotes);

        setLanguage(normalized.language);
        setMode(normalized.mode);
        setWordTarget(normalized.wordTarget);
        setTimeTargetSeconds(normalized.timeTargetSeconds);

        setHistoryCount(history.length);
        setPhase("menu");
        setIsBootstrapped(true);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setPhase("error");
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isBootstrapped) return;

    const settings: UserSettings = {
      language,
      mode,
      wordTarget,
      timeTargetSeconds,
    };

    void saveSettings(settings).catch(() => undefined);
  }, [isBootstrapped, language, mode, wordTarget, timeTargetSeconds]);

  useEffect(() => {
    setMenuCursor((prev) => Math.min(prev, menuItemCount - 1));
  }, [menuItemCount]);

  const moveMenuCursor = useCallback(
    (delta: number) => {
      setMenuCursor((prev) => wrapIndex(prev + delta, menuItemCount));
    },
    [menuItemCount],
  );

  const adjustFocusedSetting = useCallback(
    (delta: number) => {
      if (menuCursor === 0) {
        setLanguage((prev) => cycleValue(availableLanguages, prev, delta));
        return;
      }

      if (menuCursor === 1) {
        setMode((prev) => cycleValue(MODE_OPTIONS, prev, delta));
        return;
      }

      if (menuCursor === 2 && mode === "time") {
        setTimeTargetSeconds((prev) => cycleValue(TIME_TARGET_OPTIONS, prev, delta));
      }

      if (menuCursor === 2 && mode === "words") {
        setWordTarget((prev) => cycleValue(WORD_TARGET_OPTIONS, prev, delta));
      }
    },
    [availableLanguages, menuCursor, mode],
  );

  const startSession = useCallback(() => {
    if (mode === "quote") {
      if (quotes.length === 0) {
        setErrorMessage("No quotes available for quote mode");
        setPhase("error");
        return;
      }

      const quote = quotes[Math.floor(Math.random() * quotes.length)] as string;
      const targetWords = quote
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);

      if (targetWords.length === 0) {
        setErrorMessage("Selected quote was empty");
        setPhase("error");
        return;
      }

      const next = new TypingSession({
        mode,
        durationSeconds: timeTargetSeconds,
        targetWords,
      });

      setSession(next);
      setNow(Date.now());
      setPhase("running");
      return;
    }

    const dictionary = dictionaries[language] ?? [];
    if (dictionary.length === 0) {
      setErrorMessage(`No words loaded for ${language}. Check engine-data path: ${ENGINE_DATA_DIR}`);
      setPhase("error");
      return;
    }

    const generated = generateWordSequence(dictionary, {
      count: mode === "time" ? TIME_MODE_WORD_POOL : wordTarget,
      punctuation: false,
      numbers: false,
      avoidConsecutiveRepeats: true,
    });

    const next = new TypingSession({
      mode,
      durationSeconds: timeTargetSeconds,
      targetWords: mode === "words" ? generated.slice(0, wordTarget) : generated,
    });

    setSession(next);
    setNow(Date.now());
    setPhase("running");
  }, [dictionaries, language, mode, quotes, timeTargetSeconds, wordTarget]);

  const finalizeSession = useCallback(async () => {
    if (!session || isFinalizing) return;

    setIsFinalizing(true);
    setPhase("saving");

    try {
      const result = session.buildResult(Date.now());
      await saveResult(result);
      setHistoryCount((prev) => prev + 1);
      setLastResult(result);
      setPhase("result");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setPhase("error");
    } finally {
      setIsFinalizing(false);
    }
  }, [isFinalizing, session]);

  useEffect(() => {
    if (phase !== "running" || !session) return;

    const interval = setInterval(() => {
      const tickNow = Date.now();
      setNow(tickNow);
      if (session.shouldAutoFinish(tickNow)) {
        void finalizeSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [finalizeSession, phase, session]);

  const applyBackspace = useCallback(() => {
    if (phase !== "running" || !session) return;
    session.backspace();
    setInputVersion((v) => v + 1);
  }, [phase, session]);

  const applyInputText = useCallback(
    (input: string) => {
      if (phase !== "running" || !session) return;
      if (!input) return;

      const chars = [...input];
      const ts = Date.now();

      for (const char of chars) {
        session.applyCharacter(char, ts);
      }

      setInputVersion((v) => v + 1);
      if (session.shouldAutoFinish(ts)) {
        void finalizeSession();
      }
    },
    [finalizeSession, phase, session],
  );

  const progress = useMemo(() => {
    if (!session) return null;
    return session.getProgress(now);
  }, [now, session]);

  const targetText = useMemo(() => session?.targetText ?? "", [session]);
  const inputText = useMemo(() => {
    void inputVersion;
    return session?.input ?? "";
  }, [inputVersion, session]);

  const extraTyped =
    session && session.input.length > session.targetText.length
      ? session.input.slice(session.targetText.length)
      : "";

  const remainingSeconds = session?.getRemainingSeconds(now) ?? 0;
  const dictionarySize = dictionaries[language]?.length ?? 0;

  return {
    phase,
    mode,
    menuCursor,
    menuItemCount,
    language,
    availableLanguages,
    wordTarget,
    wordTargetOptions: WORD_TARGET_OPTIONS,
    timeTargetSeconds,
    timeTargetOptions: TIME_TARGET_OPTIONS,
    quoteCount: quotes.length,
    dictionarySize,
    historyCount,
    errorMessage,
    lastResult,
    progress,
    targetText,
    inputText,
    extraTyped,
    remainingSeconds,
    hasRunningSession: phase === "running" && session !== null,
    engineDataDir: ENGINE_DATA_DIR,
    resultsFilePath,
    settingsFilePath,
    moveMenuCursor,
    adjustFocusedSetting,
    startSession,
    goToMenu: () => {
      setSession(null);
      setPhase("menu");
    },
    applyBackspace,
    applyInputText,
  };
}
