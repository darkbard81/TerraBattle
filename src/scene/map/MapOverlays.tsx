import React from "react";
import type {
  BattleAnimationQueueState,
  BattleAnimationStagePosition,
} from "./BattleAnimationQueue.js";

/**
 * HP 상태 표시용 유닛 정보다.
 */
export interface UnitStatusViewModel {
  readonly currentHp: number;
  readonly hpRatio: number;
  readonly instanceId: string;
  readonly maxHp: number;
  readonly name: string;
  readonly stagePosition: BattleAnimationStagePosition;
}

/**
 * 유닛 HP 상태 레이어 입력값이다.
 */
export interface UnitStatusLayerProps {
  readonly units: readonly UnitStatusViewModel[];
}

/**
 * 전투 연출 레이어 입력값이다.
 */
export interface BattleAnimationLayerProps {
  readonly animationState: BattleAnimationQueueState;
  readonly layerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 유닛별 HP 상태를 맵 위에 표시한다.
 *
 * @param props 표시할 유닛 상태 목록
 * @returns 유닛 상태 레이어
 */
export function UnitStatusLayer(
  props: UnitStatusLayerProps,
): React.ReactElement {
  return (
    <div className="map-scene__unit-status-layer" aria-hidden="true">
      {props.units.map((unit) => (
        <div
          className="map-scene__unit-hp"
          key={unit.instanceId}
          style={{
            left: unit.stagePosition.x,
            top: unit.stagePosition.y,
          }}
        >
          <span className="map-scene__unit-hp-name">{unit.name}</span>
          <span className="map-scene__unit-hp-track">
            <span
              className="map-scene__unit-hp-fill"
              style={{ transform: `scaleX(${unit.hpRatio})` }}
            />
          </span>
          <span className="map-scene__unit-hp-value">
            {unit.currentHp}/{unit.maxHp}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 샌드위치/스킬명/피해 텍스트 전투 연출 레이어를 표시한다.
 *
 * @param props 전투 연출 상태와 DOM ref
 * @returns 전투 연출 레이어
 */
export function BattleAnimationLayer(
  props: BattleAnimationLayerProps,
): React.ReactElement {
  return (
    <div
      className={
        props.animationState.isPlaying
          ? "map-scene__damage-layer map-scene__damage-layer--input-lock"
          : "map-scene__damage-layer"
      }
      aria-hidden="true"
      ref={props.layerRef}
    >
      {props.animationState.sandwichAttackAnimations.map((animation) => (
        <div
          className="map-scene__sandwich-attack"
          key={animation.animationId}
          style={{
            left: animation.stagePosition.x,
            top: animation.stagePosition.y,
          }}
        >
          {[animation.firstActor, animation.secondActor].map((actor) => (
            <img
              alt=""
              className={`map-scene__sandwich-character map-scene__sandwich-character--${actor.side}`}
              draggable={false}
              key={`${animation.animationId}:${actor.side}`}
              src={actor.imageUrl}
              style={
                {
                  "--map-scene-sandwich-character-scale": actor.scale,
                  "--map-scene-sandwich-character-scale-enter": actor.scale * 0.82,
                  "--map-scene-sandwich-character-scale-exit": actor.scale * 0.74,
                  "--map-scene-sandwich-character-scale-impact": actor.scale * 1.12,
                  "--map-scene-sandwich-character-scale-near": actor.scale * 1.04,
                  animationDelay: `${animation.delayMs}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
      {props.animationState.skillNameAnimations.map((animation) => (
        <div
          className="map-scene__skill-name-box"
          key={animation.animationId}
          style={{
            animationDelay: `${animation.delayMs}ms`,
            left: animation.stagePosition.x,
            top: animation.stagePosition.y,
          }}
        >
          {animation.skillNames.map((skillName, index) => (
            <span
              className="map-scene__skill-name-text"
              key={`${animation.animationId}:${index}`}
            >
              {skillName}
            </span>
          ))}
        </div>
      ))}
      {props.animationState.damageTextAnimations.map((animation) => (
        <span
          className={`map-scene__damage-text map-scene__damage-text--${animation.result}`}
          key={animation.animationId}
          style={{
            animationDelay: `${animation.delayMs}ms`,
            left: animation.stagePosition.x,
            top: animation.stagePosition.y,
          }}
        >
          {animation.label}
        </span>
      ))}
    </div>
  );
}
