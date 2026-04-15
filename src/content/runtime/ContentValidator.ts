import type {
  CharacterDef,
  ContentPack,
  ContentPackManifest,
  DialogueDef,
  DialogueNodeDef,
  MapDef,
  SkillDef,
  ValidationIssue,
} from "../domain/ContentSchema.types.js";

const STAT_KEYS = new Set(["STR", "VIT", "DEX", "AGI", "AVD", "INT", "MND", "RES", "LUK"]);
const GROWTH_TYPES = new Set(["Power", "Technique", "Arcane", "Ward", "Balanced"]);
const EFFECT_TYPES = new Set(["damage", "buff", "debuff", "heal"]);
const ATTACK_TYPES = new Set(["physical", "magical", "auto"]);
const TARGET_SIDES = new Set(["self", "ally", "enemy"]);

/**
 * Content Schema v1 구조 검증기다.
 */
export class ContentValidator {
  /**
   * 매니페스트를 검증한다.
   *
   * @param manifest 검증할 매니페스트
   * @returns 검증 이슈 목록
   */
  public validateManifest(manifest: ContentPackManifest): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    this.validateId(manifest.meta.pack_id, "manifest.meta.pack_id", issues);
    this.validateSemver(manifest.meta.schema_version, "manifest.meta.schema_version", issues);
    this.validateSemver(manifest.meta.tool_version, "manifest.meta.tool_version", issues);

    if (manifest.files.skills.length === 0) {
      issues.push({ path: "manifest.files.skills", message: "skills 경로는 비어 있을 수 없습니다.", severity: "error" });
    }

    if (manifest.files.characters.length === 0) {
      issues.push({ path: "manifest.files.characters", message: "characters 경로는 비어 있을 수 없습니다.", severity: "error" });
    }

    manifest.files.maps.forEach((mapPath, index) => {
      if (mapPath.length === 0) {
        issues.push({ path: `manifest.files.maps[${index}]`, message: "map 경로는 비어 있을 수 없습니다.", severity: "error" });
      }
    });

    manifest.files.dialogues.forEach((dialoguePath, index) => {
      if (dialoguePath.length === 0) {
        issues.push({ path: `manifest.files.dialogues[${index}]`, message: "dialogue 경로는 비어 있을 수 없습니다.", severity: "error" });
      }
    });

