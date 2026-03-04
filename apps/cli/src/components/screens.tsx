import React from "react";
import { Box, Text } from "ink";
import type { TestMode, TestResult, StatSnapshot } from "@monkcli/contracts";
import { TargetTextView } from "./TargetTextView";

export function LoadingScreen(): React.JSX.Element {
  return <Text>Loading engine data...</Text>;
}

export function SavingScreen(): React.JSX.Element {
  return <Text>Saving result...</Text>;
}

export function ErrorScreen(props: { errorMessage: string }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text color="red">Error: {props.errorMessage}</Text>
      <Text>Enter: menu | q: quit</Text>
    </Box>
  );
}

export function MenuScreen(props: {
  language: string;
  mode: TestMode;
  timeTargetSeconds: number;
  wordTarget: number;
  dictionarySize: number;
  historyCount: number;
  engineDataDir: string;
}): React.JSX.Element {
  const {
    language,
    mode,
    timeTargetSeconds,
    wordTarget,
    dictionarySize,
    historyCount,
    engineDataDir,
  } = props;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="cyan">monkcli</Text>
      <Text>Language: {language}</Text>
      <Text>Dictionary loaded: {dictionarySize}</Text>
      <Text>Saved results: {historyCount}</Text>
      <Text> </Text>
      <Text color={mode === "time" ? "green" : "gray"}>
        {mode === "time" ? "●" : "○"} time ({timeTargetSeconds}s)
      </Text>
      <Text color={mode === "words" ? "green" : "gray"}>
        {mode === "words" ? "●" : "○"} words ({wordTarget})
      </Text>
      <Text> </Text>
      <Text>↑/↓ (or ←/→): mode | Enter: start | q: quit</Text>
      {dictionarySize === 0 ? (
        <Text color="red">Cannot start: dictionary is empty. engine-data path: {engineDataDir}</Text>
      ) : null}
    </Box>
  );
}

export function ResultScreen(props: {
  result: TestResult;
  historyCount: number;
}): React.JSX.Element {
  const { result, historyCount } = props;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="green">Test complete</Text>
      <Text>
        {Math.round(result.wpm)} wpm | {Math.round(result.rawWpm)} raw | {Math.round(result.accuracy)}% acc
      </Text>
      <Text>
        time {Math.round(result.elapsedSeconds)}s | correct keys {result.accuracyCounts.correct} | incorrect keys {result.accuracyCounts.incorrect}
      </Text>
      <Text>Saved results: {historyCount}</Text>
      <Text>Tab: new test | Enter: menu | q: quit</Text>
    </Box>
  );
}

export function RunningScreen(props: {
  mode: TestMode;
  remainingSeconds: number;
  progress: StatSnapshot | null;
  targetText: string;
  inputText: string;
  extraTyped: string;
}): React.JSX.Element {
  const { mode, remainingSeconds, progress, targetText, inputText, extraTyped } = props;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="cyan">{mode === "time" ? `time | ${Math.max(0, Math.ceil(remainingSeconds))}s left` : "words"}</Text>
      <Text>{Math.round(progress?.wpm ?? 0)} wpm | {Math.round(progress?.accuracy ?? 100)}% acc</Text>
      <Text> </Text>
      <TargetTextView targetText={targetText} inputText={inputText} />
      {extraTyped.length > 0 ? <Text color="red">extra: {extraTyped}</Text> : null}
      <Text> </Text>
      <Text>Tab: new test | Enter: menu | q: quit</Text>
    </Box>
  );
}
