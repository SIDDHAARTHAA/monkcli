export type TestMode = "time" | "words";

export type TypingAccuracy = {
  correct: number;
  incorrect: number;
};

export type CharCounts = {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
};

export type StatSnapshot = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsedSeconds: number;
  chars: CharCounts;
  accuracyCounts: TypingAccuracy;
};

export type TestRunConfig = {
  mode: TestMode;
  durationSeconds: number;
  wordCount: number;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  avoidConsecutiveRepeats: boolean;
};

export type WordGenerationOptions = {
  count: number;
  punctuation?: boolean;
  numbers?: boolean;
  avoidConsecutiveRepeats?: boolean;
};

export type SessionInit = {
  mode: TestMode;
  durationSeconds: number;
  targetWords: string[];
  startedAt?: number;
};

export type TestResult = StatSnapshot & {
  mode: TestMode;
  targetWords: string[];
  targetText: string;
  inputText: string;
  completedAt: string;
};
