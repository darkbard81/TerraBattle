import { describe, expect, it } from "vitest";
import type { CharacterDef } from "../../content/domain/ContentSchema.types.js";
import { CharacterCombatPreviewService } from "./CharacterCombatPreviewService.js";

const BASE_CHARACTER: CharacterDef = {
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
  skill_slots: { "1": null, "2": null, "3": null, "4": null },
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
};

describe("CharacterCombatPreviewService", () => {
  it("파생치를 문서 수식대로 계산한다", () => {
    const service = new CharacterCombatPreviewService();

    const derived = service.calculateDerivedStats(BASE_CHARACTER);

    expect(derived.PATK).toBe(62.5);
    expect(derived.PDEF).toBe(62.5);
    expect(derived.MATK).toBe(62.5);
    expect(derived.MDEF).toBe(62.5);
    expect(derived.PHIT).toBe(62.5);
    expect(derived.MHIT).toBe(62.5);
    expect(derived.PEVA).toBe(62.5);
    expect(derived.MEVA).toBe(62.5);
  });

  it("동일 스탯 간 전투 미리보기는 기본값을 반환한다", () => {
    const service = new CharacterCombatPreviewService();

    const preview = service.calculateCombatPreview(BASE_CHARACTER, BASE_CHARACTER);

    expect(preview.physicalHitRate).toBe(60);
    expect(preview.magicalHitRate).toBe(60);
    expect(preview.physicalDamage).toBe(18);
    expect(preview.magicalDamage).toBe(18);
  });
});
