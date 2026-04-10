import type { TitleMenuItem } from "./TitleScreen.types.js";

/**
 * 타이틀 화면에서 필요한 읽기 전용 상태를 보관한다.
 */
export class TitleScreenState {
  public readonly title: string;

  public readonly subtitle: string;

  public readonly callout: string;

  public readonly menuItems: readonly TitleMenuItem[];

  /**
   * 타이틀 화면 상태를 생성한다.
   *
   * @param title 화면 메인 타이틀
   * @param subtitle 화면 보조 설명
   * @param callout 화면 강조 문구
   * @param menuItems 사용자 액션 목록
   */
  public constructor(
    title: string,
    subtitle: string,
    callout: string,
    menuItems: readonly TitleMenuItem[],
  ) {
    this.title = title;
    this.subtitle = subtitle;
    this.callout = callout;
    this.menuItems = menuItems;
  }
}
