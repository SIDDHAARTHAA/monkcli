import React from "react";
import { Box, Text } from "ink";
import { COLORS_ENABLED, HIGH_CONTRAST } from "../theme.js";

type StyledChar = {
  char: string;
  color?: "green" | "red" | "cyan" | "gray" | "white" | "yellow";
  dimColor?: boolean;
  bold?: boolean;
  inverse?: boolean;
  underline?: boolean;
};

const LEFT_WINDOW = 28;
const RIGHT_WINDOW = 52;

function styleCorrect(char: string): StyledChar {
  return {
    char,
    bold: true,
  };
}

function styleIncorrect(char: string): StyledChar {
  return {
    char,
    color: COLORS_ENABLED ? "red" : undefined,
    bold: true,
    inverse: HIGH_CONTRAST,
    underline: true,
  };
}

function styleUpcoming(char: string): StyledChar {
  return {
    char,
    color: COLORS_ENABLED ? "white" : undefined,
    dimColor: false,
    bold: false,
  };
}

function styleCurrent(char: string): StyledChar {
  return {
    char,
    color: COLORS_ENABLED ? "cyan" : undefined,
    bold: true,
    underline: HIGH_CONTRAST,
  };
}

function buildPastChars(targetText: string, inputText: string, pointer: number): StyledChar[] {
  const start = Math.max(0, pointer - LEFT_WINDOW);
  const typedSlice = inputText.slice(start, pointer);

  const visible: StyledChar[] = [];
  for (let i = 0; i < typedSlice.length; i++) {
    const char = typedSlice[i] as string;
    const absoluteIndex = start + i;

    if (absoluteIndex < targetText.length) {
      const isCorrect = char === targetText[absoluteIndex];
      visible.push(isCorrect ? styleCorrect(char) : styleIncorrect(char));
    } else {
      visible.push(styleIncorrect(char));
    }
  }

  if (start > 0 && visible.length > 0) {
    visible[0] = {
      char: "…",
      color: COLORS_ENABLED ? "gray" : undefined,
      dimColor: false,
      bold: HIGH_CONTRAST,
    };
  }

  const padding: StyledChar[] = Array.from({ length: LEFT_WINDOW - visible.length }, () => ({
    char: " ",
  }));

  return [...padding, ...visible];
}

function buildFutureChars(targetText: string, pointer: number): StyledChar[] {
  const end = Math.min(targetText.length, pointer + RIGHT_WINDOW);

  const visible: StyledChar[] = [];
  for (let i = pointer; i < end; i++) {
    const char = targetText[i] as string;
    visible.push(i === pointer ? styleCurrent(char) : styleUpcoming(char));
  }

  if (end < targetText.length && visible.length > 0) {
    visible[visible.length - 1] = {
      char: "…",
      color: COLORS_ENABLED ? "gray" : undefined,
      dimColor: false,
      bold: HIGH_CONTRAST,
    };
  }

  const padding: StyledChar[] = Array.from({ length: RIGHT_WINDOW - visible.length }, () => ({
    char: " ",
  }));

  return [...visible, ...padding];
}

function renderChars(chars: StyledChar[], keyPrefix: string): React.JSX.Element[] {
  return chars.map((entry, index) => (
    <Text
      key={`${keyPrefix}-${index}`}
      color={entry.color}
      dimColor={entry.dimColor}
      bold={entry.bold}
      inverse={entry.inverse}
      underline={entry.underline}
    >
      {entry.char}
    </Text>
  ));
}

export function TargetTextView(props: { targetText: string; inputText: string }): React.JSX.Element {
  const { targetText, inputText } = props;

  if (!targetText || targetText.trim().length === 0) {
    return (
      <Box width="100%" justifyContent="center">
        <Text color="gray">No target words</Text>
      </Box>
    );
  }

  const pointer = Math.max(0, inputText.length);
  const pastChars = buildPastChars(targetText, inputText, pointer);
  const futureChars = buildFutureChars(targetText, pointer);

  return (
    <Box width="100%" justifyContent="center">
      <Text>{renderChars(pastChars, "past")}</Text>
      <Text color={COLORS_ENABLED ? "yellow" : undefined} inverse bold>
        |
      </Text>
      <Text>{renderChars(futureChars, "future")}</Text>
    </Box>
  );
}
