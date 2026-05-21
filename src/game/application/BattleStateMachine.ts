/**
 * 전투에 참여하는 진영이다.
 */
export type BattleSide = "ally" | "enemy";

/**
 * 전투 루프의 현재 처리 단계다.
 */
export type BattlePhase = "allyInput" | "enemyAction" | "result";

/**
 * 현재 전투 결과다.
 */
export type BattleResult = "ongoing" | "allyWin" | "enemyWin";

/**
 * 전투 종료조건 종류다.
 */
export type BattleEndRuleType = "annihilation";

/**
 * 현재 전투 turn 진행 상태다.
 */
export interface BattleTurnState {
  readonly activeSide: BattleSide;
  readonly round: number;
  readonly allyTurnCount: number;
  readonly enemyTurnCount: number;
}

/**
 * 전투 종료조건 설정이다.
 */
export interface BattleEndRule {
  readonly type: BattleEndRuleType;
}

/**
 * 맵 전투의 런타임 상태다.
 */
export interface BattleState {
  readonly endRule: BattleEndRule;
  readonly phase: BattlePhase;
  readonly result: BattleResult;
  readonly turn: BattleTurnState;
}

/**
 * 전투 상태 머신의 초기 상태를 만든다.
 *
 * @returns 새 전투의 초기 상태
 */
export function createInitialBattleState(): BattleState {
  return {
    endRule: {
      type: "annihilation",
    },
    phase: "allyInput",
    result: "ongoing",
    turn: {
      activeSide: "ally",
      allyTurnCount: 1,
      enemyTurnCount: 0,
      round: 1,
    },
  };
}

/**
 * 다음 전투 turn 상태를 계산한다.
 *
 * @param turn 현재 전투 turn 상태
 * @returns 다음 전투 turn 상태
 */
export function advanceBattleTurn(turn: BattleTurnState): BattleTurnState {
  if (turn.activeSide === "ally") {
    return {
      ...turn,
      activeSide: "enemy",
      enemyTurnCount: turn.enemyTurnCount + 1,
    };
  }

  return {
    ...turn,
    activeSide: "ally",
    allyTurnCount: turn.allyTurnCount + 1,
    round: turn.round + 1,
  };
}

/**
 * 전투 결과와 다음 turn에 따라 다음 phase를 결정한다.
 *
 * @param result 현재 처리 결과
 * @param turn 다음 turn 상태
 * @returns 전투 루프의 다음 처리 단계
 */
export function resolveNextBattlePhase(
  result: BattleResult,
  turn: BattleTurnState,
): BattlePhase {
  if (result !== "ongoing") {
    return "result";
  }

  return turn.activeSide === "ally" ? "allyInput" : "enemyAction";
}

/**
 * turn 처리 결과를 전투 상태 머신에 반영한다.
 *
 * @param state 현재 전투 상태
 * @param result turn 처리 후 전투 결과
 * @returns 다음 전투 상태
 */
export function applyTurnResult(
  state: BattleState,
  result: BattleResult,
): BattleState {
  const nextTurn = result === "ongoing" ? advanceBattleTurn(state.turn) : state.turn;

  return {
    ...state,
    phase: resolveNextBattlePhase(result, nextTurn),
    result,
    turn: nextTurn,
  };
}
