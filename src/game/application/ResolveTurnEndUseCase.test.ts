import { describe, expect, it } from "vitest";
import {
  ResolveTurnEndUseCase,
  type BattleCharacterData,
  type BattleSkillData,
  type TurnEndBoardUnit,
} from "./ResolveTurnEndUseCase.js";

const basicAttackSkill: BattleSkillData = {
  affected_stat: null,
  attack_type: "physical",
  description: "기본 물리 공격",
  duration_turns: 0,
  effect_type: "damage",
  hit_count: 1,
  id: "skill_basic_attack",
  multiplier: 1,
  name: "기본 공격",
  proc_chance: 100,
  replaceable: false,
  source_stat: "STR",
  target_side: "enemy",
};

const healSkill: BattleSkillData = {
  affected_stat: null,
  attack_type: "auto",
  description: "자신을 회복한다",
  duration_turns: 0,
  effect_type: "heal",
  hit_count: 1,
  id: "skill_heal",
  multiplier: 0.5,
  name: "회복",
  proc_chance: 100,
  replaceable: false,
  source_stat: "MND",
  target_side: "self",
};

function createCharacter(
  id: string,
  type: "ally" | "enemy",
  skillId = "skill_basic_attack",
): BattleCharacterData {
  return {
    AGI: 50,
    AVD: 50,
    DEX: 50,
    INT: 50,
    LUK: 50,
    MND: 50,
    RES: 50,
    STR: 50,
    VIT: 50,
    id,
    name: id,
    skill_slots: {
      "1": skillId,
      "2": null,
      "3": null,
      "4": null,
    },
    type,
  };
}

