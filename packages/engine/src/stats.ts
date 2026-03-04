import type { CharCounts, StatSnapshot, TypingAccuracy } from "@monkcli/contracts";

type StatsInput = {
  targetWords: string[];
  inputText: string;
  elapsedSeconds: number;
  accuracyCounts: TypingAccuracy;
  includePartialLastWordInWpm: boolean;
};

function splitInputWords(inputText: string): string[] {
  if (inputText.length === 0) return [];
  const words = inputText.split(" ");
  if (words[words.length - 1] === "") words.pop();
  return words;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function countChars(
  targetWords: string[],
  inputWords: string[],
  includePartialLastWordInWpm: boolean,
): CharCounts {
  let correctWordChars = 0;
  let allCorrectChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  let spaces = 0;
  let correctSpaces = 0;

  for (let i = 0; i < inputWords.length; i++) {
    const inputWord = inputWords[i] ?? "";
    const targetWord = targetWords[i] ?? "";

    if (inputWord === targetWord) {
      correctWordChars += targetWord.length;
      allCorrectChars += targetWord.length;
      if (i < inputWords.length - 1) {
        correctSpaces++;
      }
    } else if (inputWord.length >= targetWord.length) {
      for (let c = 0; c < inputWord.length; c++) {
        if (c < targetWord.length) {
          if (inputWord[c] === targetWord[c]) {
            allCorrectChars++;
          } else {
            incorrectChars++;
          }
        } else {
          extraChars++;
        }
      }
    } else {
      const toAdd = { correct: 0, incorrect: 0, missed: 0 };
      for (let c = 0; c < targetWord.length; c++) {
        if (c < inputWord.length) {
          if (inputWord[c] === targetWord[c]) {
            toAdd.correct++;
          } else {
            toAdd.incorrect++;
          }
        } else {
          toAdd.missed++;
        }
      }

      allCorrectChars += toAdd.correct;
      incorrectChars += toAdd.incorrect;

      const isLastInputWord = i === inputWords.length - 1;
      if (isLastInputWord && includePartialLastWordInWpm) {
        if (toAdd.incorrect === 0) {
          correctWordChars += toAdd.correct;
        }
      } else {
        missedChars += toAdd.missed;
      }
    }

    if (i < inputWords.length - 1) {
      spaces++;
    }
  }

  return {
    spaces,
    correctWordChars,
    allCorrectChars,
    incorrectChars,
    extraChars,
    missedChars,
    correctSpaces,
  };
}

export function calculateStats(input: StatsInput): StatSnapshot {
  const elapsedSeconds = Math.max(input.elapsedSeconds, 0.001);
  const inputWords = splitInputWords(input.inputText);

  const chars = countChars(
    input.targetWords,
    inputWords,
    input.includePartialLastWordInWpm,
  );

  const wpm = round2(
    ((chars.correctWordChars + chars.correctSpaces) * (60 / elapsedSeconds)) / 5,
  );

  const rawWpm = round2(
    ((chars.allCorrectChars + chars.spaces + chars.incorrectChars + chars.extraChars) *
      (60 / elapsedSeconds)) /
      5,
  );

  const accuracyFromKeystrokes =
    (input.accuracyCounts.correct /
      (input.accuracyCounts.correct + input.accuracyCounts.incorrect || 1)) *
    100;

  const accuracy = round2(
    Number.isFinite(accuracyFromKeystrokes) ? accuracyFromKeystrokes : 100,
  );

  return {
    wpm: Number.isFinite(wpm) ? wpm : 0,
    rawWpm: Number.isFinite(rawWpm) ? rawWpm : 0,
    accuracy,
    elapsedSeconds: round2(elapsedSeconds),
    chars,
    accuracyCounts: input.accuracyCounts,
  };
}
