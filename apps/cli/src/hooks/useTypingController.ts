import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TestMode, TestResult } from "@monkcli/contracts";
import {
  TypingSession,
  generateWordSequence,
  loadLanguageWords,
} from "@monkcli/engine";
import { readStoredResults, saveResult } from "@monkcli/storage-local";
import {
  ENGINE_DATA_DIR,
  LANGUAGE,
  TIME_MODE_WORD_POOL,
  TIME_TARGET_SECONDS,
  WORD_TARGET,
} from "../config";
import type { Phase } from "../types";

export function useTypingController(): {
  phase: Phase;
  mode: TestMode;
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
  language: string;
  wordTarget: number;
  timeTargetSeconds: number;
  engineDataDir: string;
  setMode: (mode: TestMode) => void;
  toggleMode: () => void;
  startSession: () => void;
  goToMenu: () => void;
  finishSession: () => void;
  applyBackspace: () => void;
  applyInputText: (input: string) => void;
} {
  const [phase, setPhase] = useState<Phase>("loading");
  const [mode, setMode] = useState<TestMode>("time");
  const [dictionary, setDictionary] = useState<string[]>([]);
  const [session, setSession] = useState<TypingSession | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [inputVersion, setInputVersion] = useState(0);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const finalizeInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      try {
        const [words, history] = await Promise.all([
          loadLanguageWords(LANGUAGE, { engineDataDir: ENGINE_DATA_DIR }),
          readStoredResults(),
        ]);

        if (cancelled) return;

        if (words.length === 0) {
          throw new Error(`Language "${LANGUAGE}" loaded with zero words`);
        }

        const normalizedWords = words.map((word) => word.toLowerCase());
        setDictionary(normalizedWords);
        setHistoryCount(history.length);
        setPhase("menu");
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

  const startSession = useCallback(() => {
    if (dictionary.length === 0) {
      setErrorMessage(
        `No words loaded for ${LANGUAGE}. Check engine-data path: ${ENGINE_DATA_DIR}`,
      );
      setPhase("error");
      return;
    }

    const generated = generateWordSequence(dictionary, {
      count: mode === "time" ? TIME_MODE_WORD_POOL : WORD_TARGET,
      punctuation: false,
      numbers: false,
      avoidConsecutiveRepeats: true,
    });

    const next = new TypingSession({
      mode,
      durationSeconds: TIME_TARGET_SECONDS,
      targetWords: mode === "words" ? generated.slice(0, WORD_TARGET) : generated,
    });

    finalizeInFlight.current = false;
    setSession(next);
    setNow(Date.now());
    setPhase("running");
  }, [dictionary, mode]);

  const finalizeSession = useCallback(
    async () => {
      if (!session || finalizeInFlight.current) return;

      finalizeInFlight.current = true;
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
        finalizeInFlight.current = false;
      }
    },
    [session],
  );

  const finishSession = useCallback(() => {
    void finalizeSession();
  }, [finalizeSession]);

  useEffect(() => {
    if (phase !== "running" || !session) return;

    // Live stats are intentionally throttled to 1Hz for a cleaner CLI.
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

  return {
    phase,
    mode,
    dictionarySize: dictionary.length,
    historyCount,
    errorMessage,
    lastResult,
    progress,
    targetText,
    inputText,
    extraTyped,
    remainingSeconds,
    hasRunningSession: phase === "running" && session !== null,
    language: LANGUAGE,
    wordTarget: WORD_TARGET,
    timeTargetSeconds: TIME_TARGET_SECONDS,
    engineDataDir: ENGINE_DATA_DIR,
    setMode: (nextMode) => setMode(nextMode),
    toggleMode: () => setMode((prev) => (prev === "time" ? "words" : "time")),
    startSession,
    goToMenu: () => {
      setSession(null);
      setPhase("menu");
    },
    finishSession,
    applyBackspace,
    applyInputText,
  };
}