describe("ResolveTurnEndUseCase", () => {
  it("샌드위치가 성립하면 양쪽 아군의 기본 공격 피해를 계산한다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "ally-left",
        instanceId: "ally-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "enemy",
        instanceId: "enemy:0",
        x: 1,
        y: 0,
      },
      {
        characterId: "ally-right",
        instanceId: "ally-right:0",
        x: 2,
        y: 0,
      },
    ];

    const result = useCase.execute({
      characters: [
        createCharacter("ally-left", "ally"),
        createCharacter("ally-right", "ally"),
        createCharacter("enemy", "enemy"),
      ],
      random: () => 0,
      skills: [basicAttackSkill],
      units,
    });

    expect(result.sandwichAttackEvents).toHaveLength(1);
    expect(result.sandwichAttackEvents[0]).toMatchObject({
      firstAttackerInstanceId: "ally-left:0",
      secondAttackerInstanceId: "ally-right:0",
      targetInstanceId: "enemy:0",
    });
    expect(result.hitResultEvents).toHaveLength(2);
    expect(result.hitResultEvents.map((event) => event.result)).toEqual([
      "hit",
      "hit",
    ]);
    expect(result.hitResultEvents.map((event) => event.damage)).toEqual([18, 18]);
    expect(result.hitResultEvents.map((event) => event.targetInstanceId)).toEqual([
      "enemy:0",
      "enemy:0",
    ]);
  });

  it("명중하지 못한 개별 타격은 miss 결과로 반환한다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "ally-left",
        instanceId: "ally-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "enemy",
        instanceId: "enemy:0",
        x: 1,
        y: 0,
      },
      {
        characterId: "ally-right",
        instanceId: "ally-right:0",
        x: 2,
        y: 0,
      },
    ];

    const result = useCase.execute({
      characters: [
        createCharacter("ally-left", "ally"),
        createCharacter("ally-right", "ally"),
        createCharacter("enemy", "enemy"),
      ],
      random: () => 0.99,
      skills: [basicAttackSkill],
      units,
    });

    expect(result.sandwichAttackEvents).toHaveLength(1);
    expect(result.hitResultEvents).toHaveLength(2);
    expect(result.hitResultEvents.map((event) => event.result)).toEqual([
      "miss",
      "miss",
    ]);
    expect(result.hitResultEvents.map((event) => event.damage)).toEqual([0, 0]);
  });

  it("샌드위치가 성립하지 않으면 공격하지 않는다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "ally-left",
        instanceId: "ally-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "enemy",
        instanceId: "enemy:0",
        x: 1,
        y: 0,
      },
    ];

    const result = useCase.execute({
      characters: [
        createCharacter("ally-left", "ally"),
        createCharacter("enemy", "enemy"),
      ],
      random: () => 0,
      skills: [basicAttackSkill],
      units,
    });

    expect(result.sandwichAttackEvents).toHaveLength(0);
    expect(result.hitResultEvents).toHaveLength(0);
  });

  it("적 진영 기준 샌드위치가 성립하면 아군에게 피해를 계산한다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "enemy-left",
        instanceId: "enemy-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "ally",
        instanceId: "ally:0",
        x: 1,
        y: 0,
      },
      {
        characterId: "enemy-right",
        instanceId: "enemy-right:0",
        x: 2,
        y: 0,
      },
    ];

    const result = useCase.execute({
      attackingSide: "enemy",
      characters: [
        createCharacter("enemy-left", "enemy"),
        createCharacter("enemy-right", "enemy"),
        createCharacter("ally", "ally"),
      ],
      random: () => 0,
      skills: [basicAttackSkill],
      units,
    });

    expect(result.sandwichAttackEvents).toHaveLength(1);
    expect(result.sandwichAttackEvents[0]).toMatchObject({
      firstAttackerInstanceId: "enemy-left:0",
      secondAttackerInstanceId: "enemy-right:0",
      targetInstanceId: "ally:0",
    });
    expect(result.hitResultEvents).toHaveLength(2);
    expect(result.hitResultEvents.map((event) => event.targetInstanceId)).toEqual([
      "ally:0",
      "ally:0",
    ]);
  });

  it("회복 스킬은 heal 결과 이벤트를 반환한다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "ally-left",
        instanceId: "ally-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "enemy",
        instanceId: "enemy:0",
        x: 1,
        y: 0,
      },
      {
        characterId: "ally-right",
        instanceId: "ally-right:0",
        x: 2,
        y: 0,
      },
    ];

    const result = useCase.execute({
      characters: [
        createCharacter("ally-left", "ally", "skill_heal"),
        createCharacter("ally-right", "ally"),
        createCharacter("enemy", "enemy"),
      ],
      random: () => 0,
      skills: [basicAttackSkill, healSkill],
      units,
    });

    expect(result.hitResultEvents.some((event) => event.result === "heal")).toBe(true);
    expect(result.hitResultEvents.find((event) => event.result === "heal")).toMatchObject({
      damage: 25,
      targetInstanceId: "ally-left:0",
    });
  });

  it("활성 능력치 효과는 피해 계산에 반영된다", () => {
    const useCase = new ResolveTurnEndUseCase();
    const units: readonly TurnEndBoardUnit[] = [
      {
        characterId: "ally-left",
        instanceId: "ally-left:0",
        x: 0,
        y: 0,
      },
      {
        characterId: "enemy",
        instanceId: "enemy:0",
        x: 1,
        y: 0,
      },
      {
        characterId: "ally-right",
        instanceId: "ally-right:0",
        x: 2,
        y: 0,
      },
    ];

    const result = useCase.execute({
      activeStatEffects: [
        {
          multiplier: 2,
          remainingTurns: 1,
          stat: "STR",
          targetInstanceId: "ally-left:0",
        },
      ],
      characters: [
        createCharacter("ally-left", "ally"),
        createCharacter("ally-right", "ally"),
        createCharacter("enemy", "enemy"),
      ],
      random: () => 0,
      skills: [basicAttackSkill],
      units,
    });

    expect(result.hitResultEvents[0]?.damage).toBeGreaterThan(18);
  });
});
