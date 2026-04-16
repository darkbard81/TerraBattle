import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";

import type { ContentPack, ValidationIssue } from "../domain/ContentSchema.types.js";
import characterSchema from "../schema/character.schema.json";
import charactersFileSchema from "../schema/characters.file.schema.json";
import commonSchema from "../schema/common.schema.json";
import dialogueSchema from "../schema/dialogue.schema.json";
import mapSchema from "../schema/map.schema.json";
import packSchema from "../schema/pack.schema.json";
import skillSchema from "../schema/skill.schema.json";
import skillsFileSchema from "../schema/skills.file.schema.json";
import characters from "../packs/dev/characters.json";
import dialogues from "../packs/dev/dialogues/dlg_intro.json";
import mapDemo from "../packs/dev/maps/map_demo.json";
import manifest from "../packs/dev/pack.json";
import skills from "../packs/dev/skills.json";
import { ContentIntegrityChecker } from "./ContentIntegrityChecker.js";
import { ContentMigrator } from "./ContentMigrator.js";
import { ContentValidator } from "./ContentValidator.js";

interface ContentSchemaValidators {
  readonly validateManifest: ValidateFunction;
  readonly validateSkills: ValidateFunction;
  readonly validateCharacters: ValidateFunction;
  readonly validateMap: ValidateFunction;
  readonly validateDialogue: ValidateFunction;
}

const CONTENT_SCHEMA_VALIDATORS = createContentSchemaValidators();

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
  private readonly schemaValidators: ContentSchemaValidators;

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
    this.schemaValidators = CONTENT_SCHEMA_VALIDATORS;
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

    const rawLoadedPack: unknown = {
      manifest,
      skills,
      characters,
      maps: [mapDemo],
      dialogues: [dialogues],
    };
    const loadedPack = this.parseContentPack(rawLoadedPack);

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

  private parseContentPack(rawPack: unknown): ContentPack {
    const issues = validateContentPackWithSchema(rawPack, this.schemaValidators);
    if (issues.length > 0) {
      const messages = issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");
      throw new Error(`콘텐츠 JSON Schema 검증에 실패했습니다.\n${messages}`);
    }

    return rawPack as ContentPack;
  }
}

function createContentSchemaValidators(): ContentSchemaValidators {
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addSchema(commonSchema);
  ajv.addSchema(skillSchema);
  ajv.addSchema(characterSchema);

  return {
    validateManifest: ajv.compile(packSchema),
    validateSkills: ajv.compile(skillsFileSchema),
    validateCharacters: ajv.compile(charactersFileSchema),
    validateMap: ajv.compile(mapSchema),
    validateDialogue: ajv.compile(dialogueSchema),
  };
}

function validateContentPackWithSchema(
  rawPack: unknown,
  schemaValidators: ContentSchemaValidators,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof rawPack !== "object" || rawPack === null || Array.isArray(rawPack)) {
    issues.push(createSchemaIssue("pack", "object 타입이어야 합니다."));
    return issues;
  }

  const pack = rawPack as Record<string, unknown>;
  collectSchemaIssues(schemaValidators.validateManifest, pack.manifest, "manifest", issues);
  collectSchemaIssues(schemaValidators.validateSkills, pack.skills, "skills", issues);
  collectSchemaIssues(schemaValidators.validateCharacters, pack.characters, "characters", issues);
  validateSchemaArrayItems(schemaValidators.validateMap, pack.maps, "maps", issues);
  validateSchemaArrayItems(schemaValidators.validateDialogue, pack.dialogues, "dialogues", issues);

  return issues;
}

function validateSchemaArrayItems(
  validate: ValidateFunction,
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push(createSchemaIssue(path, "array 타입이어야 합니다."));
    return;
  }

  value.forEach((item, index) => {
    collectSchemaIssues(validate, item, `${path}[${index}]`, issues);
  });
}

function collectSchemaIssues(
  validate: ValidateFunction,
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (validate(value)) {
    return;
  }

  (validate.errors ?? []).forEach((error) => {
    issues.push(formatSchemaIssue(error, path));
  });
}

function formatSchemaIssue(error: ErrorObject, basePath: string): ValidationIssue {
  const instancePath = error.instancePath.replaceAll("/", ".");
  const path = `${basePath}${instancePath}`;

  return {
    path,
    message: error.message ?? "JSON Schema 검증에 실패했습니다.",
    severity: "error",
  };
}

function createSchemaIssue(path: string, message: string): ValidationIssue {
  return { path, message, severity: "error" };
}
