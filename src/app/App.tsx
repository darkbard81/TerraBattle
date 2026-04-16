import React from "react";
import { TitleScreen } from "../scene/title/TitleScreen.js";

/**
 * 애플리케이션의 최상위 루트다.
 *
 * @returns 현재 표시할 게임 화면
 */
export function App(): React.ReactElement {
  return <TitleScreen />;
}
