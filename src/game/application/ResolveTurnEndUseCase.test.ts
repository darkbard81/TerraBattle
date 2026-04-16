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

function createCharacter(
  id: string,
  type: "ally" | "enemy",
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
      "1": "skill_basic_attack",
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
});
