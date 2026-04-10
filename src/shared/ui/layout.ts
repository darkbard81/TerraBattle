/**
 * 레이아웃 기준 해상도를 정의한다.
 */
export interface ReferenceResolution {
  readonly width: number;
  readonly height: number;
}

/**
 * 화면 스케일 계산 입력값을 정의한다.
 */
export interface ReferenceScaleInput {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly referenceResolution: ReferenceResolution;
  readonly minScale: number;
  readonly maxScale: number;
}

/**
 * 화면 여백 계산 입력값을 정의한다.
 */
export interface ViewportInsetInput {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly referenceResolution: ReferenceResolution;
  readonly scale: number;
}

/**
 * 화면 기준 스케일과 패딩 정보를 정의한다.
 */
export interface ViewportFrame {
  readonly scale: number;
  readonly horizontalInset: number;
  readonly verticalInset: number;
}

/**
 * 1080x1920 기준 좌표계를 실제 화면에 맞는 배율로 변환한다.
 *
 * @param input 현재 뷰포트와 기준 해상도 정보
 * @returns 최소/최대 제한이 적용된 기준 스케일
 */
export function calculateReferenceScale(input: ReferenceScaleInput): number {
  const widthScale = input.viewportWidth / input.referenceResolution.width;
  const heightScale = input.viewportHeight / input.referenceResolution.height;
  const rawScale = Math.min(widthScale, heightScale);

  return clamp(rawScale, input.minScale, input.maxScale);
}

/**
 * 기준 좌표계가 실제 화면 중앙에 오도록 여백을 계산한다.
 *
 * @param input 현재 뷰포트와 기준 해상도 정보
 * @returns 화면 중앙 정렬용 인셋 정보
 */
export function calculateViewportInset(input: ViewportInsetInput): {
  readonly horizontalInset: number;
  readonly verticalInset: number;
} {
  const contentWidth = input.referenceResolution.width * input.scale;
  const contentHeight = input.referenceResolution.height * input.scale;

  return {
    horizontalInset: Math.max((input.viewportWidth - contentWidth) / 2, 0),
    verticalInset: Math.max((input.viewportHeight - contentHeight) / 2, 0),
  };
}

/**
 * 실제 화면에 맞는 기준 프레임 정보를 한 번에 계산한다.
 *
 * @param viewportWidth 현재 화면 너비
 * @param viewportHeight 현재 화면 높이
 * @returns 기준 좌표계 스케일과 중앙 정렬 인셋
 */
export function createViewportFrame(
  viewportWidth: number,
  viewportHeight: number,
): ViewportFrame {
  const referenceResolution: ReferenceResolution = {
    width: 1080,
    height: 1920,
  };
  const scale = calculateReferenceScale({
    viewportWidth,
    viewportHeight,
    referenceResolution,
    minScale: 0.72,
    maxScale: 1.2,
  });
  const inset = calculateViewportInset({
    viewportWidth,
    viewportHeight,
    referenceResolution,
    scale,
  });

  return {
    scale,
    horizontalInset: inset.horizontalInset,
    verticalInset: inset.verticalInset,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
