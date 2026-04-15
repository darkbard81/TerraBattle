import type {
  CharacterDef,
  ContentPack,
  SkillDef,
  ValidationIssue,
} from "../../content/domain/ContentSchema.types.js";
import { canonicalizeJson } from "../../content/runtime/canonicalizeJson.js";
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
   * 편집된 스킬/캐릭터를 canonical JSON 문자열로 직렬화한다.
   *
   * @param skills 직렬화할 스킬 목록
   * @param characters 직렬화할 캐릭터 목록
   * @returns 파일 저장에 사용할 문자열 묶음
   */
  public export(skills: readonly SkillDef[], characters: readonly CharacterDef[]): ToolExportResult {
    return {
      skillsJson: canonicalizeJson(skills),
      charactersJson: canonicalizeJson(characters),
    };
  }
}
