import { describe, expect, it } from "vitest";
import {
  ResolveEnemyTurnUseCase,
  type EnemyTurnCharacterData,
  type EnemyTurnEntity,
} from "./ResolveEnemyTurnUseCase.js";

const characters: readonly EnemyTurnCharacterData[] = [
  {
    id: "ally",
    type: "ally",
  },
  {
    id: "enemy",
    type: "enemy",
  },
  {
    id: "block",
    type: "block",
  },
];

function createEntity(input: {
  readonly characterId: string;
  readonly instanceId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}): EnemyTurnEntity {
  return input;
}

describe("ResolveEnemyTurnUseCase", () => {
  it("가장 가까운 아군을 향해 적을 한 칸 이동시킨다", () => {
    const useCase = new ResolveEnemyTurnUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        createEntity({
          characterId: "ally",
          instanceId: "ally:0",
          type: "ally",
          x: 1,
          y: 0,
        }),
        createEntity({
          characterId: "enemy",
          instanceId: "enemy:0",
          type: "enemy",
          x: 4,
          y: 0,
        }),
      ],
      map: {
        cols: 6,
        rows: 8,
      },
    });

    expect(result.entities.find((entity) => entity.instanceId === "enemy:0")).toMatchObject({
      x: 3,
      y: 0,
    });
    expect(result.directHitEvents).toHaveLength(0);
  });

  it("이동 후 아군과 인접하면 기본 공격 이벤트를 만든다", () => {
    const useCase = new ResolveEnemyTurnUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        createEntity({
          characterId: "ally",
          instanceId: "ally:0",
          type: "ally",
          x: 1,
          y: 0,
        }),
        createEntity({
          characterId: "enemy",
          instanceId: "enemy:0",
          type: "enemy",
          x: 3,
          y: 0,
        }),
      ],
      map: {
        cols: 6,
        rows: 8,
      },
    });

    expect(result.entities.find((entity) => entity.instanceId === "enemy:0")).toMatchObject({
      x: 2,
      y: 0,
    });
    expect(result.directHitEvents).toHaveLength(1);
    expect(result.directHitEvents[0]).toMatchObject({
      attackerInstanceId: "enemy:0",
      damage: 12,
      result: "hit",
      targetInstanceId: "ally:0",
    });
  });

  it("막힌 주축 대신 보조축 이동 후보를 사용한다", () => {
    const useCase = new ResolveEnemyTurnUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        createEntity({
          characterId: "ally",
          instanceId: "ally:0",
          type: "ally",
          x: 1,
          y: 1,
        }),
        createEntity({
          characterId: "block",
          instanceId: "block:0",
          type: "block",
          x: 3,
          y: 0,
        }),
        createEntity({
          characterId: "enemy",
          instanceId: "enemy:0",
          type: "enemy",
          x: 4,
          y: 0,
        }),
      ],
      map: {
        cols: 6,
        rows: 8,
      },
    });

    expect(result.entities.find((entity) => entity.instanceId === "enemy:0")).toMatchObject({
      x: 4,
      y: 1,
    });
  });

  it("돌진형 적은 주축으로 두 칸 이동한다", () => {
    const useCase = new ResolveEnemyTurnUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        createEntity({
          characterId: "ally",
          instanceId: "ally:0",
          type: "ally",
          x: 1,
          y: 0,
        }),
        createEntity({
          characterId: "enemy",
          instanceId: "enemy:0",
          type: "enemy_rusher",
          x: 5,
          y: 0,
        }),
      ],
      map: {
        cols: 6,
        rows: 8,
      },
    });

    expect(result.entities.find((entity) => entity.instanceId === "enemy:0")).toMatchObject({
      x: 3,
      y: 0,
    });
  });

  it("방어형 적은 인접하지 않으면 이동하지 않는다", () => {
    const useCase = new ResolveEnemyTurnUseCase();

    const result = useCase.execute({
      characters,
      entities: [
        createEntity({
          characterId: "ally",
          instanceId: "ally:0",
          type: "ally",
          x: 1,
          y: 0,
        }),
        createEntity({
          characterId: "enemy",
          instanceId: "enemy:0",
          type: "enemy_guard",
          x: 5,
          y: 0,
        }),
      ],
      map: {
        cols: 6,
        rows: 8,
      },
    });

    expect(result.entities.find((entity) => entity.instanceId === "enemy:0")).toMatchObject({
      x: 5,
      y: 0,
    });
    expect(result.directHitEvents).toHaveLength(0);
  });
});
