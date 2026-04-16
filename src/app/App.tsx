import React, { useState } from "react";
import { MapScene } from "../scene/map/MapScene.js";
import { TitleScreen } from "../scene/title/TitleScreen.js";

type AppScene = "title" | "map";

/**
 * 애플리케이션의 최상위 루트다.
 *
 * @returns 현재 표시할 게임 화면
 */
export function App(): React.ReactElement {
  const [scene, setScene] = useState<AppScene>("title");

  if (scene === "map") {
    return <MapScene onBack={() => setScene("title")} />;
  }

  return <TitleScreen onNewGame={() => setScene("map")} />;
}
