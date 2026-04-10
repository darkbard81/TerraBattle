import React from "react";
import type { TitleHudButton, TitleHudProps } from "./TitleScene.types.js";

const TITLE_HUD_BUTTONS: readonly TitleHudButton[] = [
  { id: "new-game", label: "New Game" },
  { id: "load-game", label: "Load Game" },
  { id: "options", label: "Options" },
];

/**
 * 타이틀 HUD를 렌더링한다.
 *
 * @param props 타이틀 버튼 이벤트 핸들러
 * @returns 타이틀 HUD 레이어
 */
export function TitleHUD(props: TitleHudProps): React.ReactElement {
  return (
    <section className="title-scene__hud" aria-label="Title HUD">
      <h1 className="title-scene__title">TERRA BATTLE</h1>
      <nav className="title-scene__menu" aria-label="Title menu">
        {TITLE_HUD_BUTTONS.map((button) => (
          <button
            key={button.id}
            className="title-scene__button"
            type="button"
            onClick={createTitleButtonHandler({ buttonId: button.id, props })}
          >
            {button.label}
          </button>
        ))}
      </nav>
    </section>
  );
}

interface CreateTitleButtonHandlerInput {
  readonly buttonId: TitleHudButton["id"];
  readonly props: TitleHudProps;
}

function createTitleButtonHandler(
  input: CreateTitleButtonHandlerInput,
): () => void {
  switch (input.buttonId) {
    case "new-game":
      return input.props.onNewGame;
    case "load-game":
      return input.props.onLoadGame;
    case "options":
      return input.props.onOptions;
    default:
      return input.props.onOptions;
  }
}
