import type { ContentPack } from "../domain/ContentSchema.types.js";

/**
 * 콘텐츠 스키마 버전 마이그레이션 결과다.
 */
export interface ContentMigrationResult {
  readonly migratedPack: ContentPack;
  readonly appliedMigrations: readonly string[];
}

/**
 * 콘텐츠 팩 마이그레이션 함수 타입이다.
 */
export type ContentMigration = (pack: ContentPack) => ContentPack;

interface ContentMigrationStep {
  readonly from: string;
  readonly to: string;
  readonly migrate: ContentMigration;
}

/**
 * 콘텐츠 스키마 버전 마이그레이터다.
 */
export class ContentMigrator {
  private readonly steps: readonly ContentMigrationStep[];

  /**
   * 마이그레이터를 생성한다.
   *
   * @param steps 지원할 마이그레이션 단계 목록
   */
  public constructor(steps: readonly ContentMigrationStep[] = []) {
    this.steps = steps;
  }

  /**
   * 콘텐츠 팩을 목표 스키마 버전으로 변환한다.
   *
   * @param pack 변환할 콘텐츠 팩
   * @param targetVersion 목표 스키마 버전
   * @returns 변환 결과
   * @throws 변환 경로가 없으면 예외를 던진다.
   */
  public migrate(pack: ContentPack, targetVersion: string): ContentMigrationResult {
    let currentPack = pack;
    let currentVersion = pack.manifest.meta.schema_version;
    const appliedMigrations: string[] = [];

    if (currentVersion === targetVersion) {
      return {
        migratedPack: pack,
        appliedMigrations,
      };
    }

    while (currentVersion !== targetVersion) {
      const step = this.steps.find((item) => item.from === currentVersion);
      if (step == null) {
        throw new Error(`콘텐츠 마이그레이션 경로를 찾지 못했습니다: ${currentVersion} -> ${targetVersion}`);
      }

      currentPack = step.migrate(currentPack);
      currentVersion = step.to;
      appliedMigrations.push(`${step.from}->${step.to}`);
    }

    return {
      migratedPack: currentPack,
      appliedMigrations,
    };
  }
}
