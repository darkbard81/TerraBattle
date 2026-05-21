import React from "react";
import type {
  BattlePhase,
  BattleResult,
  BattleSide,
} from "../../game/application/BattleStateMachine.js";

/**
 * 맵 전투 HUD 입력값이다.
 */
export interface MapHudProps {
  readonly activeSide: BattleSide;
  readonly partyLevel: number;
  readonly remainingDragSeconds: number;
  readonly round: number;
  readonly stageIndex: number;
  readonly stageName: string;
  readonly totalStageCount: number;
}

/**
 * 전투 결과 오버레이 입력값이다.
 */
export interface BattleResultOverlayProps {
  readonly hasNextStage: boolean;
  readonly onBack: () => void;
  readonly onNextStage: () => void;
  readonly onRetry?: () => void;
  readonly result: Exclude<BattleResult, "ongoing">;
}

/**
 * 맵 입력 잠금 계산 입력값이다.
 */
export interface ResolveMapInputLockedInput {
  readonly isAnimationPlaying: boolean;
  readonly phase: BattlePhase;
}

/**
 * 맵 입력 잠금 여부를 계산한다.
 *
 * @param input 전투 phase와 연출 재생 상태
 * @returns 플레이어 입력을 막아야 하는지 여부
 */
export function resolveMapInputLocked(
  input: ResolveMapInputLockedInput,
): boolean {
  return input.isAnimationPlaying || input.phase !== "allyInput";
}

/**
 * 맵 전투의 주요 상태 HUD를 표시한다.
 *
 * @param props HUD 표시 정보
 * @returns 맵 전투 HUD
 */
export function MapHud(props: MapHudProps): React.ReactElement {
  return (
    <>
      <div className="map-scene__timer-hud" aria-live="polite">
        <span className="map-scene__timer-label">Time</span>
        <span className="map-scene__timer-value">
          {props.remainingDragSeconds.toFixed(1)}
        </span>
      </div>
      <div className="map-scene__turn-hud" aria-live="polite">
        <span className="map-scene__turn-label">ROUND</span>
        <span className="map-scene__turn-value">{props.round}</span>
        <span
          className={`map-scene__turn-side map-scene__turn-side--${props.activeSide}`}
        >
          {props.activeSide === "ally" ? "ALLY" : "ENEMY"}
        </span>
      </div>
      <div className="map-scene__stage-hud" aria-live="polite">
        <span className="map-scene__stage-label">
          STAGE {props.stageIndex + 1}/{props.totalStageCount}
        </span>
        <span className="map-scene__stage-name">{props.stageName}</span>
        <span className="map-scene__party-level">
          PARTY LV {props.partyLevel}
        </span>
      </div>
    </>
  );
}

/**
 * 전투 종료 후 다음 행동을 선택하는 결과 오버레이를 표시한다.
 *
 * @param props 결과와 버튼 핸들러
 * @returns 전투 결과 오버레이
 */
export function BattleResultOverlay(
  props: BattleResultOverlayProps,
): React.ReactElement {
  return (
    <div className="map-scene__battle-result" aria-live="assertive">
      <strong>
        {props.result === "allyWin"
          ? props.hasNextStage
            ? "VICTORY"
            : "DEMO CLEAR"
          : "DEFEAT"}
      </strong>
      <div className="map-scene__battle-result-actions">
        <button
          className="map-scene__result-button"
          onClick={props.onRetry}
          type="button"
        >
          Retry
        </button>
        {props.result === "allyWin" && props.hasNextStage ? (
          <button
            className="map-scene__result-button"
            onClick={props.onNextStage}
            type="button"
          >
            Next
          </button>
        ) : null}
        <button
          className="map-scene__result-button"
          onClick={props.onBack}
          type="button"
        >
          Title
        </button>
      </div>
    </div>
  );
}
