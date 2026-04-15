import { describe, expect, it } from "vitest";

import { ContentIntegrityChecker } from "./ContentIntegrityChecker.js";
import { ContentMigrator } from "./ContentMigrator.js";
import { StaticContentRepository } from "./ContentRepository.js";
import { ContentValidator } from "./ContentValidator.js";
import { canonicalizeJson } from "./canonicalizeJson.js";

describe("StaticContentRepository", () => {
  it("dev pack을 로드하면 구조/무결성 검증을 통과한다", async () => {
    const repository = new StaticContentRepository(
      new ContentValidator(),
      new ContentIntegrityChecker(),
      new ContentMigrator(),
    );

    const pack = await repository.loadPack("dev");

    expect(pack.manifest.meta.pack_id).toBe("dev");
    expect(pack.skills.length).toBeGreaterThan(0);
    expect(pack.characters.length).toBeGreaterThan(0);
    expect(pack.maps.length).toBeGreaterThan(0);
    expect(pack.dialogues.length).toBeGreaterThan(0);
  });

  it("지원하지 않는 pack id는 예외를 던진다", async () => {
    const repository = new StaticContentRepository(
      new ContentValidator(),
      new ContentIntegrityChecker(),
      new ContentMigrator(),
    );

    await expect(repository.loadPack("unknown")).rejects.toThrow("지원하지 않는 pack id");
  });
});

describe("ContentValidator", () => {
  it("잘못된 skill proc_chance는 error 이슈를 반환한다", () => {
    const validator = new ContentValidator();

    const result = validator.validatePack({
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
          id: "skill_invalid",
          name: "잘못된 스킬",
          replaceable: true,
          proc_chance: 101,
          effect_type: "damage",
          attack_type: "physical",
          target_side: "enemy",
          source_stat: "STR",
          affected_stat: null,
          multiplier: 1,
          hit_count: 1,
          duration_turns: 0,
          description: "invalid",
        },
      ],
      characters: [],
      maps: [],
      dialogues: [],
    });

    expect(result.some((issue) => issue.path.endsWith("proc_chance") && issue.severity === "error")).toBe(true);
  });
});

describe("ContentIntegrityChecker", () => {
  it("존재하지 않는 skill 참조를 error로 감지한다", () => {
    const checker = new ContentIntegrityChecker();

    const result = checker.check({
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
      skills: [],
      characters: [
        {
          id: "char_1",
          name: "A",
          description: "A",
          image_path: "image",
          tile_x: 0,
          tile_y: 0,
          tile_w: 1,
          tile_h: 1,
          level: 1,
          exp: 0,
          skill_slots: {
            "1": "missing_skill",
            "2": null,
            "3": null,
            "4": null,
          },
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
          HP: 55,
        },
      ],
      maps: [],
      dialogues: [],
    });

    expect(result.some((issue) => issue.message.includes("존재하지 않는 skill id"))).toBe(true);
  });
});

describe("canonicalizeJson", () => {
  it("객체 키를 정렬한 canonical JSON 문자열을 만든다", () => {
    const value = {
      z: 3,
      a: {
        c: 2,
        b: 1,
      },
    };

    expect(canonicalizeJson(value)).toBe('{"a":{"b":1,"c":2},"z":3}');
  });
});
