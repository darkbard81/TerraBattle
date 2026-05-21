import { describe, expect, it } from "vitest";
import {
  advanceDemoProgressAfterVictory,
  createInitialDemoProgress,
  parseDemoProgress,
  retryDemoStage,
  serializeDemoProgress,
} from "./DemoProgress.js";

describe("DemoProgress", () => {
  it("초기 진행은 첫 스테이지를 가리킨다", () => {
    expect(createInitialDemoProgress()).toEqual({
      clearedStageCount: 0,
      currentStageIndex: 0,
      highestUnlockedStageIndex: 0,
      partyLevel: 1,
    });
  });

  it("승리하면 다음 스테이지를 열고 현재 스테이지를 이동한다", () => {
    expect(
      advanceDemoProgressAfterVictory({
        clearedStageIndex: 0,
        progress: createInitialDemoProgress(),
        stageCount: 3,
      }),
    ).toEqual({
      clearedStageCount: 1,
      currentStageIndex: 1,
      highestUnlockedStageIndex: 1,
      partyLevel: 2,
    });
  });

  it("마지막 스테이지 승리는 마지막 스테이지에 머문다", () => {
    expect(
      advanceDemoProgressAfterVictory({
        clearedStageIndex: 2,
        progress: {
          clearedStageCount: 2,
          currentStageIndex: 2,
          highestUnlockedStageIndex: 2,
          partyLevel: 3,
        },
        stageCount: 3,
      }),
    ).toEqual({
      clearedStageCount: 3,
      currentStageIndex: 2,
      highestUnlockedStageIndex: 2,
      partyLevel: 4,
    });
  });

  it("재도전은 잠금 해제 상태를 보존하고 현재 스테이지를 유지한다", () => {
    expect(
      retryDemoStage({
        progress: {
          clearedStageCount: 2,
          currentStageIndex: 1,
          highestUnlockedStageIndex: 2,
          partyLevel: 3,
        },
        stageCount: 3,
        stageIndex: 1,
      }),
    ).toEqual({
      clearedStageCount: 2,
      currentStageIndex: 1,
      highestUnlockedStageIndex: 2,
      partyLevel: 3,
    });
  });

  it("저장 문자열을 파싱하고 잘못된 값은 초기값으로 복구한다", () => {
    const progress = {
      clearedStageCount: 2,
      currentStageIndex: 1,
      highestUnlockedStageIndex: 2,
      partyLevel: 3,
    };

    expect(parseDemoProgress(serializeDemoProgress(progress), 3)).toEqual(progress);
    expect(parseDemoProgress("{bad json", 3)).toEqual(createInitialDemoProgress());
  });
});
