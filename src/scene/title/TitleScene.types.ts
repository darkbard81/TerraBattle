/**
 * 타이틀 HUD 버튼 정보를 정의한다.
 */
export interface TitleHudButton {
  readonly id: string;
  readonly label: string;
}

/**
 * 타이틀 HUD 입력값을 정의한다.
 */
export interface TitleHudProps {
  readonly onNewGame: () => void;
  readonly onLoadGame: () => void;
  readonly onOptions: () => void;
}
