import type { BattleEndRule, BattleResult } from "./BattleStateMachine.js";
import {
  ResolveBattleDamageUseCase,
  type BattleDamageCharacterData,
} from "./ResolveBattleDamageUseCase.js";
import { ResolveBattleResultUseCase } from "./ResolveBattleResultUseCase.js";
import { ResolveEnemyTurnUseCase, type EnemyTurnMapData } from "./ResolveEnemyTurnUseCase.js";
import {
  ResolveTurnEndUseCase,
  type BattleActiveStatEffect,
  type BattleCharacterData,
  type BattleSkillData,
  type TurnHitResultEvent,
  type TurnSandwichAttackEvent,
} from "./ResolveTurnEndUseCase.js";

/**
 * 맵 전투 turn 계산에 필요한 엔티티 상태다.
 */
export interface MapBattleEntity {
  readonly characterId: string;
  readonly instanceId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

/**
 * 아군 turn 종료 시 반영할 이동 입력이다.
 */
export interface MoveMapBattleEntityInput {
  readonly instanceId: string;
  readonly x: number;
  readonly y: number;
}

/**
 * 맵 전투 turn 계산에 필요한 캐릭터 데이터다.
 */
export interface MapBattleCharacterData
  extends BattleCharacterData,
    BattleDamageCharacterData {}

/**
 * 맵 전투 turn 계산 공통 입력이다.
 */
export interface ResolveMapBattleTurnBaseInput<TEntity extends MapBattleEntity> {
  readonly activeStatEffects: readonly BattleActiveStatEffect[];
  readonly battleEndRule: BattleEndRule;
  readonly characters: readonly MapBattleCharacterData[];
  readonly entities: readonly TEntity[];
  readonly hpById: ReadonlyMap<string, number>;
  readonly map: EnemyTurnMapData;
  readonly random: () => number;
  readonly skills: readonly BattleSkillData[];
}

/**
 * 아군 turn 계산 입력이다.
 */
export interface ResolveAllyMapBattleTurnInput<TEntity extends MapBattleEntity>
  extends ResolveMapBattleTurnBaseInput<TEntity> {
  readonly moves: readonly MoveMapBattleEntityInput[];
}

/**
 * 맵 전투 turn 계산 결과다.
 */
export interface ResolveMapBattleTurnOutput<TEntity extends MapBattleEntity> {
  readonly activeStatEffects: readonly BattleActiveStatEffect[];
  readonly battleResult: BattleResult;
  readonly entities: readonly TEntity[];
  readonly hitResultEvents: readonly TurnHitResultEvent[];
  readonly hpById: ReadonlyMap<string, number>;
  readonly sandwichAttackEvents: readonly TurnSandwichAttackEvent[];
}

/**
 * 맵 전투의 아군/적 turn 계산을 UI와 분리해 수행한다.
 */
export class ResolveMapBattleTurnUseCase {
  private readonly resolveBattleDamageUseCase = new ResolveBattleDamageUseCase();

  private readonly resolveBattleResultUseCase = new ResolveBattleResultUseCase();

  private readonly resolveEnemyTurnUseCase = new ResolveEnemyTurnUseCase();

  private readonly resolveTurnEndUseCase = new ResolveTurnEndUseCase();

  /**
   * 아군 이동 결과를 기준으로 공격, 피해, 승패, 활성 효과를 계산한다.
   *
   * @param input 현재 전투 상태와 아군 이동 입력
   * @returns 아군 turn 처리 결과
   */
  public executeAllyTurn<TEntity extends MapBattleEntity>(
    input: ResolveAllyMapBattleTurnInput<TEntity>,
  ): ResolveMapBattleTurnOutput<TEntity> {
    const nextPositionById = new Map(
      input.moves.map((move) => [move.instanceId, move] as const),
    );
    const movedEntities = input.entities.map((entity) => {
      const nextPosition = nextPositionById.get(entity.instanceId);

      return nextPosition !== undefined
        ? {
            ...entity,
            x: nextPosition.x,
            y: nextPosition.y,
          }
        : entity;
    });
    const turnResult = this.resolveTurnEndUseCase.execute({
      activeStatEffects: input.activeStatEffects,
      attackingSide: "ally",
      characters: input.characters,
      random: input.random,
      skills: input.skills,
      units: movedEntities.map((entity) => ({
        characterId: entity.characterId,
        instanceId: entity.instanceId,
        x: entity.x,
        y: entity.y,
      })),
    });

    return this.resolveTurnOutcome({
      activeStatEffects: input.activeStatEffects,
      battleEndRule: input.battleEndRule,
      characters: input.characters,
      entities: movedEntities,
      hitResultEvents: turnResult.hitResultEvents,
      hpById: input.hpById,
      sandwichAttackEvents: turnResult.sandwichAttackEvents,
      skills: input.skills,
    });
  }

