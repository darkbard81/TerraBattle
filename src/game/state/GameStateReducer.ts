import type { GameState, GameStateAction } from "./GameState.types.js";

/**
 * 앱 시작 시점의 전역 게임 상태를 생성한다.
 *
 * @returns 기본 게임 상태
 */
export function createInitialGameState(): GameState {
  return {
    scene: "title",
    turn: "player",
    selectedUnitId: null,
    modal: null,
  };
}

/**
 * 전역 게임 상태를 액션에 따라 갱신한다.
 *
 * @param state 현재 게임 상태
 * @param action 상태 전환 액션
 * @returns 갱신된 게임 상태
 */
export function gameStateReducer(
  state: GameState,
  action: GameStateAction,
): GameState {
  switch (action.type) {
    case "set-scene":
      return {
        ...state,
        scene: action.scene,
      };
    case "set-turn":
      return {
        ...state,
        turn: action.turn,
      };
    case "set-selected-unit":
      return {
        ...state,
        selectedUnitId: action.selectedUnitId,
      };
    case "open-modal":
      return {
        ...state,
        modal: action.modal,
      };
    case "close-modal":
      return {
        ...state,
        modal: null,
      };
    default:
      return state;
  }
}
