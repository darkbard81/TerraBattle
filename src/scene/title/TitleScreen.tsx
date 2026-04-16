import React from "react";
import titleBackgroundUrl from "../../assets/background/Title.webp";
import { VirtualStage } from "../../shared/display/VirtualStage.js";

/**
 * 타이틀 화면 입력값이다.
 */
export interface TitleScreenProps {
  readonly onNewGame: () => void;
}

/**
 * 타이틀 배경과 기본 메뉴를 표시한다.
 *
 * @param props 타이틀 화면 이벤트 핸들러
 * @returns 타이틀 화면 UI
 */
export function TitleScreen(props: TitleScreenProps): React.ReactElement {
  return (
    <VirtualStage
      ariaLabel="TerraBattle 타이틀 화면"
      backgroundImageUrl={titleBackgroundUrl}
    >
      <nav className="title-screen__menu" aria-label="타이틀 메뉴">
        <button
          className="title-screen__button"
          onClick={props.onNewGame}
          type="button"
        >
          New Game
        </button>
      </nav>
    </VirtualStage>
  );
}
