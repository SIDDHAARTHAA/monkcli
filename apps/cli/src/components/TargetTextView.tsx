import React from "react";
import { Box, Text } from "ink";

type WordRender = {
  targetWord: string;
  typedWord: string;
  isCurrent: boolean;
};

function getCurrentWordIndex(inputText: string, maxIndex: number): number {
  if (maxIndex <= 0) return 0;
  if (inputText.length === 0) return 0;
  const parts = inputText.split(" ");
  return Math.min(maxIndex, Math.max(0, parts.length - 1));
}

function renderCurrentWord(targetWord: string, typedWord: string, keyPrefix: string): React.JSX.Element[] {
  const nodes: React.JSX.Element[] = [];
  const maxLen = Math.max(targetWord.length, typedWord.length);
  const cursorAt = typedWord.length;

  for (let i = 0; i <= maxLen; i++) {
    if (i === cursorAt) {
      nodes.push(
        <Text key={`${keyPrefix}-cursor-${i}`} color="yellow" inverse bold>
          |
        </Text>,
      );
    }

    if (i === maxLen) continue;

    const typed = typedWord[i];
    const target = targetWord[i];

    if (typed !== undefined) {
      const isCorrect = typed === target;
      nodes.push(
        <Text key={`${keyPrefix}-typed-${i}`} color={isCorrect ? "green" : "red"} bold>
          {typed}
        </Text>,
      );
    } else if (target !== undefined) {
      nodes.push(
        <Text key={`${keyPrefix}-target-${i}`} color="cyan" bold>
          {target}
        </Text>,
      );
    }
  }

  return nodes;
}

function renderWordSegment(segment: WordRender, keyPrefix: string): React.JSX.Element[] {
  const { targetWord, typedWord, isCurrent } = segment;

  if (isCurrent) {
    return renderCurrentWord(targetWord, typedWord, keyPrefix);
  }

  if (typedWord.length === 0) {
    return [
      <Text key={`${keyPrefix}-future`} color="gray" dimColor bold>
        {targetWord}
      </Text>,
    ];
  }

  const isExact = typedWord === targetWord;
  return [
    <Text key={`${keyPrefix}-past`} color={isExact ? "green" : "red"} bold>
      {targetWord}
    </Text>,
  ];
}

export function TargetTextView(props: { targetText: string; inputText: string }): React.JSX.Element {
  const { targetText, inputText } = props;
  const targetWords = targetText.split(" ").filter((w) => w.length > 0);

  if (targetWords.length === 0) {
    return (
      <Box width="100%" justifyContent="center">
        <Text color="gray">No target words</Text>
      </Box>
    );
  }

  const typedWords = inputText.split(" ");
  const currentWordIndex = getCurrentWordIndex(inputText, targetWords.length - 1);

  const windowBefore = 5;
  const windowAfter = 8;
  const start = Math.max(0, currentWordIndex - windowBefore);
  const end = Math.min(targetWords.length - 1, currentWordIndex + windowAfter);

  const nodes: React.JSX.Element[] = [];

  if (start > 0) {
    nodes.push(
      <Text key="ellipsis-start" color="gray" dimColor>
        ...
      </Text>,
    );
  }

  for (let i = start; i <= end; i++) {
    const targetWord = targetWords[i] as string;
    const typedWord = typedWords[i] ?? "";

    const segmentNodes = renderWordSegment(
      {
        targetWord,
        typedWord,
        isCurrent: i === currentWordIndex,
      },
      `word-${i}`,
    );

    nodes.push(...segmentNodes);

    if (i < end) {
      nodes.push(
        <Text key={`space-${i}`}>
          {" "}
        </Text>,
      );
    }
  }

  if (end < targetWords.length - 1) {
    nodes.push(
      <Text key="ellipsis-end" color="gray" dimColor>
        {" ..."}
      </Text>,
    );
  }

  return (
    <Box width="100%" justifyContent="center">
      <Text>{nodes}</Text>
    </Box>
  );
}
