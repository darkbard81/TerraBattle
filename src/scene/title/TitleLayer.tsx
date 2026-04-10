import React, { useEffect, useState } from "react";
import { Assets, Texture } from "pixi.js";
import titleBackgroundImage from "../../assets/background/Title.webp";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../../shared/constants/display.js";

/**
 * 브라우저 기준 타이틀 스테이지 변환값을 정의한다.
 */
export interface TitleStageTransform {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

/**
 * 타이틀 배경 Pixi 레이어를 렌더링한다.
 *
 * @returns 타이틀 배경 레이어
 */
export function TitleLayer(): React.ReactElement | null {
  const texture = useTitleBackgroundTexture();
  const stageTransform = useTitleStageTransform();

  if (texture === null) {
    return null;
  }

  return (
    <pixiContainer x={stageTransform.x} y={stageTransform.y} scale={stageTransform.scale}>
      <pixiSprite texture={texture} x={0} y={0} width={VIRTUAL_WIDTH} height={VIRTUAL_HEIGHT} />
    </pixiContainer>
  );
}

/**
 * 타이틀 배경 텍스처를 비동기로 로드한다.
 *
 * @returns 로드된 배경 텍스처 또는 `null`
 */
export function useTitleBackgroundTexture(): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Assets.load(titleBackgroundImage).then((loadedTexture) => {
      if (isMounted) {
        setTexture(loadedTexture);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return texture;
}

/**
 * 브라우저 크기 변경에 맞춰 타이틀 스테이지 변환값을 다시 계산한다.
 *
 * @returns 중앙 정렬용 위치와 fit 스케일
 */
export function useTitleStageTransform(): TitleStageTransform {
  const [stageTransform, setStageTransform] = useState<TitleStageTransform>(
    getTitleStageTransform(),
  );

  useEffect(() => {
    const handleResize = (): void => {
      setStageTransform(getTitleStageTransform());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return stageTransform;
}

/**
 * 현재 브라우저에 맞는 타이틀 스테이지 변환값을 계산한다.
 *
 * @returns 중앙 정렬용 위치와 fit 스케일
 */
export function getTitleStageTransform(): TitleStageTransform {
  const scale = Math.min(
    window.innerWidth / VIRTUAL_WIDTH,
    window.innerHeight / VIRTUAL_HEIGHT,
  );

  return {
    x: (window.innerWidth - VIRTUAL_WIDTH * scale) / 2,
    y: (window.innerHeight - VIRTUAL_HEIGHT * scale) / 2,
    scale,
  };
}
