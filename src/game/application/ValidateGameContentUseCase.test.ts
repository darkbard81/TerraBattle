import { describe, expect, it } from "vitest";
import charactersData from "../../assets/characters.json";
import skillsData from "../../assets/skills.json";
import { DEMO_STAGES } from "../../assets/stages.js";
import { ValidateGameContentUseCase } from "./ValidateGameContentUseCase.js";
import type {
  BattleCharacterData,
  BattleSkillData,
} from "./ResolveTurnEndUseCase.js";

interface TestCharacterData extends BattleCharacterData {
  readonly HP: number;
}

const characters = charactersData as readonly TestCharacterData[];
const skills = skillsData as readonly BattleSkillData[];

describe("ValidateGameContentUseCase", () => {
  it("현재 데모 콘텐츠 데이터는 스키마와 참조 검증을 통과한다", () => {
    const useCase = new ValidateGameContentUseCase();

    const result = useCase.execute({
      characters,
      skills,
      stages: DEMO_STAGES,
    });

    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it("존재하지 않는 스킬 참조를 오류로 반환한다", () => {
    const useCase = new ValidateGameContentUseCase();

    const result = useCase.execute({
      characters: [
        {
          ...characters[0],
          skill_slots: {
            ...characters[0].skill_slots,
            "1": "missing_skill",
          },
        },
      ],
      skills,
      stages: DEMO_STAGES,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `${"character"} ${characters[0].id} references missing skill missing_skill`,
    );
  });

  it("스테이지의 존재하지 않는 캐릭터 참조를 오류로 반환한다", () => {
    const useCase = new ValidateGameContentUseCase();

    const result = useCase.execute({
      characters,
      skills,
      stages: [
        {
          ...DEMO_STAGES[0],
          map: {
            ...DEMO_STAGES[0].map,
            cells: [
              ...DEMO_STAGES[0].map.cells,
              {
                id: "missing_character",
                type: "enemy",
                x: 0,
                y: 1,
              },
            ],
          },
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `stage ${DEMO_STAGES[0].id} references missing character missing_character`,
    );
  });
});
