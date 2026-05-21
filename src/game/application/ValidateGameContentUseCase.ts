import Ajv, { type ErrorObject, type SchemaObject, type ValidateFunction } from "ajv";
import type { DemoStageData } from "../../assets/stages.js";
import type {
  BattleCharacterData,
  BattleSkillData,
} from "./ResolveTurnEndUseCase.js";

/**
 * 콘텐츠 검증에 필요한 캐릭터 데이터다.
 */
export interface ValidatableCharacterData extends BattleCharacterData {
  readonly HP: number;
}

/**
 * 게임 콘텐츠 검증 입력이다.
 */
export interface ValidateGameContentInput {
  readonly characters: readonly ValidatableCharacterData[];
  readonly skills: readonly BattleSkillData[];
  readonly stages: readonly DemoStageData[];
}

/**
 * 게임 콘텐츠 검증 결과다.
 */
export interface ValidateGameContentOutput {
  readonly errors: readonly string[];
  readonly isValid: boolean;
}

type JsonCharacterSkillSlots = {
  readonly "1": string | null;
  readonly "2": string | null;
  readonly "3": string | null;
  readonly "4": string | null;
};

interface JsonCharacterData {
  readonly AGI: number;
  readonly AVD: number;
  readonly DEX: number;
  readonly HP: number;
  readonly INT: number;
  readonly LUK: number;
  readonly MND: number;
  readonly RES: number;
  readonly STR: number;
  readonly VIT: number;
  readonly id: string;
  readonly name: string;
  readonly skill_slots: JsonCharacterSkillSlots;
  readonly type: string;
}

interface JsonSkillData {
  readonly affected_stat: string | null;
  readonly attack_type: string;
  readonly duration_turns: number;
  readonly effect_type: string;
  readonly hit_count: number;
  readonly id: string;
  readonly multiplier: number;
  readonly name: string;
  readonly proc_chance: number;
  readonly replaceable: boolean;
  readonly source_stat: string;
  readonly target_side: string;
}

interface JsonStageCellData {
  readonly id: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

interface JsonStageMapData {
  readonly background: string;
  readonly cells: readonly JsonStageCellData[];
  readonly cols: number;
  readonly rows: number;
  readonly timer: number;
}

interface JsonStageData {
  readonly id: string;
  readonly map: JsonStageMapData;
  readonly name: string;
}

const statKeys = ["STR", "VIT", "DEX", "AGI", "AVD", "INT", "MND", "RES", "LUK"];
const attackTypes = ["physical", "magical", "auto"];
const effectTypes = ["damage", "buff", "debuff", "heal"];
const targetSides = ["self", "ally", "enemy"];

const characterSchema: SchemaObject = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: true,
    required: [
      "AGI",
      "AVD",
      "DEX",
      "HP",
      "INT",
      "LUK",
      "MND",
      "RES",
      "STR",
      "VIT",
      "id",
      "name",
      "skill_slots",
      "type",
    ],
    properties: {
      AGI: { type: "number" },
      AVD: { type: "number" },
      DEX: { type: "number" },
      HP: { type: "number" },
      INT: { type: "number" },
      LUK: { type: "number" },
      MND: { type: "number" },
      RES: { type: "number" },
      STR: { type: "number" },
      VIT: { type: "number" },
      id: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 },
      skill_slots: {
        type: "object",
        additionalProperties: false,
        required: ["1", "2", "3", "4"],
        properties: {
          "1": { type: "string", nullable: true },
          "2": { type: "string", nullable: true },
          "3": { type: "string", nullable: true },
          "4": { type: "string", nullable: true },
        },
      },
      type: { type: "string", minLength: 1 },
    },
  },
};

