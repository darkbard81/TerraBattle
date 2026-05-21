import { describe, expect, it } from "vitest";
import { ResolveBattleResultUseCase } from "./ResolveBattleResultUseCase.js";

const characters = [
  {
    id: "ally",
    type: "ally",
  },
  {
    id: "enemy",
    type: "enemy",
  },
] as const;

const annihilationRule = {
  type: "annihilation",
} as const;

describe("ResolveBattleResultUseCase", () => {
  it("아군과 적이 모두 살아 있으면 진행 중이다", () => {
    const useCase = new ResolveBattleResultUseCase();

    expect(
      useCase.execute({
        characters,
        entities: [
          {
            characterId: "ally",
            type: "ally",
          },
          {
            characterId: "enemy",
            type: "enemy",
          },
        ],
        rule: annihilationRule,
      }),
    ).toBe("ongoing");
  });

  it("적이 전멸하면 아군 승리다", () => {
    const useCase = new ResolveBattleResultUseCase();

    expect(
      useCase.execute({
        characters,
        entities: [
          {
            characterId: "ally",
            type: "ally",
          },
        ],
        rule: annihilationRule,
      }),
    ).toBe("allyWin");
  });

  it("아군이 전멸하면 적 승리다", () => {
    const useCase = new ResolveBattleResultUseCase();

    expect(
      useCase.execute({
        characters,
        entities: [
          {
            characterId: "enemy",
            type: "enemy",
          },
        ],
        rule: annihilationRule,
      }),
    ).toBe("enemyWin");
  });
});
