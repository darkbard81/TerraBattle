import React, { useReducer } from "react";
import { GameShell } from "./GameShell.js";
import {
  createInitialGameState,
  gameStateReducer,
} from "../game/state/GameStateReducer.js";

/**
 * 애플리케이션의 최상위 루트다.
 *
 * @returns 전역 게임 상태를 소유한 앱 루트
 */
export function App(): React.ReactElement {
  const [gameState, dispatch] = useReducer(
    gameStateReducer,
    undefined,
    createInitialGameState,
  );

  return <GameShell gameState={gameState} dispatch={dispatch} />;
}