    return issues;
  }

  /**
   * 콘텐츠 팩 전체를 구조 검증한다.
   *
   * @param pack 검증할 콘텐츠 팩
   * @returns 검증 이슈 목록
   */
  public validatePack(pack: ContentPack): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    issues.push(...this.validateManifest(pack.manifest));

    pack.skills.forEach((skill, index) => {
      this.validateSkill(skill, `skills[${index}]`, issues);
    });

    pack.characters.forEach((character, index) => {
      this.validateCharacter(character, `characters[${index}]`, issues);
    });

    pack.maps.forEach((map, index) => {
      this.validateMap(map, `maps[${index}]`, issues);
    });

    pack.dialogues.forEach((dialogue, index) => {
      this.validateDialogue(dialogue, `dialogues[${index}]`, issues);
    });

    return issues;
  }

  private validateSkill(skill: SkillDef, basePath: string, issues: ValidationIssue[]): void {
    this.validateId(skill.id, `${basePath}.id`, issues);
    this.validateNonEmptyString(skill.name, `${basePath}.name`, issues);
    this.validateRange(skill.proc_chance, 1, 100, `${basePath}.proc_chance`, issues);

    if (!EFFECT_TYPES.has(skill.effect_type)) {
      issues.push({ path: `${basePath}.effect_type`, message: "지원하지 않는 effect_type 입니다.", severity: "error" });
    }

    if (!ATTACK_TYPES.has(skill.attack_type)) {
      issues.push({ path: `${basePath}.attack_type`, message: "지원하지 않는 attack_type 입니다.", severity: "error" });
    }

    if (!TARGET_SIDES.has(skill.target_side)) {
      issues.push({ path: `${basePath}.target_side`, message: "지원하지 않는 target_side 입니다.", severity: "error" });
    }

    this.validateStatKey(skill.source_stat, `${basePath}.source_stat`, issues);

    if ((skill.effect_type === "buff" || skill.effect_type === "debuff") && skill.affected_stat == null) {
      issues.push({
        path: `${basePath}.affected_stat`,
        message: "buff/debuff 효과는 affected_stat이 필요합니다.",
        severity: "error",
      });
    }

    if (skill.affected_stat != null) {
      this.validateStatKey(skill.affected_stat, `${basePath}.affected_stat`, issues);
    }

    if (!(skill.multiplier > 0)) {
      issues.push({ path: `${basePath}.multiplier`, message: "multiplier는 0보다 커야 합니다.", severity: "error" });
    }

    this.validateMin(skill.hit_count, 1, `${basePath}.hit_count`, issues);
    this.validateMin(skill.duration_turns, 0, `${basePath}.duration_turns`, issues);
    this.validateNonEmptyString(skill.description, `${basePath}.description`, issues);

    skill.composite_hits?.forEach((hit, index) => {
      if (!ATTACK_TYPES.has(hit.attack_type)) {
        issues.push({
          path: `${basePath}.composite_hits[${index}].attack_type`,
          message: "지원하지 않는 attack_type 입니다.",
          severity: "error",
        });
      }

      this.validateStatKey(hit.source_stat, `${basePath}.composite_hits[${index}].source_stat`, issues);

      if (!(hit.multiplier > 0)) {
        issues.push({
          path: `${basePath}.composite_hits[${index}].multiplier`,
          message: "multiplier는 0보다 커야 합니다.",
          severity: "error",
        });
      }

      this.validateMin(hit.hit_count, 1, `${basePath}.composite_hits[${index}].hit_count`, issues);
    });
  }

  private validateCharacter(character: CharacterDef, basePath: string, issues: ValidationIssue[]): void {
    this.validateId(character.id, `${basePath}.id`, issues);
    this.validateNonEmptyString(character.name, `${basePath}.name`, issues);
    this.validateNonEmptyString(character.description, `${basePath}.description`, issues);
    this.validateNonEmptyString(character.image_path, `${basePath}.image_path`, issues);

    this.validateMin(character.tile_x, 0, `${basePath}.tile_x`, issues);
    this.validateMin(character.tile_y, 0, `${basePath}.tile_y`, issues);
    this.validateMin(character.tile_w, 1, `${basePath}.tile_w`, issues);
    this.validateMin(character.tile_h, 1, `${basePath}.tile_h`, issues);
    this.validateMin(character.level, 1, `${basePath}.level`, issues);
    this.validateMin(character.exp, 0, `${basePath}.exp`, issues);
    this.validateMin(character.HP, 1, `${basePath}.HP`, issues);

    ["1", "2", "3", "4"].forEach((slotKey) => {
      const value = character.skill_slots[slotKey as keyof typeof character.skill_slots];

      if (value != null) {
        this.validateId(value, `${basePath}.skill_slots.${slotKey}`, issues);
      }
    });

    const statPairs: Array<[number, string]> = [
      [character.STR, "STR"],
      [character.VIT, "VIT"],
      [character.DEX, "DEX"],
      [character.AGI, "AGI"],
      [character.AVD, "AVD"],
      [character.INT, "INT"],
      [character.MND, "MND"],
      [character.RES, "RES"],
      [character.LUK, "LUK"],
    ];

    statPairs.forEach(([value, key]) => {
      this.validateMin(value, 1, `${basePath}.${key}`, issues);

      if (character.level === 1 && value !== 50) {
        issues.push({
          path: `${basePath}.${key}`,
          message: "레벨 1 기본 스탯 50 규칙과 다릅니다.",
          severity: "warning",
        });
      }
    });

    if (!GROWTH_TYPES.has(character.current_grown_type)) {
      issues.push({
        path: `${basePath}.current_grown_type`,
        message: "지원하지 않는 성장 타입입니다.",
        severity: "error",
      });
    }
  }

  private validateMap(map: MapDef, basePath: string, issues: ValidationIssue[]): void {
    this.validateId(map.id, `${basePath}.id`, issues);
    this.validateNonEmptyString(map.name, `${basePath}.name`, issues);

    this.validateMin(map.grid.width, 1, `${basePath}.grid.width`, issues);
    this.validateMin(map.grid.height, 1, `${basePath}.grid.height`, issues);

    map.blocked_tiles.forEach((coord, index) => {
      this.validateMin(coord.x, 0, `${basePath}.blocked_tiles[${index}].x`, issues);
      this.validateMin(coord.y, 0, `${basePath}.blocked_tiles[${index}].y`, issues);
    });

    map.spawns.forEach((spawn, index) => {
      this.validateId(spawn.unit_id, `${basePath}.spawns[${index}].unit_id`, issues);

      if (spawn.side !== "ally" && spawn.side !== "enemy") {
        issues.push({ path: `${basePath}.spawns[${index}].side`, message: "side는 ally/enemy만 가능합니다.", severity: "error" });
      }

      this.validateMin(spawn.x, 0, `${basePath}.spawns[${index}].x`, issues);
      this.validateMin(spawn.y, 0, `${basePath}.spawns[${index}].y`, issues);
    });

    map.triggers.forEach((trigger, index) => {
      this.validateId(trigger.id, `${basePath}.triggers[${index}].id`, issues);
      this.validateNonEmptyString(trigger.event, `${basePath}.triggers[${index}].event`, issues);
      this.validateNonEmptyString(trigger.action, `${basePath}.triggers[${index}].action`, issues);
    });
  }

  private validateDialogue(dialogue: DialogueDef, basePath: string, issues: ValidationIssue[]): void {
    this.validateId(dialogue.id, `${basePath}.id`, issues);
    this.validateNonEmptyString(dialogue.name, `${basePath}.name`, issues);
    this.validateId(dialogue.start_node_id, `${basePath}.start_node_id`, issues);

    dialogue.nodes.forEach((node, index) => {
      this.validateDialogueNode(node, `${basePath}.nodes[${index}]`, issues);
    });
  }

  private validateDialogueNode(node: DialogueNodeDef, basePath: string, issues: ValidationIssue[]): void {
    this.validateId(node.id, `${basePath}.id`, issues);

    if (node.type === "line") {
      this.validateNonEmptyString(node.text, `${basePath}.text`, issues);
      if (node.next != null) {
        this.validateId(node.next, `${basePath}.next`, issues);
      }
      return;
    }

    if (node.type === "choice") {
      if (node.choices.length === 0) {
        issues.push({ path: `${basePath}.choices`, message: "choice 노드는 최소 1개 선택지가 필요합니다.", severity: "error" });
      }

      node.choices.forEach((choice, index) => {
        this.validateNonEmptyString(choice.text, `${basePath}.choices[${index}].text`, issues);
        this.validateId(choice.next, `${basePath}.choices[${index}].next`, issues);
      });
      return;
    }

    if (node.type === "jump") {
      this.validateId(node.target, `${basePath}.target`, issues);
      return;
    }

    if (node.type === "setFlag") {
      this.validateNonEmptyString(node.flag_key, `${basePath}.flag_key`, issues);
      if (node.next != null) {
        this.validateId(node.next, `${basePath}.next`, issues);
      }
      return;
    }

    if (node.type !== "end") {
      issues.push({ path: `${basePath}.type`, message: "지원하지 않는 dialogue node type 입니다.", severity: "error" });
    }
  }

  private validateId(value: string, path: string, issues: ValidationIssue[]): void {
    if (!/^[a-z0-9][a-z0-9_-]*$/u.test(value)) {
      issues.push({ path, message: "id 규칙은 영문 소문자, 숫자, _, - 조합입니다.", severity: "error" });
    }
  }

  private validateSemver(value: string, path: string, issues: ValidationIssue[]): void {
    if (!/^\d+\.\d+\.\d+$/u.test(value)) {
      issues.push({ path, message: "버전은 semver 형식(x.y.z)이어야 합니다.", severity: "error" });
    }
  }

  private validateNonEmptyString(value: string, path: string, issues: ValidationIssue[]): void {
    if (value.trim().length === 0) {
      issues.push({ path, message: "문자열은 비어 있을 수 없습니다.", severity: "error" });
    }
  }

  private validateMin(value: number, min: number, path: string, issues: ValidationIssue[]): void {
    if (value < min) {
      issues.push({ path, message: `${min} 이상이어야 합니다.`, severity: "error" });
    }
  }

  private validateRange(value: number, min: number, max: number, path: string, issues: ValidationIssue[]): void {
    if (value < min || value > max) {
      issues.push({ path, message: `${min} 이상 ${max} 이하여야 합니다.`, severity: "error" });
    }
  }

  private validateStatKey(value: string, path: string, issues: ValidationIssue[]): void {
    if (!STAT_KEYS.has(value)) {
      issues.push({ path, message: "지원하지 않는 능력치 키입니다.", severity: "error" });
    }
  }
}
