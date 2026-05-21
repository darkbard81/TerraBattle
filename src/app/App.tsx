import React, { useState } from "react";
import { DEMO_STAGES } from "../assets/stages.js";
import {
  advanceDemoProgressAfterVictory,
  createInitialDemoProgress,
  parseDemoProgress,
  retryDemoStage,
  serializeDemoProgress,
  type DemoProgressState,
} from "../game/application/DemoProgress.js";
import { MapScene } from "../scene/map/MapScene.js";
import { TitleScreen } from "../scene/title/TitleScreen.js";
import {
  parseGameSettings,
  serializeGameSettings,
  type GameSettings,
} from "./GameSettings.js";
import { SettingsPanel } from "./SettingsPanel.js";

type AppScene = "title" | "map";

const DEMO_PROGRESS_STORAGE_KEY = "terrabattle.demoProgress";
const GAME_SETTINGS_STORAGE_KEY = "terrabattle.gameSettings";

function loadDemoProgress(): DemoProgressState {
  if (typeof window === "undefined") {
    return createInitialDemoProgress();
  }

  return parseDemoProgress(
    window.localStorage.getItem(DEMO_PROGRESS_STORAGE_KEY),
    DEMO_STAGES.length,
  );
}

function saveDemoProgress(progress: DemoProgressState): void {
  window.localStorage.setItem(
    DEMO_PROGRESS_STORAGE_KEY,
    serializeDemoProgress(progress),
  );
}

function loadGameSettings(): GameSettings {
  if (typeof window === "undefined") {
    return parseGameSettings(null);
  }

  return parseGameSettings(window.localStorage.getItem(GAME_SETTINGS_STORAGE_KEY));
}

function saveGameSettings(settings: GameSettings): void {
  window.localStorage.setItem(
    GAME_SETTINGS_STORAGE_KEY,
    serializeGameSettings(settings),
  );
}

/**
 * 애플리케이션의 최상위 루트다.
 *
 * @returns 현재 표시할 게임 화면
 */
export function App(): React.ReactElement {
  const [scene, setScene] = useState<AppScene>("title");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mapSceneKey, setMapSceneKey] = useState(0);
  const [demoProgress, setDemoProgress] = useState(loadDemoProgress);
  const [settings, setSettings] = useState(loadGameSettings);
  const currentStage = DEMO_STAGES[demoProgress.currentStageIndex] ?? DEMO_STAGES[0];
  const currentStageIndex = DEMO_STAGES.indexOf(currentStage);
  const hasNextStage = currentStageIndex < DEMO_STAGES.length - 1;

  const updateDemoProgress = (nextProgress: DemoProgressState): void => {
    setDemoProgress(nextProgress);
    saveDemoProgress(nextProgress);
  };

  const updateSettings = (nextSettings: GameSettings): void => {
    setSettings(nextSettings);
    saveGameSettings(nextSettings);
  };

  const sceneElement =
    scene === "map" ? (
      <MapScene
        hasNextStage={hasNextStage}
        key={`${currentStage.id}:${mapSceneKey}`}
        onBack={() => setScene("title")}
        onNextStage={() => {
          const nextProgress = advanceDemoProgressAfterVictory({
            clearedStageIndex: currentStageIndex,
            progress: demoProgress,
            stageCount: DEMO_STAGES.length,
          });

          updateDemoProgress(nextProgress);
          setMapSceneKey((current) => current + 1);
        }}
        onRetry={() => {
          const nextProgress = retryDemoStage({
            progress: demoProgress,
            stageCount: DEMO_STAGES.length,
            stageIndex: currentStageIndex,
          });

          updateDemoProgress(nextProgress);
          setMapSceneKey((current) => current + 1);
        }}
        partyLevel={demoProgress.partyLevel}
        settings={settings}
        stage={currentStage}
        stageIndex={currentStageIndex}
        totalStageCount={DEMO_STAGES.length}
      />
    ) : (
      <TitleScreen
        onNewGame={() => {
          setDemoProgress(loadDemoProgress());
          setScene("map");
        }}
        settings={settings}
      />
    );

  return (
    <div className={`app-shell app-shell--${scene}`}>
      <div
        className="app-shell__scene"
        key={scene}
      >
        {sceneElement}
      </div>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpen={() => setIsSettingsOpen(true)}
        onSettingsChange={updateSettings}
        settings={settings}
      />
    </div>
  );
}
