import type { SessionInit, StatSnapshot, TestResult, TypingAccuracy } from "@monkcli/contracts";
import { calculateStats } from "./stats.js";

export class TypingSession {
  readonly mode: SessionInit["mode"];
  readonly durationSeconds: number;
  readonly targetWords: string[];
  readonly targetText: string;

  private readonly createdAt: number;
  private startedAt?: number;
  private endedAt?: number;

  private inputText = "";
  private accuracy: TypingAccuracy = { correct: 0, incorrect: 0 };

  constructor(init: SessionInit) {
    this.mode = init.mode;
    this.durationSeconds = Math.max(1, init.durationSeconds);
    this.targetWords = init.targetWords;
    this.targetText = this.targetWords.join(" ");
    this.createdAt = init.startedAt ?? Date.now();
  }

  get input(): string {
    return this.inputText;
  }

  get isFinished(): boolean {
    return this.endedAt !== undefined;
  }

  private ensureStarted(now: number): void {
    if (this.startedAt === undefined) {
      this.startedAt = now;
    }
  }

  applyCharacter(char: string, now = Date.now()): void {
    if (!char || this.isFinished) return;

    this.ensureStarted(now);

    const expected = this.targetText[this.inputText.length] ?? "";
    if (char === expected) {
      this.accuracy.correct++;
    } else {
      this.accuracy.incorrect++;
    }

    this.inputText += char;
  }

  backspace(): void {
    if (this.isFinished) return;
    if (this.inputText.length === 0) return;
    this.inputText = this.inputText.slice(0, -1);
  }

  getElapsedSeconds(now = Date.now()): number {
    const start = this.startedAt ?? this.createdAt;
    const end = this.endedAt ?? now;
    return Math.max(0, (end - start) / 1000);
  }

  getRemainingSeconds(now = Date.now()): number {
    if (this.mode !== "time") return 0;
    const remaining = this.durationSeconds - this.getElapsedSeconds(now);
    return Math.max(0, remaining);
  }

  hasCompletedWordTarget(): boolean {
    if (this.mode !== "words") return false;
    const typedWords =
      this.inputText.trim().length > 0
        ? this.inputText.trim().split(/\s+/).length
        : 0;
    const submitted = this.inputText.endsWith(" ") || this.inputText === this.targetText;
    return submitted && typedWords >= this.targetWords.length;
  }

  private hasTypedFinalWordCorrectly(): boolean {
    if (this.mode !== "words") return false;

    const typedWords = this.inputText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (typedWords.length !== this.targetWords.length) return false;

    const typedLastWord = typedWords[typedWords.length - 1];
    const targetLastWord = this.targetWords[this.targetWords.length - 1];

    return typedLastWord === targetLastWord;
  }

  private hasCompletedQuoteTarget(): boolean {
    if (this.mode !== "quote") return false;
    return this.inputText === this.targetText;
  }

  shouldAutoFinish(now = Date.now()): boolean {
    if (this.isFinished) return false;
    if (this.mode === "time") {
      if (this.startedAt === undefined) return false;
      return this.getElapsedSeconds(now) >= this.durationSeconds;
    }
    if (this.mode === "words") {
      return this.hasCompletedWordTarget() || this.hasTypedFinalWordCorrectly();
    }
    return this.hasCompletedQuoteTarget();
  }

  finish(now = Date.now()): void {
    if (this.isFinished) return;
    this.ensureStarted(now);
    this.endedAt = now;
  }

  getProgress(now = Date.now()): StatSnapshot {
    return calculateStats({
      targetWords: this.targetWords,
      inputText: this.inputText,
      elapsedSeconds: this.getElapsedSeconds(now),
      accuracyCounts: this.accuracy,
      includePartialLastWordInWpm: this.mode !== "words",
    });
  }

  buildResult(now = Date.now()): TestResult {
    this.finish(now);
    const progress = this.getProgress(now);

    return {
      ...progress,
      mode: this.mode,
      targetWords: this.targetWords,
      targetText: this.targetText,
      inputText: this.inputText,
      completedAt: new Date(now).toISOString(),
    };
  }
}
