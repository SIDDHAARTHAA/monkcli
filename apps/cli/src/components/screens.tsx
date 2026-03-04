import os from "node:os";
import React from "react";
import { Box, Text } from "ink";
import type { TestMode, TestResult, StatSnapshot } from "@monkcli/contracts";
import { COLORS_ENABLED, HIGH_CONTRAST } from "../theme";
import { TargetTextView } from "./TargetTextView";

function compactPath(filePath: string): string {
  const home = os.homedir();
  return filePath.startsWith(home) ? `~${filePath.slice(home.length)}` : filePath;
}

function formatLanguageLabel(language: string): string {
  if (language === "english") return "english";
  const match = language.match(/^english_(\d+)k$/);
  if (match) {
    return `english${match[1]}k`;
  }
  return language;
}

function RainbowTitle(props: { text: string }): React.JSX.Element {
  const gradientStops = ["#00d4ff", "#4d7cff", "#a855f7", "#ff3d81"];

  const hexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  };

  const rgbToHex = (r: number, g: number, b: number): string =>
    `#${[r, g, b]
      .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
      .join("")}`;

  const interpolate = (a: number, b: number, t: number): number => a + (b - a) * t;

  const colorAt = (t: number): string => {
    if (gradientStops.length === 1) return gradientStops[0] as string;
    const segments = gradientStops.length - 1;
    const scaled = t * segments;
    const index = Math.min(segments - 1, Math.max(0, Math.floor(scaled)));
    const localT = scaled - index;
    const from = hexToRgb(gradientStops[index] as string);
    const to = hexToRgb(gradientStops[index + 1] as string);
    return rgbToHex(
      interpolate(from[0], to[0], localT),
      interpolate(from[1], to[1], localT),
      interpolate(from[2], to[2], localT),
    );
  };

  if (!COLORS_ENABLED) {
    return <Text bold>{props.text}</Text>;
  }

  const chars = [...props.text];

  return (
    <Text bold>
      {chars.map((char, index) => (
        <Text
          key={`${char}-${index}`}
          color={colorAt(chars.length <= 1 ? 0 : index / (chars.length - 1))}
        >
          {char}
        </Text>
      ))}
    </Text>
  );
}

function KeyTag(props: {
  label: string;
  tone?: "primary" | "success" | "danger" | "neutral";
}): React.JSX.Element {
  const tone = props.tone ?? "neutral";

  const color =
    tone === "success"
      ? "green"
      : tone === "danger"
        ? "red"
        : tone === "primary"
          ? "cyan"
          : "yellow";

  return (
    <Text
      color={COLORS_ENABLED ? color : undefined}
      bold
      inverse={HIGH_CONTRAST && tone !== "neutral"}
      underline={HIGH_CONTRAST && tone === "primary"}
    >
      {props.label}
    </Text>
  );
}

function MenuControls(): React.JSX.Element {
  return (
    <Text>
      <KeyTag label="↑/↓" tone="primary" /> move row | <KeyTag label="←/→" tone="primary" /> change value | <KeyTag label="Enter" tone="success" /> start | <KeyTag label="q" tone="danger" /> quit
    </Text>
  );
}

function RunningControls(): React.JSX.Element {
  return (
    <Text>
      <KeyTag label="Tab" tone="primary" /> new test | <KeyTag label="Enter" tone="success" /> menu | <KeyTag label="q" tone="danger" /> quit
    </Text>
  );
}

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
      <Text>
        <KeyTag label="Enter" tone="success" /> menu | <KeyTag label="q" tone="danger" /> quit
      </Text>
    </Box>
  );
}

