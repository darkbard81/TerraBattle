/**
 * 가상 기준 해상도를 정의한다.
 */
export interface VirtualResolution {
  readonly width: number;
  readonly height: number;
}

/**
 * 전체 화면 레이아웃에서 사용하는 가상 기준 너비다.
 */
export const VIRTUAL_WIDTH = 1080;

/**
 * 전체 화면 레이아웃에서 사용하는 가상 기준 높이다.
 */
export const VIRTUAL_HEIGHT = 1920;

/**
 * 전체 화면 레이아웃에서 사용하는 가상 기준 해상도다.
 */
export const VIRTUAL_RESOLUTION: VirtualResolution = {
  width: VIRTUAL_WIDTH,
  height: VIRTUAL_HEIGHT,
};
