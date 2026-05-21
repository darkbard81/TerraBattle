import { describe, expect, it } from "vitest";
import { resolveMapInputLocked } from "./MapHud.js";

describe("resolveMapInputLocked", () => {
  it("아군 입력 단계이며 연출 중이 아니면 입력을 허용한다", () => {
    expect(
      resolveMapInputLocked({
        isAnimationPlaying: false,
        phase: "allyInput",
      }),
    ).toBe(false);
  });

  it("연출 재생 중이면 입력을 잠근다", () => {
    expect(
      resolveMapInputLocked({
        isAnimationPlaying: true,
        phase: "allyInput",
      }),
    ).toBe(true);
  });

  it("아군 입력 단계가 아니면 입력을 잠근다", () => {
    expect(
      resolveMapInputLocked({
        isAnimationPlaying: false,
        phase: "enemyAction",
      }),
    ).toBe(true);
  });
});
