import type { CSSProperties, JSX } from "react";
import { createViewportFrame } from "../../shared/ui/layout.js";
import type { TitleScreenState } from "../domain/TitleScreenState.js";
import { TitleBackgroundCanvas } from "./TitleBackgroundCanvas.js";

/**
 * 타이틀 화면의 HUD 레이어를 렌더링한다.
 *
 * @param state 화면에 표시할 타이틀 상태
 * @returns 타이틀 화면
 */
export function TitleScreen({
  state,
}: {
  readonly state: TitleScreenState;
}): JSX.Element {
  const viewportFrame = createViewportFrame(window.innerWidth, window.innerHeight);

  return (
    <main
      className="title-screen"
      style={
        {
          "--viewport-scale": viewportFrame.scale.toString(),
          "--viewport-inset-x": `${viewportFrame.horizontalInset}px`,
          "--viewport-inset-y": `${viewportFrame.verticalInset}px`,
        } as CSSProperties
      }
    >
      <TitleBackgroundCanvas />

      <div className="title-screen__vignette" />

      <section className="title-screen__hud">
        <header className="title-screen__header">
          <p className="title-screen__eyebrow">Prototype Build 0.1</p>
          <h1 className="title-screen__title">{state.title}</h1>
          <p className="title-screen__subtitle">{state.subtitle}</p>
        </header>

        <aside className="title-screen__callout">
          <span className="title-screen__callout-label">Combat Definition</span>
          <strong>{state.callout}</strong>
        </aside>

        <nav className="title-screen__menu" aria-label="Title menu">
          {state.menuItems.map((menuItem, index) => (
            <button
              key={menuItem.action}
              className="title-screen__menu-button"
              type="button"
              disabled={menuItem.action !== "newGame"}
              style={
                {
                  "--stagger-index": index.toString(),
                } as CSSProperties
              }
            >
              <span className="title-screen__menu-label">{menuItem.label}</span>
              <span className="title-screen__menu-description">{menuItem.description}</span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
