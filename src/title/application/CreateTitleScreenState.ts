import { TitleScreenState } from "../domain/TitleScreenState.js";
import type { TitleMenuItem } from "../domain/TitleScreen.types.js";

/**
 * 타이틀 화면의 초기 상태를 조립한다.
 */
export class CreateTitleScreenState {
  /**
   * 타이틀 화면 진입 시 필요한 상태를 생성한다.
   *
   * @returns 타이틀 화면 상태
   */
  public execute(): TitleScreenState {
    const menuItems: readonly TitleMenuItem[] = [
      {
        action: "newGame",
        label: "Start Operation",
        description: "첫 전장을 열고 기본 전술 흐름을 확인합니다.",
      },
      {
        action: "continue",
        label: "Continue",
        description: "저장 데이터 연결 전까지 비활성 안내 역할을 합니다.",
      },
      {
        action: "settings",
        label: "Settings",
        description: "HUD 스케일과 입력 규칙 옵션이 이 위치에 들어갑니다.",
      },
    ];

    return new TitleScreenState(
      "TERRA BATTLE",
      "Boundary-crossing tactical battle prototype",
      "Grid-occupancy tactics. React HUD. Pixi world.",
      menuItems,
    );
  }
}
