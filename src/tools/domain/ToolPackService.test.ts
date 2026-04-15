import { describe, expect, it } from "vitest";
import type { ContentPack } from "../../content/domain/ContentSchema.types.js";
import { ToolPackService } from "./ToolPackService.js";

const BASE_PACK: ContentPack = {
  manifest: {
    meta: {
      pack_id: "dev",
      schema_version: "1.0.0",
      tool_version: "1.0.0",
    },
    files: {
      skills: "skills.json",
      characters: "characters.json",
      maps: [],
      dialogues: [],
    },
  },
  skills: [
    {
      id: "skill_basic",
      name: "기본",
      replaceable: false,
      proc_chance: 100,
      effect_type: "damage",
      attack_type: "physical",
      target_side: "enemy",
      source_stat: "STR",
      affected_stat: null,
      multiplier: 1,
      hit_count: 1,
      duration_turns: 0,
      description: "기본",
    },
  ],
  characters: [
    {
      id: "char_base",
      name: "Base",
      description: "base",
      image_path: "path",
      tile_x: 0,
      tile_y: 0,
      tile_w: 1,
      tile_h: 1,
      level: 1,
      exp: 0,
      skill_slots: { "1": "skill_basic", "2": null, "3": null, "4": null },
      STR: 50,
      VIT: 50,
      DEX: 50,
      AGI: 50,
      AVD: 50,
      INT: 50,
      MND: 50,
      RES: 50,
      LUK: 50,
      current_grown_type: "Balanced",
      HP: 50,
    },
  ],
  maps: [],
  dialogues: [],
};

describe("ToolPackService", () => {
  it("유효한 데이터는 error 없는 검증 결과를 반환한다", () => {
    const service = new ToolPackService();
    const pack = service.buildPack(BASE_PACK, BASE_PACK.skills, BASE_PACK.characters);

    const issues = service.validatePack(pack);

    expect(issues.some((issue) => issue.severity === "error")).toBe(false);
  });

  it("export는 id를 먼저 표시하는 JSON 문자열을 반환한다", () => {
    const service = new ToolPackService();
    const result = service.export(BASE_PACK.skills, BASE_PACK.characters);

    expect(result.skillsJson).toContain('"id": "skill_basic"');
    expect(result.skillsJson.trimStart().startsWith('[\n  {\n    "id"')).toBe(true);
    expect(result.charactersJson).toContain('"id": "char_base"');
    expect(result.charactersJson.trimStart().startsWith('[\n  {\n    "id"')).toBe(true);
  });
});
