import type { TurnHitResultEvent } from "./ResolveTurnEndUseCase.js";

/**
 * 적 턴 해석에 필요한 맵 크기다.
 */
export interface EnemyTurnMapData {
  readonly cols: number;
  readonly rows: number;
}

/**
 * 적 턴 해석에 필요한 보드 엔티티다.
 */
export interface EnemyTurnEntity {
  readonly characterId: string;
  readonly instanceId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

/**
 * 적 턴 해석에 필요한 캐릭터 진영 정보다.
 */
export interface EnemyTurnCharacterData {
  readonly id: string;
  readonly type: string;
}

/**
 * 적 턴 해석 입력이다.
 */
export interface ResolveEnemyTurnInput {
  readonly characters: readonly EnemyTurnCharacterData[];
  readonly entities: readonly EnemyTurnEntity[];
  readonly map: EnemyTurnMapData;
}

/**
 * 적 턴 해석 결과다.
 */
export interface ResolveEnemyTurnOutput {
  readonly directHitEvents: readonly TurnHitResultEvent[];
  readonly entities: readonly EnemyTurnEntity[];
}

/**
 * grid 좌표다.
 */
interface GridPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * 적 턴의 기본 이동과 인접 공격을 계산한다.
 */
export class ResolveEnemyTurnUseCase {
  private static readonly enemyBasicAttackDamage = 12;

  /**
   * 가장 가까운 아군을 향해 적을 한 칸 이동시키고, 이동 후 인접한 경우 기본 공격 이벤트를 만든다.
   *
   * @param input 현재 보드 엔티티와 캐릭터 진영, 맵 크기
   * @returns 이동 후 보드 엔티티와 직접 타격 이벤트
   */
  public execute(input: ResolveEnemyTurnInput): ResolveEnemyTurnOutput {
    const charactersById = new Map(
      input.characters.map((character) => [character.id, character] as const),
    );
    const allies = input.entities.filter((entity) =>
      this.isEntitySide(entity, charactersById, "ally"),
    );
    const enemies = input.entities.filter((entity) =>
      this.isEntitySide(entity, charactersById, "enemy"),
    );
    const blockedPositions = new Set(
      input.entities
        .filter((entity) => !this.isEntitySide(entity, charactersById, "enemy"))
        .map((entity) => this.createPositionKey(entity.x, entity.y)),
    );
    const movedEnemies = new Map<string, EnemyTurnEntity>();
    const directHitEvents: TurnHitResultEvent[] = [];

    enemies.forEach((enemy) => {
      const target = this.findNearestEntity(enemy, allies);

      if (target === undefined) {
        movedEnemies.set(enemy.instanceId, enemy);
        return;
      }

      const nextPosition =
        this.createMoveCandidates(enemy, target).find(
          (candidate) =>
            this.isInsideMap(candidate, input.map) &&
            !blockedPositions.has(this.createPositionKey(candidate.x, candidate.y)),
        ) ?? enemy;
      const movedEnemy = {
        ...enemy,
        x: nextPosition.x,
        y: nextPosition.y,
      };

      movedEnemies.set(enemy.instanceId, movedEnemy);

      if (this.calculateGridDistance(movedEnemy, target) <= 1) {
        directHitEvents.push(
          this.createBasicAttackEvent({
            attacker: movedEnemy,
            eventIndex: directHitEvents.length,
            target,
          }),
        );
      }
    });

    return {
      directHitEvents,
      entities: input.entities.map(
        (entity) => movedEnemies.get(entity.instanceId) ?? entity,
      ),
    };
  }

  private createBasicAttackEvent(input: {
    readonly attacker: EnemyTurnEntity;
    readonly eventIndex: number;
    readonly target: EnemyTurnEntity;
  }): TurnHitResultEvent {
    return {
      attackerCharacterId: input.attacker.characterId,
      attackerInstanceId: input.attacker.instanceId,
      damage: ResolveEnemyTurnUseCase.enemyBasicAttackDamage,
      eventId: [
        input.attacker.instanceId,
        input.target.instanceId,
        "enemy-basic",
        input.eventIndex,
      ].join(":"),
      hitIndex: 1,
      result: "hit",
      skillId: "skill_basic_attack",
      skillName: "기본 공격",
      targetCharacterId: input.target.characterId,
      targetInstanceId: input.target.instanceId,
      targetX: input.target.x,
      targetY: input.target.y,
    };
  }

  private findNearestEntity(
    origin: EnemyTurnEntity,
    candidates: readonly EnemyTurnEntity[],
  ): EnemyTurnEntity | undefined {
    return candidates
      .slice()
      .sort(
        (first, second) =>
          this.calculateGridDistance(origin, first) -
          this.calculateGridDistance(origin, second),
      )[0];
  }

  private createMoveCandidates(
    entity: EnemyTurnEntity,
    target: EnemyTurnEntity,
  ): readonly GridPosition[] {
    if (entity.type === "enemy_guard") {
      return this.calculateGridDistance(entity, target) <= 1 ? [entity] : [];
    }

    const deltaX = Math.sign(target.x - entity.x);
    const deltaY = Math.sign(target.y - entity.y);
    const candidates: GridPosition[] = [];
    const maxStep = entity.type === "enemy_rusher" ? 2 : 1;

    if (Math.abs(target.x - entity.x) >= Math.abs(target.y - entity.y) && deltaX !== 0) {
      candidates.push({ x: entity.x + deltaX * maxStep, y: entity.y });
    }

    if (deltaY !== 0) {
      candidates.push({ x: entity.x, y: entity.y + deltaY * maxStep });
    }

    if (deltaX !== 0) {
      candidates.push({ x: entity.x + deltaX * maxStep, y: entity.y });
    }

    if (maxStep > 1 && deltaX !== 0) {
      candidates.push({ x: entity.x + deltaX, y: entity.y });
    }

    if (maxStep > 1 && deltaY !== 0) {
      candidates.push({ x: entity.x, y: entity.y + deltaY });
    }

    return candidates.filter(
      (candidate, index, allCandidates) =>
        allCandidates.findIndex((other) =>
          this.isSameGridPosition(candidate, other),
        ) === index,
    );
  }

  private isEntitySide(
    entity: EnemyTurnEntity,
    charactersById: ReadonlyMap<string, EnemyTurnCharacterData>,
    side: "ally" | "enemy",
  ): boolean {
    const character = charactersById.get(entity.characterId);

    return entity.type === side || character?.type === side;
  }

  private isInsideMap(position: GridPosition, map: EnemyTurnMapData): boolean {
    return (
      position.x >= 0 &&
      position.x < map.cols &&
      position.y >= 0 &&
      position.y < map.rows
    );
  }

  private calculateGridDistance(first: GridPosition, second: GridPosition): number {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
  }

  private isSameGridPosition(first: GridPosition, second: GridPosition): boolean {
    return first.x === second.x && first.y === second.y;
  }

  private createPositionKey(x: number, y: number): string {
    return `${x}:${y}`;
  }
}
