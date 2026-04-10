import type { JSX } from "react";
import { CreateTitleScreenState } from "../title/application/CreateTitleScreenState.js";
import { TitleScreen } from "../title/presentation/TitleScreen.js";

const createTitleScreenState = new CreateTitleScreenState();

/**
 * 앱의 최상위 진입 화면을 렌더링한다.
 *
 * @returns 타이틀 화면 컴포넌트
 */
export function App(): JSX.Element {
  const titleScreenState = createTitleScreenState.execute();

  return <TitleScreen state={titleScreenState} />;
}
