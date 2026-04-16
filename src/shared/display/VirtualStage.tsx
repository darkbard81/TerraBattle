import React, { useEffect, useState } from "react";

/**
 * 모든 씬이 공유하는 가상 화면 너비다.
 */
export const VIRTUAL_STAGE_WIDTH = 1200;

/**
 * 모든 씬이 공유하는 가상 화면 높이다.
 */
export const VIRTUAL_STAGE_HEIGHT = 1920;

/**
 * 브라우저 표시 영역 크기다.
 */
interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

/**
 * 가상 스테이지 렌더링에 필요한 입력값이다.
 */
export interface VirtualStageProps {
  readonly ariaLabel: string;
  readonly backgroundImageUrl: string;
  readonly children: React.ReactNode;
}

/**
 * 브라우저 크기를 기준으로 가상 스테이지의 fit 배율을 계산한다.
 *
 * @param viewportSize 브라우저 표시 영역 크기
 * @returns 가상 해상도를 화면 안에 모두 표시하는 배율
 */
function calculateFitScale(viewportSize: ViewportSize): number {
  return Math.min(
    viewportSize.width / VIRTUAL_STAGE_WIDTH,
    viewportSize.height / VIRTUAL_STAGE_HEIGHT,
  );
}

/**
 * 현재 브라우저 표시 영역 크기를 반환한다.
 *
 * @returns 브라우저 표시 영역 크기
 */
function getViewportSize(): ViewportSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * 씬마다 공유하는 1200x1920 가상 좌표계 스테이지를 표시한다.
 *
 * @param props 가상 스테이지 설정과 자식 UI
 * @returns 브라우저 크기에 맞춰 fit 되는 가상 스테이지
 */
export function VirtualStage(
  props: VirtualStageProps,
): React.ReactElement {
  const [viewportSize, setViewportSize] =
    useState<ViewportSize>(getViewportSize);

  useEffect(() => {
    const updateViewportSize = (): void => {
      setViewportSize(getViewportSize());
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return (): void => {
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  const stageScale = calculateFitScale(viewportSize);

  return (
    <main className="virtual-stage-root" aria-label={props.ariaLabel}>
      <div
        className="virtual-stage"
        style={{
          backgroundImage: `url(${props.backgroundImageUrl})`,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
        }}
      >
        {props.children}
      </div>
    </main>
  );
}
