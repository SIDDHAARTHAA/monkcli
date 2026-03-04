import React from "react";
import { useApp, useInput } from "ink";
import { useTypingController } from "./hooks/useTypingController";
import {
  ErrorScreen,
  LoadingScreen,
  MenuScreen,
  ResultScreen,
  RunningScreen,
  SavingScreen,
} from "./components/screens";

export function App(): React.JSX.Element {
  const { exit } = useApp();
  const controller = useTypingController();

  useInput((input, key) => {
    if ((key.ctrl && input === "c") || input === "q") {
      exit();
      return;
    }

    if (controller.phase === "menu") {
      if (key.upArrow || key.leftArrow) {
        controller.setMode("time");
        return;
      }
      if (key.downArrow || key.rightArrow) {
        controller.setMode("words");
        return;
      }
      if (key.return && controller.dictionarySize > 0) {
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
    return <LoadingScreen />;
  }

  if (controller.phase === "error") {
    return <ErrorScreen errorMessage={controller.errorMessage} />;
  }

  if (controller.phase === "menu") {
    return (
      <MenuScreen
        language={controller.language}
        mode={controller.mode}
        timeTargetSeconds={controller.timeTargetSeconds}
        wordTarget={controller.wordTarget}
        dictionarySize={controller.dictionarySize}
        historyCount={controller.historyCount}
        engineDataDir={controller.engineDataDir}
      />
    );
  }

  if (controller.phase === "saving") {
    return <SavingScreen />;
  }

  if (controller.phase === "result" && controller.lastResult) {
    return (
      <ResultScreen
        result={controller.lastResult}
        historyCount={controller.historyCount}
      />
    );
  }

  return (
    <RunningScreen
      mode={controller.mode}
      remainingSeconds={controller.remainingSeconds}
      progress={controller.progress}
      targetText={controller.targetText}
      inputText={controller.inputText}
      extraTyped={controller.extraTyped}
    />
  );
}
