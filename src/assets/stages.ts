import mapDemoData from "./map_demo.json";

/**
 * 맵 셀 배치 정보다.
 */
export interface StageMapCellData {
  readonly x: number;
  readonly y: number;
  readonly type: string;
  readonly id: string;
}

/**
 * 스테이지 맵 데이터다.
 */
export interface StageMapData {
  readonly background: string;
  readonly rows: number;
  readonly cols: number;
  readonly timer: number;
  readonly cells: readonly StageMapCellData[];
}

/**
 * 데모 스테이지 정의다.
 */
export interface DemoStageData {
  readonly id: string;
  readonly name: string;
  readonly map: StageMapData;
}

interface MapDemoDocument {
  readonly map: StageMapData;
}

const firstStageMap = (mapDemoData as MapDemoDocument).map;

/**
 * M2 데모 루프에서 순차 진행할 스테이지 목록이다.
 */
export const DEMO_STAGES: readonly DemoStageData[] = [
  {
    id: "stage_001",
    map: firstStageMap,
    name: "First Contact",
  },
  {
    id: "stage_002",
    map: {
      ...firstStageMap,
      cells: [
        { x: 0, y: 0, type: "ally1", id: "char_hero_001" },
        { x: 1, y: 0, type: "ally2", id: "char_hero_002" },
        { x: 2, y: 0, type: "ally3", id: "char_hero_003" },
        { x: 3, y: 0, type: "ally4", id: "char_hero_004" },
        { x: 4, y: 0, type: "ally5", id: "char_hero_005" },
        { x: 4, y: 4, type: "enemy_rusher", id: "char_monster_002" },
        { x: 2, y: 2, type: "block", id: "char_block_001" },
        { x: 3, y: 2, type: "block", id: "char_block_001" },
      ],
      timer: 6,
    },
    name: "Blocked Path",
  },
  {
    id: "stage_003",
    map: {
      ...firstStageMap,
      cells: [
        { x: 0, y: 0, type: "ally1", id: "char_hero_001" },
        { x: 1, y: 0, type: "ally2", id: "char_hero_002" },
        { x: 2, y: 0, type: "ally3", id: "char_hero_003" },
        { x: 3, y: 0, type: "ally4", id: "char_hero_004" },
        { x: 4, y: 0, type: "ally5", id: "char_hero_005" },
        { x: 5, y: 4, type: "enemy_rusher", id: "char_monster_002" },
        { x: 0, y: 5, type: "enemy_guard", id: "char_monster_003" },
        { x: 1, y: 2, type: "block", id: "char_block_001" },
        { x: 2, y: 2, type: "block", id: "char_block_001" },
        { x: 4, y: 3, type: "block", id: "char_block_001" },
      ],
      timer: 7,
    },
    name: "Final Drill",
  },
];