  /**
   * 적 AI 행동과 후속 공격, 피해, 승패, 활성 효과를 계산한다.
   *
   * @param input 현재 전투 상태
   * @returns 적 turn 처리 결과
   */
  public executeEnemyTurn<TEntity extends MapBattleEntity>(
    input: ResolveMapBattleTurnBaseInput<TEntity>,
  ): ResolveMapBattleTurnOutput<MapBattleEntity> {
    const enemyTurn = this.resolveEnemyTurnUseCase.execute({
      characters: input.characters,
      entities: input.entities,
      map: input.map,
    });
    const turnResult = this.resolveTurnEndUseCase.execute({
      activeStatEffects: input.activeStatEffects,
      attackingSide: "enemy",
      characters: input.characters,
      random: input.random,
      skills: input.skills,
      units: enemyTurn.entities.map((entity) => ({
        characterId: entity.characterId,
        instanceId: entity.instanceId,
        x: entity.x,
        y: entity.y,
      })),
    });

    return this.resolveTurnOutcome({
      activeStatEffects: input.activeStatEffects,
      battleEndRule: input.battleEndRule,
      characters: input.characters,
      entities: enemyTurn.entities,
      hitResultEvents: [
        ...enemyTurn.directHitEvents,
        ...turnResult.hitResultEvents,
      ],
      hpById: input.hpById,
      sandwichAttackEvents: turnResult.sandwichAttackEvents,
      skills: input.skills,
    });
  }

  private resolveTurnOutcome<TEntity extends MapBattleEntity>(input: {
    readonly activeStatEffects: readonly BattleActiveStatEffect[];
    readonly battleEndRule: BattleEndRule;
    readonly characters: readonly MapBattleCharacterData[];
    readonly entities: readonly TEntity[];
    readonly hitResultEvents: readonly TurnHitResultEvent[];
    readonly hpById: ReadonlyMap<string, number>;
    readonly sandwichAttackEvents: readonly TurnSandwichAttackEvent[];
    readonly skills: readonly BattleSkillData[];
  }): ResolveMapBattleTurnOutput<TEntity> {
    const damageResult = this.resolveBattleDamageUseCase.execute({
      characters: input.characters,
      entities: input.entities,
      hitResultEvents: input.hitResultEvents,
      hpById: input.hpById,
    });
    const activeStatEffects = this.advanceActiveStatEffects({
      currentEffects: input.activeStatEffects,
      newEffects: this.createActiveStatEffectsFromEvents(
        input.hitResultEvents,
        input.skills,
      ),
    });
    const battleResult = this.resolveBattleResultUseCase.execute({
      characters: input.characters,
      entities: damageResult.aliveEntities,
      rule: input.battleEndRule,
    });

    return {
      activeStatEffects,
      battleResult,
      entities: damageResult.aliveEntities,
      hitResultEvents: input.hitResultEvents,
      hpById: damageResult.hpById,
      sandwichAttackEvents: input.sandwichAttackEvents,
    };
  }

  private createActiveStatEffectsFromEvents(
    events: readonly TurnHitResultEvent[],
    skills: readonly BattleSkillData[],
  ): readonly BattleActiveStatEffect[] {
    return events.flatMap((event) => {
      if (event.result !== "buff" && event.result !== "debuff") {
        return [];
      }

      const skill = skills.find((candidate) => candidate.id === event.skillId);

      if (skill?.affected_stat === null || skill?.affected_stat === undefined) {
        return [];
      }

      return [
        {
          multiplier: skill.multiplier,
          remainingTurns: Math.max(1, skill.duration_turns),
          stat: skill.affected_stat,
          targetInstanceId: event.targetInstanceId,
        },
      ];
    });
  }

  private advanceActiveStatEffects(input: {
    readonly currentEffects: readonly BattleActiveStatEffect[];
    readonly newEffects: readonly BattleActiveStatEffect[];
  }): readonly BattleActiveStatEffect[] {
    return [
      ...input.currentEffects.flatMap((effect) => {
        const remainingTurns = effect.remainingTurns - 1;

        return remainingTurns > 0
          ? [
              {
                ...effect,
                remainingTurns,
              },
            ]
          : [];
      }),
      ...input.newEffects,
    ];
  }
}
