import { describe, expect, it } from "vitest";
import {
  ResolveBattleDamageUseCase,
  type BattleDamageCharacterData,
  type BattleDamageEntity,
} from "./ResolveBattleDamageUseCase.js";
import type { TurnHitResultEvent } from "./ResolveTurnEndUseCase.js";

const characters: readonly BattleDamageCharacterData[] = [
  {
    HP: 30,
    id: "ally",
  },
  {
    HP: 20,
    id: "enemy",
  },
];

function createHit(input: {
  readonly damage: number;
  readonly result?: TurnHitResultEvent["result"];
  readonly targetCharacterId: string;
  readonly targetInstanceId: string;
}): TurnHitResultEvent {
  return {
    attackerCharacterId: "attacker",
    attackerInstanceId: "attacker:0",
    damage: input.damage,
    eventId: `hit:${input.targetInstanceId}:${input.damage}`,
    hitIndex: 1,
    result: input.result ?? "hit",
    skillId: "skill_basic_attack",
    skillName: "기본 공격",
    targetCharacterId: input.targetCharacterId,
    targetInstanceId: input.targetInstanceId,
    targetX: 0,
    targetY: 0,
  };
}

describe("ResolveBattleDamageUseCase", () => {
  it("현재 HP에서 피해를 차감한다", () => {
    const useCase = new ResolveBattleDamageUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        {
          characterId: "enemy",
          instanceId: "enemy:0",
        },
      ],
      hitResultEvents: [
        createHit({
          damage: 7,
          targetCharacterId: "enemy",
          targetInstanceId: "enemy:0",
        }),
      ],
      hpById: new Map([["enemy:0", 20]]),
    });

    expect(result.hpById.get("enemy:0")).toBe(13);
    expect(result.aliveEntities).toHaveLength(1);
  });

  it("HP가 0이 된 엔티티는 생존 목록과 HP 상태에서 제거한다", () => {
    const useCase = new ResolveBattleDamageUseCase();
    const enemy: BattleDamageEntity = {
      characterId: "enemy",
      instanceId: "enemy:0",
    };

    const result = useCase.execute({
      characters,
      entities: [enemy],
      hitResultEvents: [
        createHit({
          damage: 20,
          targetCharacterId: "enemy",
          targetInstanceId: "enemy:0",
        }),
      ],
      hpById: new Map([["enemy:0", 20]]),
    });

    expect(result.aliveEntities).toHaveLength(0);
    expect(result.hpById.has("enemy:0")).toBe(false);
  });

  it("현재 HP가 없으면 캐릭터 기본 HP에서 피해를 적용한다", () => {
    const useCase = new ResolveBattleDamageUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        {
          characterId: "ally",
          instanceId: "ally:0",
        },
      ],
      hitResultEvents: [
        createHit({
          damage: 5,
          targetCharacterId: "ally",
          targetInstanceId: "ally:0",
        }),
      ],
      hpById: new Map(),
    });

    expect(result.hpById.get("ally:0")).toBe(25);
    expect(result.aliveEntities).toHaveLength(1);
  });

  it("heal 이벤트는 HP를 최대 HP까지만 회복한다", () => {
    const useCase = new ResolveBattleDamageUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        {
          characterId: "ally",
          instanceId: "ally:0",
        },
      ],
      hitResultEvents: [
        createHit({
          damage: 12,
          result: "heal",
          targetCharacterId: "ally",
          targetInstanceId: "ally:0",
        }),
      ],
      hpById: new Map([["ally:0", 24]]),
    });

    expect(result.hpById.get("ally:0")).toBe(30);
    expect(result.aliveEntities).toHaveLength(1);
  });
});
