const MIN_STAGE_INDEX = 0;

/**
 * 데모 진행 저장 데이터다.
 */
export interface DemoProgressState {
  readonly clearedStageCount: number;
  readonly currentStageIndex: number;
  readonly highestUnlockedStageIndex: number;
  readonly partyLevel: number;
}

/**
 * 데모 진행 상태를 새로 만든다.
 *
 * @returns 첫 스테이지부터 시작하는 진행 상태
 */
export function createInitialDemoProgress(): DemoProgressState {
  return {
    clearedStageCount: 0,
    currentStageIndex: MIN_STAGE_INDEX,
    highestUnlockedStageIndex: MIN_STAGE_INDEX,
    partyLevel: 1,
  };
}

/**
 * 저장된 진행 상태를 사용 가능한 스테이지 범위 안으로 보정한다.
 *
 * @param progress 보정할 진행 상태
 * @param stageCount 전체 스테이지 수
 * @returns 범위 안으로 보정된 진행 상태
 */
export function normalizeDemoProgress(
  progress: DemoProgressState,
  stageCount: number,
): DemoProgressState {
  const maxStageIndex = Math.max(MIN_STAGE_INDEX, stageCount - 1);
  const highestUnlockedStageIndex = clampStageIndex(
    progress.highestUnlockedStageIndex,
    maxStageIndex,
  );

  return {
    clearedStageCount: Math.max(0, Math.trunc(progress.clearedStageCount)),
    currentStageIndex: Math.min(
      clampStageIndex(progress.currentStageIndex, maxStageIndex),
      highestUnlockedStageIndex,
    ),
    highestUnlockedStageIndex,
    partyLevel: Math.max(1, Math.trunc(progress.partyLevel)),
  };
}

/**
 * 스테이지 승리 후 다음 진행 상태를 계산한다.
 *
 * @param progress 현재 진행 상태
 * @param clearedStageIndex 클리어한 스테이지 index
 * @param stageCount 전체 스테이지 수
 * @returns 다음 스테이지가 열리고 현재 스테이지가 이동된 진행 상태
 */
export function advanceDemoProgressAfterVictory(input: {
  readonly clearedStageIndex: number;
  readonly progress: DemoProgressState;
  readonly stageCount: number;
}): DemoProgressState {
  const maxStageIndex = Math.max(MIN_STAGE_INDEX, input.stageCount - 1);
  const nextStageIndex = clampStageIndex(
    input.clearedStageIndex + 1,
    maxStageIndex,
  );
  const highestUnlockedStageIndex = Math.max(
    input.progress.highestUnlockedStageIndex,
    nextStageIndex,
  );

  return normalizeDemoProgress(
    {
      clearedStageCount: input.progress.clearedStageCount + 1,
      currentStageIndex: nextStageIndex,
      highestUnlockedStageIndex,
      partyLevel: input.progress.partyLevel + 1,
    },
    input.stageCount,
  );
}

/**
 * 같은 스테이지 재도전 진행 상태를 계산한다.
 *
 * @param progress 현재 진행 상태
 * @param stageIndex 재도전할 스테이지 index
 * @param stageCount 전체 스테이지 수
 * @returns 현재 스테이지를 재도전 대상으로 둔 진행 상태
 */
export function retryDemoStage(input: {
  readonly progress: DemoProgressState;
  readonly stageCount: number;
  readonly stageIndex: number;
}): DemoProgressState {
  return normalizeDemoProgress(
    {
      ...input.progress,
      currentStageIndex: input.stageIndex,
    },
    input.stageCount,
  );
}

/**
 * JSON 문자열을 데모 진행 상태로 해석한다.
 *
 * @param serializedProgress LocalStorage에 저장된 문자열
 * @param stageCount 전체 스테이지 수
 * @returns 해석된 진행 상태, 실패 시 초기 진행 상태
 */
export function parseDemoProgress(
  serializedProgress: string | null,
  stageCount: number,
): DemoProgressState {
  if (serializedProgress === null) {
    return createInitialDemoProgress();
  }

  try {
    const value = JSON.parse(serializedProgress) as Partial<DemoProgressState>;

    if (
      typeof value.currentStageIndex !== "number" ||
      typeof value.highestUnlockedStageIndex !== "number"
    ) {
      return createInitialDemoProgress();
    }

    return normalizeDemoProgress(
      {
        clearedStageCount:
          typeof value.clearedStageCount === "number"
            ? value.clearedStageCount
            : 0,
        currentStageIndex: value.currentStageIndex,
        highestUnlockedStageIndex: value.highestUnlockedStageIndex,
        partyLevel:
          typeof value.partyLevel === "number" ? value.partyLevel : 1,
      },
      stageCount,
    );
  } catch {
    return createInitialDemoProgress();
  }
}

/**
 * 데모 진행 상태를 JSON 문자열로 변환한다.
 *
 * @param progress 저장할 진행 상태
 * @returns LocalStorage에 저장할 JSON 문자열
 */
export function serializeDemoProgress(progress: DemoProgressState): string {
  return JSON.stringify(progress);
}

function clampStageIndex(stageIndex: number, maxStageIndex: number): number {
  return Math.min(Math.max(Math.trunc(stageIndex), MIN_STAGE_INDEX), maxStageIndex);
}
