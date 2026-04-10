/**
 * 타이틀 화면에서 선택 가능한 액션 종류를 정의한다.
 */
export type TitleAction = "newGame" | "continue" | "settings";

/**
 * 타이틀 화면 메뉴 버튼의 표현 정보를 정의한다.
 */
export interface TitleMenuItem {
  readonly action: TitleAction;
  readonly label: string;
  readonly description: string;
}
