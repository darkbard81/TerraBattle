import { describe, expect, it } from "vitest";
import {
  applyTurnResult,
  createInitialBattleState,
} from "./BattleStateMachine.js";

describe("BattleStateMachine", () => {
  it("새 전투는 아군 입력 단계에서 시작한다", () => {
    expect(createInitialBattleState()).toMatchObject({
      phase: "allyInput",
      result: "ongoing",
      turn: {
        activeSide: "ally",
        round: 1,
      },
    });
  });

  it("아군 turn이 끝나면 적 행동 단계로 전환한다", () => {
    const result = applyTurnResult(createInitialBattleState(), "ongoing");

    expect(result).toMatchObject({
      phase: "enemyAction",
      result: "ongoing",
      turn: {
        activeSide: "enemy",
        enemyTurnCount: 1,
        round: 1,
      },
    });
  });

  it("적 turn이 끝나면 다음 round의 아군 입력 단계로 전환한다", () => {
    const enemyState = applyTurnResult(createInitialBattleState(), "ongoing");
    const result = applyTurnResult(enemyState, "ongoing");

    expect(result).toMatchObject({
      phase: "allyInput",
      result: "ongoing",
      turn: {
        activeSide: "ally",
        allyTurnCount: 2,
        round: 2,
      },
    });
  });

  it("승패가 정해지면 result 단계에 머문다", () => {
    const result = applyTurnResult(createInitialBattleState(), "allyWin");

    expect(result).toMatchObject({
      phase: "result",
      result: "allyWin",
      turn: {
        activeSide: "ally",
        round: 1,
      },
    });
  });
});
