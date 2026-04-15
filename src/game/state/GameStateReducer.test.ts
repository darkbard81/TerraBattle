import { describe, expect, it } from "vitest";

import { createInitialGameState, gameStateReducer } from "./GameStateReducer.js";

describe("createInitialGameState", () => {
  it("초기 scene은 title이다", () => {
    const state = createInitialGameState();

    expect(state.scene).toBe("title");
  });

  it("초기 turn은 player다", () => {
    const state = createInitialGameState();

    expect(state.turn).toBe("player");
  });

  it("초기 selectedUnitId와 modal은 null이다", () => {
    const state = createInitialGameState();

    expect(state.selectedUnitId).toBeNull();
    expect(state.modal).toBeNull();
  });
});

describe("gameStateReducer", () => {
  it("set-scene 액션은 scene만 변경한다", () => {
    const currentState = createInitialGameState();

    const nextState = gameStateReducer(currentState, {
      type: "set-scene",
      scene: "battle",
    });

    expect(nextState.scene).toBe("battle");
    expect(nextState.turn).toBe("player");
    expect(nextState.selectedUnitId).toBeNull();
    expect(nextState.modal).toBeNull();
  });

  it("set-turn 액션은 turn만 변경한다", () => {
    const currentState = createInitialGameState();

    const nextState = gameStateReducer(currentState, {
      type: "set-turn",
      turn: "enemy",
    });

    expect(nextState.scene).toBe("title");
    expect(nextState.turn).toBe("enemy");
    expect(nextState.selectedUnitId).toBeNull();
    expect(nextState.modal).toBeNull();
  });

  it("set-selected-unit 액션은 selectedUnitId를 변경한다", () => {
    const currentState = createInitialGameState();

    const nextState = gameStateReducer(currentState, {
      type: "set-selected-unit",
      selectedUnitId: "unit-1",
    });

    expect(nextState.selectedUnitId).toBe("unit-1");
  });

  it("open-modal / close-modal 액션은 modal을 열고 닫는다", () => {
    const currentState = createInitialGameState();

    const openedState = gameStateReducer(currentState, {
      type: "open-modal",
      modal: "options",
    });

    expect(openedState.modal).toBe("options");

    const closedState = gameStateReducer(openedState, {
      type: "close-modal",
    });

    expect(closedState.modal).toBeNull();
  });
});
