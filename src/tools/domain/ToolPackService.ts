import type {
  CharacterDef,
  ContentPack,
  SkillDef,
  ValidationIssue,
} from "../../content/domain/ContentSchema.types.js";
import { ContentIntegrityChecker } from "../../content/runtime/ContentIntegrityChecker.js";
import { ContentValidator } from "../../content/runtime/ContentValidator.js";

/**
 * Tool MVP에서 사용하는 파일별 export 문자열 결과다.
 */
export interface ToolExportResult {
  readonly skillsJson: string;
  readonly charactersJson: string;
}

/**
 * Tool MVP용 편집 데이터 조립과 검증을 담당한다.
 */
export class ToolPackService {
  private readonly validator: ContentValidator;
  private readonly integrityChecker: ContentIntegrityChecker;

  /**
   * Tool 서비스를 생성한다.
   */
  public constructor() {
    this.validator = new ContentValidator();
    this.integrityChecker = new ContentIntegrityChecker();
  }

  /**
   * 기존 pack을 기준으로 스킬/캐릭터 편집 결과를 반영한 새 pack을 만든다.
   *
   * @param basePack 기준 pack
   * @param skills 편집된 스킬 목록
   * @param characters 편집된 캐릭터 목록
   * @returns 편집 데이터가 반영된 콘텐츠 팩
   */
  public buildPack(basePack: ContentPack, skills: readonly SkillDef[], characters: readonly CharacterDef[]): ContentPack {
    return {
      ...basePack,
      skills: [...skills],
      characters: [...characters],
    };
  }

  /**
   * 편집된 팩을 구조/무결성 기준으로 검증한다.
   *
   * @param pack 검증할 팩
   * @returns 검증 이슈 목록
   */
  public validatePack(pack: ContentPack): ValidationIssue[] {
    return [...this.validator.validatePack(pack), ...this.integrityChecker.check(pack)];
  }

  /**
   * 편집된 스킬/캐릭터를 파일 저장용 JSON 문자열로 직렬화한다.
   *
   * @param skills 직렬화할 스킬 목록
   * @param characters 직렬화할 캐릭터 목록
   * @returns 파일 저장에 사용할 문자열 묶음
   */
  public export(skills: readonly SkillDef[], characters: readonly CharacterDef[]): ToolExportResult {
    return {
      skillsJson: JSON.stringify(skills.map((skill) => orderSkillForExport(skill)), null, 2),
      charactersJson: JSON.stringify(
        characters.map((character) => orderCharacterForExport(character)),
        null,
        2,
      ),
    };
  }
}

function orderSkillForExport(skill: SkillDef): SkillDef {
  return {
    id: skill.id,
    name: skill.name,
    replaceable: skill.replaceable,
    proc_chance: skill.proc_chance,
    effect_type: skill.effect_type,
    attack_type: skill.attack_type,
    target_side: skill.target_side,
    source_stat: skill.source_stat,
    affected_stat: skill.affected_stat,
    multiplier: skill.multiplier,
    hit_count: skill.hit_count,
    duration_turns: skill.duration_turns,
    description: skill.description,
  };
}

function orderCharacterForExport(character: CharacterDef): CharacterDef {
  return {
    id: character.id,
    name: character.name,
    description: character.description,
    image_path: character.image_path,
    tile_x: character.tile_x,
    tile_y: character.tile_y,
    tile_w: character.tile_w,
    tile_h: character.tile_h,
    level: character.level,
    exp: character.exp,
    skill_slots: character.skill_slots,
    STR: character.STR,
    VIT: character.VIT,
    DEX: character.DEX,
    AGI: character.AGI,
    AVD: character.AVD,
    INT: character.INT,
    MND: character.MND,
    RES: character.RES,
    LUK: character.LUK,
    current_grown_type: character.current_grown_type,
    HP: character.HP,
  };
}
