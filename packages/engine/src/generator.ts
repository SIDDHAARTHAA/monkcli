import type { WordGenerationOptions } from "@monkcli/contracts";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWord(words: string[]): string {
  return words[randomInt(0, words.length - 1)] as string;
}

function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += randomInt(0, 9).toString();
  }
  return out;
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function addPunctuation(
  word: string,
  index: number,
  total: number,
  sentenceStart: boolean,
): { word: string; sentenceStart: boolean } {
  let nextWord = sentenceStart ? capitalize(word) : word;

  const isLast = index === total - 1;
  const roll = Math.random();

  if (isLast || roll < 0.1) {
    nextWord += ".";
    return { word: nextWord, sentenceStart: true };
  }

  if (roll < 0.3) {
    nextWord += ",";
    return { word: nextWord, sentenceStart: false };
  }

  return { word: nextWord, sentenceStart: false };
}

export function generateWordSequence(
  dictionary: string[],
  options: WordGenerationOptions,
): string[] {
  if (dictionary.length === 0) {
    throw new Error("Dictionary is empty");
  }

  const count = Math.max(1, options.count);
  const punctuation = options.punctuation ?? false;
  const numbers = options.numbers ?? false;
  const avoidConsecutiveRepeats = options.avoidConsecutiveRepeats ?? true;

  const out: string[] = [];
  let sentenceStart = true;

  for (let i = 0; i < count; i++) {
    let word = randomWord(dictionary).trim();

    if (avoidConsecutiveRepeats && out.length > 0) {
      let retries = 0;
      while (retries < 24 && word === out[out.length - 1]?.replace(/[.,!?]$/, "")) {
        retries++;
        word = randomWord(dictionary).trim();
      }
    }

    if (numbers && Math.random() < 0.1) {
      word = randomDigits(4);
    }

    if (punctuation) {
      const punctuated = addPunctuation(word, i, count, sentenceStart);
      word = punctuated.word;
      sentenceStart = punctuated.sentenceStart;
    }

    out.push(word);
  }

  return out;
}