const skillSchema: SchemaObject = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: true,
    required: [
      "affected_stat",
      "attack_type",
      "duration_turns",
      "effect_type",
      "hit_count",
      "id",
      "multiplier",
      "name",
      "proc_chance",
      "replaceable",
      "source_stat",
      "target_side",
    ],
    properties: {
      affected_stat: { type: "string", nullable: true },
      attack_type: { type: "string", enum: attackTypes },
      duration_turns: { type: "number" },
      effect_type: { type: "string", enum: effectTypes },
      hit_count: { type: "number" },
      id: { type: "string", minLength: 1 },
      multiplier: { type: "number" },
      name: { type: "string", minLength: 1 },
      proc_chance: { type: "number", minimum: 0, maximum: 100 },
      replaceable: { type: "boolean" },
      source_stat: { type: "string", enum: statKeys },
      target_side: { type: "string", enum: targetSides },
    },
  },
};

const stageSchema: SchemaObject = {
  type: "array",
  minItems: 1,
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "map", "name"],
    properties: {
      id: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 },
      map: {
        type: "object",
        additionalProperties: false,
        required: ["background", "cells", "cols", "rows", "timer"],
        properties: {
          background: { type: "string", minLength: 1 },
          cells: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "type", "x", "y"],
              properties: {
                id: { type: "string" },
                type: { type: "string", minLength: 1 },
                x: { type: "number", minimum: 0 },
                y: { type: "number", minimum: 0 },
              },
            },
          },
          cols: { type: "number", minimum: 1 },
          rows: { type: "number", minimum: 1 },
          timer: { type: "number", minimum: 1 },
        },
      },
    },
  },
};

/**
 * 맵/캐릭터/스킬/스테이지 콘텐츠의 형태와 참조 무결성을 검증한다.
 */
export class ValidateGameContentUseCase {
  private readonly ajv = new Ajv({ allErrors: true });

  private readonly validateCharacters = this.ajv.compile(characterSchema);

  private readonly validateSkills = this.ajv.compile(skillSchema);

  private readonly validateStages = this.ajv.compile(stageSchema);

  /**
   * 콘텐츠 데이터의 스키마와 cross-reference를 검증한다.
   *
   * @param input 검증할 캐릭터, 스킬, 스테이지 데이터
   * @returns 검증 성공 여부와 오류 목록
   */
  public execute(input: ValidateGameContentInput): ValidateGameContentOutput {
    const errors: string[] = [];

    this.collectSchemaErrors(
      "characters",
      this.validateCharacters,
      input.characters,
      errors,
    );
    this.collectSchemaErrors("skills", this.validateSkills, input.skills, errors);
    this.collectSchemaErrors("stages", this.validateStages, input.stages, errors);

    this.collectReferenceErrors(input, errors);

    return {
      errors,
      isValid: errors.length === 0,
    };
  }

  private collectSchemaErrors(
    label: string,
    validate: ValidateFunction,
    data: unknown,
    errors: string[],
  ): void {
    if (validate(data)) {
      return;
    }

    const ajvErrors: readonly ErrorObject[] = validate.errors ?? [];

    errors.push(
      ...(ajvErrors.map(
        (error) => `${label}${error.instancePath}: ${error.message ?? "invalid"}`,
      )),
    );
  }

  private collectReferenceErrors(
    input: ValidateGameContentInput,
    errors: string[],
  ): void {
    const characterIds = new Set(input.characters.map((character) => character.id));
    const skillIds = new Set(input.skills.map((skill) => skill.id));

    input.characters.forEach((character) => {
      Object.values(character.skill_slots).forEach((skillId) => {
        if (skillId !== null && !skillIds.has(skillId)) {
          errors.push(`character ${character.id} references missing skill ${skillId}`);
        }
      });
    });

    input.skills.forEach((skill) => {
      if (skill.affected_stat !== null && !statKeys.includes(skill.affected_stat)) {
        errors.push(`skill ${skill.id} uses invalid affected_stat ${skill.affected_stat}`);
      }
    });

    input.stages.forEach((stage) => {
      stage.map.cells.forEach((cell) => {
        if (cell.id !== "" && !characterIds.has(cell.id)) {
          errors.push(`stage ${stage.id} references missing character ${cell.id}`);
        }

        if (cell.x >= stage.map.cols || cell.y >= stage.map.rows) {
          errors.push(`stage ${stage.id} has out-of-bounds cell ${cell.x}:${cell.y}`);
        }
      });
    });
  }
}
