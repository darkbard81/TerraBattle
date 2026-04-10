import { TitleHUD } from "./TitleHUD.js";
import { TitleLayer } from "./TitleLayer.js";

/**
 * 타이틀 장면에서 노출하는 레이어와 HUD를 묶는다.
 */
export const TitleScene = {
  Stage: TitleLayer,
  HUD: TitleHUD,
};