export function MenuScreen(props: {
  language: string;
  availableLanguages: string[];
  mode: TestMode;
  menuCursor: number;
  menuItemCount: number;
  timeTargetSeconds: number;
  timeTargetOptions: readonly number[];
  wordTarget: number;
  wordTargetOptions: readonly number[];
  quoteCount: number;
  dictionarySize: number;
  historyCount: number;
  resultsFilePath: string;
  settingsFilePath: string;
  engineDataDir: string;
}): React.JSX.Element {
  const {
    language,
    availableLanguages,
    mode,
    menuCursor,
    menuItemCount,
    timeTargetSeconds,
    timeTargetOptions,
    wordTarget,
    wordTargetOptions,
    quoteCount,
    dictionarySize,
    historyCount,
    resultsFilePath,
    settingsFilePath,
    engineDataDir,
  } = props;

  const modeDetail =
    mode === "time"
      ? `seconds: ${timeTargetSeconds} [${timeTargetOptions.join(", ")}]`
      : `words: ${wordTarget} [${wordTargetOptions.join(", ")}]`;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <RainbowTitle text="monkcli" />
      <Text>
        history saved: {historyCount} | dictionary words: {dictionarySize} | quotes: {quoteCount}
      </Text>
      <Text>
        results: {compactPath(resultsFilePath)} | settings: {compactPath(settingsFilePath)}
      </Text>
      <Text> </Text>

      <Text color={menuCursor === 0 ? "green" : "white"}>
        {menuCursor === 0 ? ">" : " "} language: {formatLanguageLabel(language)} ({availableLanguages.length} options)
      </Text>
      <Text color={menuCursor === 1 ? "green" : "white"}>
        {menuCursor === 1 ? ">" : " "} mode: {mode}
      </Text>
      {mode !== "quote" ? (
        <Text color={menuCursor === 2 ? "green" : "white"}>
          {menuCursor === 2 ? ">" : " "} {modeDetail}
        </Text>
      ) : (
        <Text color="gray" dimColor>
          quote source: english
        </Text>
      )}

      <Text> </Text>
      <MenuControls />
      <Text color="gray" dimColor>
        active rows: {menuItemCount}
      </Text>
      {dictionarySize === 0 && mode !== "quote" ? (
        <Text color="red">Cannot start: dictionary is empty. engine-data path: {engineDataDir}</Text>
      ) : null}
      {quoteCount === 0 && mode === "quote" ? (
        <Text color="red">Cannot start: quote list is empty. engine-data path: {engineDataDir}</Text>
      ) : null}
    </Box>
  );
}

export function ResultScreen(props: {
  result: TestResult;
  historyCount: number;
  resultsFilePath: string;
}): React.JSX.Element {
  const { result, historyCount, resultsFilePath } = props;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="green" bold>
        Test complete
      </Text>
      <Text>
        {Math.round(result.wpm)} wpm | {Math.round(result.rawWpm)} raw | {Math.round(result.accuracy)}% acc
      </Text>
      <Text>
        <Text color="cyan">time</Text> {Math.round(result.elapsedSeconds)}s |{" "}
        <Text color="green">correct keys</Text>{" "}
        <Text color="green" bold>
          {result.accuracyCounts.correct}
        </Text>{" "}
        | <Text color="red">incorrect keys</Text>{" "}
        <Text color="red" bold>
          {result.accuracyCounts.incorrect}
        </Text>
      </Text>
      <Text>
        saved results: {historyCount} ({compactPath(resultsFilePath)})
      </Text>
      <RunningControls />
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

  const modeLabel =
    mode === "time" ? `time | ${Math.max(0, Math.ceil(remainingSeconds))}s left` : mode;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="cyan" bold>
        {modeLabel}
      </Text>
      <Text>
        {Math.round(progress?.wpm ?? 0)} wpm | {Math.round(progress?.accuracy ?? 100)}% acc
      </Text>
      <Text> </Text>
      <TargetTextView targetText={targetText} inputText={inputText} />
      {extraTyped.length > 0 ? <Text color="red">extra: {extraTyped}</Text> : null}
      <Text> </Text>
      <RunningControls />
    </Box>
  );
}
