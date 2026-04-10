import React from "react";
import { Application, extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import type { GameState, GameStateAction } from "../game/state/GameState.types.js";
import { TitleScene } from "../scene/title/TitleScene.js";

extend({
  Container,
  Sprite,
});

/**
 * 게임 셸 입력값을 정의한다.
 */
export interface GameShellProps {
  readonly gameState: GameState;
  readonly dispatch: React.ActionDispatch<[action: GameStateAction]>;
}

/**
 * 공통 캔버스를 유지하면서 현재 장면을 전환한다.
 *
 * @param props 현재 게임 상태와 디스패치 함수
 * @returns 공통 Pixi 캔버스와 장면 HUD
 */
export function GameShell(props: GameShellProps): React.ReactElement {
  return (
    <main className="game-shell">
      <Application className="game-shell__canvas" resizeTo={window} background="#000000" antialias>
        {props.gameState.scene === "title" ? <TitleScene.Stage /> : null}
      </Application>

      <div className="game-shell__hud-layer">
        {props.gameState.scene === "title" ? (
          <TitleScene.HUD
            onNewGame={() => {
              props.dispatch({ type: "set-scene", scene: "battle" });
            }}
            onLoadGame={() => {
              props.dispatch({ type: "open-modal", modal: "load-game" });
            }}
            onOptions={() => {
              props.dispatch({ type: "open-modal", modal: "options" });
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
