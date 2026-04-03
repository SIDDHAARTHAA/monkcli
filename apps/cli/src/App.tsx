import React from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { useTypingController } from "./hooks/useTypingController.js";
import {
  ErrorScreen,
  LoadingScreen,
  MenuScreen,
  ResultScreen,
  RunningScreen,
  SavingScreen,
} from "./components/screens.js";

export function App(): React.JSX.Element {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const terminalWidth = stdout.columns ?? 120;
  const terminalHeight = stdout.rows ?? 30;
  const controller = useTypingController();

  const safeWidth = Math.max(40, terminalWidth);
  const safeHeight = Math.max(12, terminalHeight);
  const panelWidth = Math.max(36, Math.min(safeWidth - 2, 120));

  const renderCentered = (content: React.JSX.Element): React.JSX.Element => (
    <Box width={safeWidth} height={safeHeight} justifyContent="center" alignItems="center">
      <Box width={panelWidth} flexDirection="column">
        {content}
      </Box>
    </Box>
  );

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (controller.phase === "menu") {
      if (key.upArrow) {
        controller.moveMenuCursor(-1);
        return;
      }
      if (key.downArrow) {
        controller.moveMenuCursor(1);
        return;
      }
      if (key.leftArrow) {
        controller.adjustFocusedSetting(-1);
        return;
      }
      if (key.rightArrow) {
        controller.adjustFocusedSetting(1);
        return;
      }
      if (key.return) {
        controller.startSession();
      }
      return;
    }

    if (controller.phase === "result") {
      if (key.tab) {
        controller.startSession();
        return;
      }
      if (key.return) {
        controller.goToMenu();
      }
      return;
    }

    if (controller.phase === "error") {
      if (key.return) {
        controller.goToMenu();
      }
      return;
    }

    if (!controller.hasRunningSession) return;

    if (key.tab) {
      controller.startSession();
      return;
    }

    if (key.return) {
      controller.goToMenu();
      return;
    }

    if (key.backspace || key.delete) {
      controller.applyBackspace();
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      controller.applyInputText(input);
    }
  });

  if (controller.phase === "loading") {
    return renderCentered(<LoadingScreen />);
  }

  if (controller.phase === "error") {
    return renderCentered(<ErrorScreen errorMessage={controller.errorMessage} />);
  }

  if (controller.phase === "menu") {
    return renderCentered(
      <MenuScreen
        language={controller.language}
        availableLanguages={controller.availableLanguages}
        mode={controller.mode}
        menuCursor={controller.menuCursor}
        menuItemCount={controller.menuItemCount}
        timeTargetSeconds={controller.timeTargetSeconds}
        timeTargetOptions={controller.timeTargetOptions}
        wordTarget={controller.wordTarget}
        wordTargetOptions={controller.wordTargetOptions}
        quoteCount={controller.quoteCount}
        dictionarySize={controller.dictionarySize}
        historyCount={controller.historyCount}
        averageWpm={controller.averageWpm}
        averageAccuracy={controller.averageAccuracy}
        resultsFilePath={controller.resultsFilePath}
        settingsFilePath={controller.settingsFilePath}
        statsFilePath={controller.statsFilePath}
        engineDataDir={controller.engineDataDir}
      />,
    );
  }

  if (controller.phase === "saving") {
    return renderCentered(<SavingScreen />);
  }

  if (controller.phase === "result" && controller.lastResult) {
    return renderCentered(
      <ResultScreen
        result={controller.lastResult}
        historyCount={controller.historyCount}
        averageWpm={controller.averageWpm}
        averageAccuracy={controller.averageAccuracy}
        resultsFilePath={controller.resultsFilePath}
      />,
    );
  }

  return renderCentered(
    <RunningScreen
      mode={controller.mode}
      remainingSeconds={controller.remainingSeconds}
      progress={controller.progress}
      targetText={controller.targetText}
      inputText={controller.inputText}
      extraTyped={controller.extraTyped}
    />,
  );
}
