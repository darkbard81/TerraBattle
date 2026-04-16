import React, { useEffect, useState } from "react";
import titleBackgroundUrl from "../../assets/background/Title.webp";

const VIRTUAL_WIDTH = 1200;
const VIRTUAL_HEIGHT = 1920;

/**
 * 타이틀 화면의 브라우저 기반 크기 정보다.
 */
interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

/**
 * 브라우저 크기를 기준으로 타이틀 화면 스테이지의 fit 배율을 계산한다.
 *
 * @param viewportSize 브라우저 표시 영역 크기
 * @returns 1200x1920 가상 해상도를 화면 안에 모두 표시하는 배율
 */
function calculateStageScale(viewportSize: ViewportSize): number {
  return Math.min(
    viewportSize.width / VIRTUAL_WIDTH,
    viewportSize.height / VIRTUAL_HEIGHT,
  );
}

/**
 * 타이틀 배경과 기본 메뉴를 표시한다.
 *
 * @returns 타이틀 화면 UI
 */
export function TitleScreen(): React.ReactElement {
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const updateViewportSize = (): void => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return (): void => {
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  const stageScale = calculateStageScale(viewportSize);

  return (
    <main className="title-screen" aria-label="TerraBattle 타이틀 화면">
      <div
        className="title-screen__stage"
        style={{
          backgroundImage: `url(${titleBackgroundUrl})`,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
        }}
      >
        <nav className="title-screen__menu" aria-label="타이틀 메뉴">
          <button className="title-screen__button" type="button">
            New Game
          </button>
        </nav>
      </div>
    </main>
  );
}
