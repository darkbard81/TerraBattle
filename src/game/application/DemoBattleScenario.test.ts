import { describe, expect, it } from "vitest";
import charactersData from "../../assets/characters.json";
import skillsData from "../../assets/skills.json";
import { DEMO_STAGES } from "../../assets/stages.js";
import {
  ResolveBattleDamageUseCase,
  type BattleDamageEntity,
} from "./ResolveBattleDamageUseCase.js";
import { ResolveBattleResultUseCase } from "./ResolveBattleResultUseCase.js";
import { ResolveTurnEndUseCase } from "./ResolveTurnEndUseCase.js";
import type {
  BattleCharacterData,
  BattleSkillData,
  TurnEndBoardUnit,
} from "./ResolveTurnEndUseCase.js";

interface ScenarioCharacterData extends BattleCharacterData {
  readonly HP: number;
}

interface ScenarioEntity extends BattleDamageEntity {
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

const characters = charactersData as readonly ScenarioCharacterData[];
const skills = skillsData as readonly BattleSkillData[];

function createScenarioEntities(stageIndex: number): readonly ScenarioEntity[] {
  const stage = DEMO_STAGES[stageIndex];

  if (stage === undefined) {
    return [];
  }

  return stage.map.cells.flatMap((cell, index) =>
    cell.id === ""
      ? []
      : [
          {
            characterId: cell.id,
            instanceId: `${cell.type}:${cell.id}:${index}`,
            type: cell.type,
            x: cell.x,
            y: cell.y,
          },
        ],
  );
}

function createInitialHpById(
  entities: readonly ScenarioEntity[],
): ReadonlyMap<string, number> {
  return new Map(
    entities.flatMap((entity) => {
      const character = characters.find((candidate) => candidate.id === entity.characterId);

      return character === undefined ? [] : [[entity.instanceId, character.HP] as const];
    }),
  );
}

describe("DemoBattleScenario", () => {
  it("첫 스테이지에서 샌드위치 공격, 피해 적용, 승패 판정을 순서대로 수행할 수 있다", () => {
    const turnEndUseCase = new ResolveTurnEndUseCase();
    const damageUseCase = new ResolveBattleDamageUseCase();
    const resultUseCase = new ResolveBattleResultUseCase();
    const entities = createScenarioEntities(0).map((entity) => {
      if (entity.characterId === "char_monster_001") {
        return {
          ...entity,
          x: 1,
          y: 0,
        };
      }

      if (entity.characterId === "char_hero_002") {
        return {
          ...entity,
          x: 2,
          y: 0,
        };
      }

      return entity;
    });
    const units: readonly TurnEndBoardUnit[] = entities.map((entity) => ({
      characterId: entity.characterId,
      instanceId: entity.instanceId,
      x: entity.x,
      y: entity.y,
    }));
    const turnResult = turnEndUseCase.execute({
      characters,
      random: () => 0,
      skills,
      units,
    });

    expect(turnResult.sandwichAttackEvents.length).toBeGreaterThan(0);
    expect(turnResult.hitResultEvents.length).toBeGreaterThan(0);

    const damageResult = damageUseCase.execute({
      characters,
      entities,
      hitResultEvents: turnResult.hitResultEvents,
      hpById: createInitialHpById(entities),
    });
    const battleResult = resultUseCase.execute({
      characters,
      entities: damageResult.aliveEntities,
      rule: {
        type: "annihilation",
      },
    });

    expect(damageResult.hpById.size).toBeGreaterThan(0);
    expect(["ongoing", "allyWin", "enemyWin"]).toContain(battleResult);
  });
});
