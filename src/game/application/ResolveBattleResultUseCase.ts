import type {
  BattleEndRule,
  BattleResult,
  BattleSide,
} from "./BattleStateMachine.js";

/**
 * 승패 판정에 필요한 보드 엔티티다.
 */
export interface BattleResultEntity {
  readonly characterId: string;
  readonly type: string;
}

/**
 * 승패 판정에 필요한 캐릭터 진영 데이터다.
 */
export interface BattleResultCharacterData {
  readonly id: string;
  readonly type: string;
}

/**
 * 승패 판정 입력이다.
 */
export interface ResolveBattleResultInput {
  readonly characters: readonly BattleResultCharacterData[];
  readonly entities: readonly BattleResultEntity[];
  readonly rule: BattleEndRule;
}

/**
 * 전투 종료조건에 따라 승패를 계산한다.
 */
export class ResolveBattleResultUseCase {
  /**
   * 생존 엔티티 목록을 기준으로 현재 전투 결과를 판정한다.
   *
   * @param input 생존 엔티티, 캐릭터 진영 데이터, 종료조건
   * @returns 현재 전투 결과
   */
  public execute(input: ResolveBattleResultInput): BattleResult {
    if (input.rule.type === "annihilation") {
      return this.resolveAnnihilation(input.entities, input.characters);
    }

    return "ongoing";
  }

  private resolveAnnihilation(
    entities: readonly BattleResultEntity[],
    characters: readonly BattleResultCharacterData[],
  ): BattleResult {
    const charactersById = new Map(
      characters.map((character) => [character.id, character] as const),
    );
    const allyCount = entities.filter((entity) =>
      this.isEntitySide(entity, charactersById, "ally"),
    ).length;
    const enemyCount = entities.filter((entity) =>
      this.isEntitySide(entity, charactersById, "enemy"),
    ).length;

    if (enemyCount <= 0) {
      return "allyWin";
    }

    if (allyCount <= 0) {
      return "enemyWin";
    }

    return "ongoing";
  }

  private isEntitySide(
    entity: BattleResultEntity,
    charactersById: ReadonlyMap<string, BattleResultCharacterData>,
    side: BattleSide,
  ): boolean {
    const character = charactersById.get(entity.characterId);

    return entity.type === side || character?.type === side;
  }
}
