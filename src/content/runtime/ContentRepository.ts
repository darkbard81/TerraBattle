import type { ContentPack } from "../domain/ContentSchema.types.js";
import characters from "../packs/dev/characters.json";
import dialogues from "../packs/dev/dialogues/dlg_intro.json";
import mapDemo from "../packs/dev/maps/map_demo.json";
import manifest from "../packs/dev/pack.json";
import skills from "../packs/dev/skills.json";
import { ContentIntegrityChecker } from "./ContentIntegrityChecker.js";
import { ContentMigrator } from "./ContentMigrator.js";
import { ContentValidator } from "./ContentValidator.js";

/**
 * 콘텐츠 저장소 인터페이스다.
 */
export interface IContentRepository {
  /**
   * pack id를 기준으로 콘텐츠를 로드한다.
   *
   * @param packId 로드할 pack 식별자
   * @returns 검증 완료된 콘텐츠 팩
   */
  loadPack(packId: string): Promise<ContentPack>;
}

/**
 * 정적 JSON 파일을 읽는 콘텐츠 저장소 구현체다.
 */
export class StaticContentRepository implements IContentRepository {
  private readonly validator: ContentValidator;
  private readonly integrityChecker: ContentIntegrityChecker;
  private readonly migrator: ContentMigrator;

  /**
   * 저장소를 생성한다.
   *
   * @param validator 구조 검증기
   * @param integrityChecker 참조 무결성 검사기
   * @param migrator 버전 마이그레이터
   */
  public constructor(
    validator: ContentValidator,
    integrityChecker: ContentIntegrityChecker,
    migrator: ContentMigrator,
  ) {
    this.validator = validator;
    this.integrityChecker = integrityChecker;
    this.migrator = migrator;
  }

  /**
   * pack id를 기준으로 콘텐츠를 로드하고 검증한다.
   *
   * @param packId 로드할 pack 식별자
   * @returns 검증 완료된 콘텐츠 팩
   * @throws 지원하지 않는 pack이거나 검증에 실패하면 예외를 던진다.
   */
  public async loadPack(packId: string): Promise<ContentPack> {
    if (packId !== "dev") {
      throw new Error(`지원하지 않는 pack id입니다: ${packId}`);
    }

    const loadedPack: ContentPack = {
      manifest,
      skills,
      characters,
      maps: [mapDemo],
      dialogues: [dialogues],
    };

    const migrated = this.migrator.migrate(loadedPack, "1.0.0");

    const validationIssues = this.validator.validatePack(migrated.migratedPack);
    const integrityIssues = this.integrityChecker.check(migrated.migratedPack);
    const allIssues = [...validationIssues, ...integrityIssues];

    const errors = allIssues.filter((issue) => issue.severity === "error");
    if (errors.length > 0) {
      const messages = errors.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
      throw new Error(`콘텐츠 검증에 실패했습니다.\n${messages}`);
    }

    return migrated.migratedPack;
  }
}
