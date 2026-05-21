import type { TurnHitResultEvent } from "./ResolveTurnEndUseCase.js";

/**
 * 피해 적용에 필요한 보드 엔티티다.
 */
export interface BattleDamageEntity {
  readonly characterId: string;
  readonly instanceId: string;
}

/**
 * 피해 적용에 필요한 캐릭터 HP 데이터다.
 */
export interface BattleDamageCharacterData {
  readonly HP: number;
  readonly id: string;
}

/**
 * 피해 적용 입력이다.
 */
export interface ResolveBattleDamageInput<TEntity extends BattleDamageEntity> {
  readonly characters: readonly BattleDamageCharacterData[];
  readonly entities: readonly TEntity[];
  readonly hitResultEvents: readonly TurnHitResultEvent[];
  readonly hpById: ReadonlyMap<string, number>;
}

/**
 * 피해 적용 결과다.
 */
export interface ResolveBattleDamageOutput<TEntity extends BattleDamageEntity> {
  readonly aliveEntities: readonly TEntity[];
  readonly hpById: ReadonlyMap<string, number>;
}

/**
 * 전투 피해를 HP 상태에 반영하고 사망한 엔티티를 제거한다.
 */
export class ResolveBattleDamageUseCase {
  /**
   * 타격 이벤트를 현재 HP에 적용한 뒤 생존 엔티티와 다음 HP 상태를 반환한다.
   *
   * @param input 현재 엔티티, 캐릭터 HP 데이터, 현재 HP, 타격 이벤트
   * @returns 피해 적용 후 HP 상태와 생존 엔티티
   */
  public execute<TEntity extends BattleDamageEntity>(
    input: ResolveBattleDamageInput<TEntity>,
  ): ResolveBattleDamageOutput<TEntity> {
    const characterHpById = new Map(
      input.characters.map((character) => [character.id, character.HP] as const),
    );
    const nextHpById = new Map(input.hpById);

    input.hitResultEvents.forEach((event) => {
      const currentHp =
        nextHpById.get(event.targetInstanceId) ??
        characterHpById.get(event.targetCharacterId);

      if (currentHp === undefined) {
        return;
      }

      if (event.result === "heal") {
        const maxHp = characterHpById.get(event.targetCharacterId) ?? currentHp;

        nextHpById.set(
          event.targetInstanceId,
          Math.min(maxHp, currentHp + event.damage),
        );
        return;
      }

      if (event.result !== "hit" && event.result !== "miss") {
        return;
      }

      nextHpById.set(
        event.targetInstanceId,
        Math.max(0, currentHp - event.damage),
      );
    });

    const aliveEntities = input.entities.filter((entity) => {
      const currentHp = nextHpById.get(entity.instanceId);

      return currentHp === undefined || currentHp > 0;
    });
    const aliveInstanceIds = new Set(
      aliveEntities.map((entity) => entity.instanceId),
    );

    input.entities.forEach((entity) => {
      if (!aliveInstanceIds.has(entity.instanceId)) {
        nextHpById.delete(entity.instanceId);
      }
    });

    return {
      aliveEntities,
      hpById: nextHpById,
    };
  }
}
