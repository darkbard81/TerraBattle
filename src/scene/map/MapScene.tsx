import { Application, extend } from "@pixi/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Assets,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import charactersData from "../../assets/characters.json";
import mapDemoData from "../../assets/map_demo.json";
import skillsData from "../../assets/skills.json";
import { resolveAssetUrl } from "../../assets/assetUrls.js";
import {
  ResolveTurnEndUseCase,
  type BattleCharacterData,
  type BattleSkillData,
  type TurnEndBoardUnit,
} from "../../game/application/ResolveTurnEndUseCase.js";
import {
  VIRTUAL_STAGE_HEIGHT,
  VIRTUAL_STAGE_WIDTH,
  VirtualStage,
} from "../../shared/display/VirtualStage.js";
import {
  BattleAnimationQueue,
  emptyBattleAnimationQueueState,
  type BattleAnimationStagePosition,
  type BattleAnimationDurations,
  type QueueDamageTextAnimationInput,
  type QueueSandwichAttackAnimationInput,
  type QueueSkillNameAnimationInput,
  type SandwichCharacterAnimation,
} from "./BattleAnimationQueue.js";

extend({
  Container,
  Graphics,
  Sprite,
});

const MAP_TILE_SIZE = 184;
const COLLISION_INSET = 32;
const MAP_GRID_GAP = 0;
const DRAG_SYNC_EASING = 0.28;
const DRAG_SYNC_MAX_STEP = 36;
const DRAG_SYNC_EPSILON = 0.5;
const SWAP_ANIMATION_DURATION_MS = 120;
const TILE_RENDER_RATIO = 1;
const TILE_BASE_Z_INDEX = 1;
const DRAGGED_TILE_Z_INDEX = 10_000;
const DAMAGE_TEXT_DURATION_CSS_VARIABLE = "--map-scene-damage-text-duration";
const DAMAGE_TEXT_STAGGER_CSS_VARIABLE = "--map-scene-damage-text-stagger";
const SANDWICH_ATTACK_DURATION_CSS_VARIABLE =
  "--map-scene-sandwich-attack-duration";
const SANDWICH_ATTACK_STAGGER_CSS_VARIABLE =
  "--map-scene-sandwich-attack-stagger";
const SKILL_NAME_DURATION_CSS_VARIABLE = "--map-scene-skill-name-duration";
const SKILL_NAME_STAGGER_CSS_VARIABLE = "--map-scene-skill-name-stagger";

/**
 * 맵 셀 배치 정보다.
 */
interface MapCellData {
  readonly x: number;
  readonly y: number;
  readonly type: string;
  readonly id: string;
}

/**
 * 맵 JSON 내부의 맵 정의다.
 */
interface MapData {
  readonly background: string;
  readonly rows: number;
  readonly cols: number;
  readonly timer: number;
  readonly cells: readonly MapCellData[];
}

/**
 * 맵 JSON 문서 구조다.
 */
interface MapDemoDocument {
  readonly map: MapData;
}

/**
 * 캐릭터와 오브젝트 타일 정의다.
 */
interface CharacterTileData extends BattleCharacterData {
  readonly description: string;
  readonly image_path: string;
  readonly tile_x: number;
  readonly tile_y: number;
  readonly tile_w: number;
  readonly tile_h: number;
  readonly level: number;
  readonly exp: number;
  readonly current_grown_type: string;
  readonly HP: number;
}

/**
 * 맵 씬 입력값이다.
 */
export interface MapSceneProps {
  readonly onBack: () => void;
}

/**
 * 맵 위에 출현한 개별 엔티티 상태다.
 */
interface MapEntity {
  readonly instanceId: string;
  readonly characterId: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
}

const mapDemo = mapDemoData as MapDemoDocument;
const characterTiles = charactersData as readonly CharacterTileData[];
const battleSkills = skillsData as readonly BattleSkillData[];

/**
 * 지정한 id와 일치하는 타일 정의를 찾는다.
 *
 * @param characterId 찾을 캐릭터 또는 오브젝트 id
 * @returns 일치하는 타일 정의 또는 undefined
 */
function findCharacterTile(
  characterId: string,
): CharacterTileData | undefined {
  return characterTiles.find((characterTile) => characterTile.id === characterId);
}

/**
 * 샌드위치 공격 연출에 사용할 캐릭터 이미지 정보를 만든다.
 *
 * @param characterId 캐릭터 id
 * @param side 화면에서 출현할 좌우 방향
 * @returns 연출 이미지 정보 또는 undefined
 */
function createSandwichCharacterAnimation(
  characterId: string,
  side: "left" | "right",
): SandwichCharacterAnimation | undefined {
  const characterTile = findCharacterTile(characterId);

  if (characterTile === undefined) {
    return undefined;
  }

  return {
    imageUrl: resolveAssetUrl(characterTile.image_path),
    scale: 1,
    side,
  };
}

/**
 * 맵 셀의 좌표와 타일 정의를 함께 보관한다.
 */
interface RenderableMapTile {
  readonly entity: MapEntity;
  readonly characterTile: CharacterTileData;
  readonly imageUrl: string;
}

/**
 * Pixi 맵 레이어 입력값이다.
 */
interface PixiMapLayerProps {
  readonly entities: readonly MapEntity[];
  readonly map: MapData;
  readonly dragTimeLimitSeconds: number;
  readonly isInputLocked: boolean;
  readonly onDragTimerChange: (remainingSeconds: number) => void;
  readonly onTurnEnd: (inputs: readonly MoveMapEntityInput[]) => void;
}

/**
 * Pixi 타일 스프라이트 입력값이다.
 */
interface PixiMapTileProps {
  readonly tile: RenderableMapTile;
  readonly baseTexture: Texture | undefined;
  readonly gridOrigin: { readonly x: number; readonly y: number };
  readonly isDraggable: boolean;
  readonly zIndex: number;
  readonly onDragStart: (input: StartDragInput) => void;
  readonly onSpriteMount: (input: SpriteMountInput) => void;
  readonly onSpriteUnmount: (instanceId: string) => void;
}

/**
 * 엔티티 이동 입력값이다.
 */
interface MoveMapEntityInput {
  readonly instanceId: string;
  readonly x: number;
  readonly y: number;
}

/**
 * 드래그 시작 입력값이다.
 */
interface StartDragInput {
  readonly event: FederatedPointerEvent;
  readonly instanceId: string;
  readonly sprite: Sprite;
}

/**
 * Pixi 스프라이트 등록 입력값이다.
 */
interface SpriteMountInput {
  readonly instanceId: string;
  readonly sprite: Sprite;
}

/**
 * 현재 드래그 중인 엔티티 상태다.
 */
interface ActiveDragState {
  readonly grabOffsetX: number;
  readonly grabOffsetY: number;
  readonly instanceId: string;
  readonly previousZIndex: number;
  readonly sprite: Sprite;
  readonly startedAt: number;
  readonly targetX: number;
  readonly targetY: number;
}

/**
 * grid 좌표다.
 */
interface GridPosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Pixi 표시 좌표다.
 */
interface StagePosition {
  readonly x: number;
  readonly y: number;
}

/**
 * Pixi 스테이지 사각형 영역이다.
 */
interface StageRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * 대상 타일 충돌 영역에 진입한 8방향이다.
 */
type CollisionDirection =
  | "north"
  | "northEast"
  | "east"
  | "southEast"
  | "south"
  | "southWest"
  | "west"
  | "northWest";

/**
 * 충돌 영역 진입 방향 계산 입력값이다.
 */
interface ResolveCollisionDirectionInput {
  readonly draggedBounds: StageRect;
  readonly intersectionBounds: StageRect;
  readonly targetBounds: StageRect;
}

/**
 * 충돌 영역 진입 방향 계산 결과다.
 */
interface CollisionDirectionResolution {
  readonly direction: CollisionDirection;
  readonly gridOffset: GridPosition;
}

/**
 * 이동을 막는 타일의 충돌 영역이다.
 */
interface BlockingTileBounds {
  readonly instanceId: string;
  readonly bounds: StageRect;
}

/**
 * 아군 타일과 드래그 타일의 충돌 정보다.
 */
interface AllyTileCollision {
  readonly bounds: StageRect;
  readonly gridPosition: GridPosition;
  readonly intersectionArea: number;
  readonly intersectionBounds: StageRect;
  readonly tile: RenderableMapTile;
}

/**
 * swap으로 이동 중인 타일 애니메이션 상태다.
 */
interface SwapAnimationState {
  readonly from: StagePosition;
  readonly instanceId: string;
  readonly sprite: Sprite;
  readonly startedAt: number;
  readonly to: StagePosition;
}

/**
 * 맵 데이터를 Pixi로 그릴 타일 목록으로 변환한다.
 *
 * @param map 변환할 맵 데이터
 * @returns 렌더링 가능한 타일 목록
 */
function createRenderableTiles(
  entities: readonly MapEntity[],
): readonly RenderableMapTile[] {
  return entities.flatMap((entity) => {
    const characterTile = findCharacterTile(entity.characterId);

    if (characterTile === undefined) {
      return [];
    }

    return [
      {
        entity,
        characterTile,
        imageUrl: resolveAssetUrl(characterTile.image_path),
      },
    ];
  });
}

/**
 * 초기 맵 cell 목록에 개별 instanceId를 부여한다.
 *
 * @param map 초기 맵 데이터
 * @returns 맵 위에 출현한 엔티티 목록
 */
function createInitialMapEntities(map: MapData): readonly MapEntity[] {
  return map.cells.flatMap((cell, index) => {
    if (cell.id === "") {
      return [];
    }

    return [
      {
        characterId: cell.id,
        instanceId: `${cell.type}:${cell.id}:${index}`,
        type: cell.type,
        x: cell.x,
        y: cell.y,
      },
    ];
  });
}

/**
 * 맵 격자의 좌상단 좌표를 계산한다.
 *
 * @param map 좌표를 계산할 맵 데이터
 * @returns 가상 스테이지 안에서의 격자 시작 좌표
 */
function calculateGridOrigin(map: MapData): { readonly x: number; readonly y: number } {
  const gridWidth = map.cols * MAP_TILE_SIZE + (map.cols - 1) * MAP_GRID_GAP;
  const gridHeight = map.rows * MAP_TILE_SIZE + (map.rows - 1) * MAP_GRID_GAP;

  return {
    x: (VIRTUAL_STAGE_WIDTH - gridWidth) / 2,
    y: (VIRTUAL_STAGE_HEIGHT - gridHeight) / 1.2,
  };
}

/**
 * grid 좌표를 Pixi 스테이지 좌표로 변환한다.
 *
 * @param gridPosition 변환할 grid 좌표
 * @param gridOrigin 격자 시작 좌표
 * @returns 타일 중심의 Pixi 스테이지 좌표
 */
function calculateTileCenter(
  gridPosition: GridPosition,
  gridOrigin: StagePosition,
): StagePosition {
  return {
    x: gridOrigin.x + gridPosition.x * (MAP_TILE_SIZE + MAP_GRID_GAP) + MAP_TILE_SIZE / 2,
    y: gridOrigin.y + gridPosition.y * (MAP_TILE_SIZE + MAP_GRID_GAP) + MAP_TILE_SIZE / 2,
  };
}

/**
 * Pixi 스테이지 좌표를 가장 가까운 grid 좌표로 맞춘다.
 *
 * @param stagePosition Pixi 스테이지 좌표
 * @param map grid 범위를 제공하는 맵 데이터
 * @param gridOrigin 격자 시작 좌표
 * @returns 맵 범위 안으로 제한된 grid 좌표
 */
function snapStagePositionToGrid(
  stagePosition: StagePosition,
  map: MapData,
  gridOrigin: StagePosition,
): GridPosition {
  const cellStride = MAP_TILE_SIZE + MAP_GRID_GAP;
  const x = Math.round((stagePosition.x - gridOrigin.x - MAP_TILE_SIZE / 2) / cellStride);
  const y = Math.round((stagePosition.y - gridOrigin.y - MAP_TILE_SIZE / 2) / cellStride);

  return {
    x: Math.min(Math.max(x, 0), map.cols - 1),
    y: Math.min(Math.max(y, 0), map.rows - 1),
  };
}

/**
 * 타일 중심 좌표를 기준으로 128x128 충돌 영역을 계산한다.
 *
 * @param center 타일 중심 좌표
 * @returns 타일 경계 사각형
 */
function calculateTileBounds(center: StagePosition, inset: number): StageRect {
  const halfTileSize = MAP_TILE_SIZE / 2;

  return {
    bottom: center.y + halfTileSize - inset,
    left: center.x - halfTileSize + inset,
    right: center.x + halfTileSize - inset,
    top: center.y - halfTileSize + inset,
  };
}

/**
 * 두 사각형이 겹친 영역을 계산한다.
 *
 * @param first 첫 번째 사각형
 * @param second 두 번째 사각형
 * @returns 겹친 영역 또는 겹치지 않으면 undefined
 */
function calculateRectIntersection(
  first: StageRect,
  second: StageRect,
): StageRect | undefined {
  const intersection = {
    bottom: Math.min(first.bottom, second.bottom),
    left: Math.max(first.left, second.left),
    right: Math.min(first.right, second.right),
    top: Math.max(first.top, second.top),
  };

  return intersection.left < intersection.right && intersection.top < intersection.bottom
    ? intersection
    : undefined;
}

/**
 * 사각형 면적을 계산한다.
 *
 * @param rect 면적을 계산할 사각형
 * @returns 사각형 면적
 */
function calculateRectArea(rect: StageRect): number {
  return (rect.right - rect.left) * (rect.bottom - rect.top);
}

/**
 * 충돌 방향 offset에 대응하는 방향 이름을 계산한다.
 *
 * @param gridOffset 충돌 영역 기준의 grid 방향 offset
 * @returns 8방향 이름
 */
function resolveCollisionDirectionName(gridOffset: GridPosition): CollisionDirection {
  if (gridOffset.y < 0) {
    if (gridOffset.x < 0) {
      return "northWest";
    }

    return gridOffset.x > 0 ? "northEast" : "north";
  }

  if (gridOffset.y > 0) {
    if (gridOffset.x < 0) {
      return "southWest";
    }

    return gridOffset.x > 0 ? "southEast" : "south";
  }

  return gridOffset.x < 0 ? "west" : "east";
}

/**
 * 대상 타일과 드래그 타일의 충돌 경계를 기준으로 진입한 8방향을 계산한다.
 *
 * @param input 대상 경계, 드래그 경계, 두 경계의 교차 영역
 * @returns 진입 방향과 그 방향의 grid offset
 */
function resolveCollisionDirection(
  input: ResolveCollisionDirectionInput,
): CollisionDirectionResolution {
  const width = input.targetBounds.right - input.targetBounds.left;
  const height = input.targetBounds.bottom - input.targetBounds.top;
  const leftBandEnd = input.targetBounds.left + width / 3;
  const rightBandStart = input.targetBounds.right - width / 3;
  const topBandEnd = input.targetBounds.top + height / 3;
  const bottomBandStart = input.targetBounds.bottom - height / 3;
  const collisionCenterX =
    (input.intersectionBounds.left + input.intersectionBounds.right) / 2;
  const collisionCenterY =
    (input.intersectionBounds.top + input.intersectionBounds.bottom) / 2;
  let offsetX = 0;
  let offsetY = 0;

  if (collisionCenterX < leftBandEnd) {
    offsetX = -1;
  } else if (collisionCenterX > rightBandStart) {
    offsetX = 1;
  }

  if (collisionCenterY < topBandEnd) {
    offsetY = -1;
  } else if (collisionCenterY > bottomBandStart) {
    offsetY = 1;
  }

  if (offsetX === 0 && offsetY === 0) {
    const draggedCenterX = (input.draggedBounds.left + input.draggedBounds.right) / 2;
    const draggedCenterY = (input.draggedBounds.top + input.draggedBounds.bottom) / 2;
    const targetCenterX = (input.targetBounds.left + input.targetBounds.right) / 2;
    const targetCenterY = (input.targetBounds.top + input.targetBounds.bottom) / 2;
    const deltaX = draggedCenterX - targetCenterX;
    const deltaY = draggedCenterY - targetCenterY;

    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      offsetX = deltaX >= 0 ? 1 : -1;
    } else {
      offsetY = deltaY >= 0 ? 1 : -1;
    }
  }

  const gridOffset = {
    x: offsetX,
    y: offsetY,
  };

  return {
    direction: resolveCollisionDirectionName(gridOffset),
    gridOffset,
  };
}

/**
 * 두 사각형이 겹치는지 확인한다.
 *
 * @param first 첫 번째 사각형
 * @param second 두 번째 사각형
 * @returns 두 사각형이 면적으로 겹치는지 여부
 */
function intersectsRect(first: StageRect, second: StageRect): boolean {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

/**
 * 타일 경계가 grid 외곽 안에 들어오는지 확인한다.
 *
 * @param bounds 확인할 타일 경계
 * @param map grid 범위를 제공하는 맵 데이터
 * @param gridOrigin 격자 시작 좌표
 * @returns grid 외곽 안에 있는지 여부
 */
function isInsideGridBounds(
  bounds: StageRect,
  map: MapData,
  gridOrigin: StagePosition,
): boolean {
  const gridRight = gridOrigin.x + map.cols * MAP_TILE_SIZE;
  const gridBottom = gridOrigin.y + map.rows * MAP_TILE_SIZE;

  return (
    bounds.left >= gridOrigin.x &&
    bounds.right <= gridRight &&
    bounds.top >= gridOrigin.y &&
    bounds.bottom <= gridBottom
  );
}

/**
 * 지정한 엔티티가 드래그 가능한 아군인지 확인한다.
 *
 * @param tile 확인할 타일 정보
 * @returns 드래그 가능한 아군 여부
 */
function isAllyTile(tile: RenderableMapTile): boolean {
  return tile.entity.type === "ally" || tile.characterTile.type === "ally";
}

/**
 * 지정한 타일이 이동을 막는 장애물인지 확인한다.
 *
 * @param tile 확인할 타일 정보
 * @returns enemy 또는 block 여부
 */
function isBlockingTile(tile: RenderableMapTile): boolean {
  return (
    tile.entity.type === "enemy" ||
    tile.entity.type === "block" ||
    tile.characterTile.type === "enemy" ||
    tile.characterTile.type === "block"
  );
}

/**
 * 드래그 타일 중심이 grid와 장애물 기준으로 허용되는지 확인한다.
 *
 * @param center 확인할 타일 중심
 * @param activeInstanceId 드래그 중인 엔티티 id
 * @param renderableTiles 현재 맵에 렌더링 중인 타일 목록
 * @param map grid 범위를 제공하는 맵 데이터
 * @param gridOrigin 격자 시작 좌표
 * @returns 이동 가능한 위치인지 여부
 */
function canPlaceDraggedTileCenter(
  center: StagePosition,
  activeInstanceId: string,
  blockingBounds: readonly BlockingTileBounds[],
  map: MapData,
  gridOrigin: StagePosition,
): boolean {
  const bounds = calculateTileBounds(center, COLLISION_INSET);

  if (!isInsideGridBounds(bounds, map, gridOrigin)) {
    return false;
  }

  return !blockingBounds.some((blockingTileBounds) => {
    if (blockingTileBounds.instanceId === activeInstanceId) {
      return false;
    }

    return intersectsRect(bounds, blockingTileBounds.bounds);
  });
}

/**
 * 드래그 타일의 경계가 통과할 수 있는 위치로 제한한다.
 *
 * @param proposedCenter 포인터 기준으로 계산한 다음 타일 중심
 * @param fallbackCenter 충돌 시 유지할 이전 타일 중심
 * @param activeInstanceId 드래그 중인 엔티티 id
 * @param blockingBounds 이동을 막는 타일의 충돌 영역 목록
 * @param map grid 범위를 제공하는 맵 데이터
 * @param gridOrigin 격자 시작 좌표
 * @returns 허용된 타일 중심 좌표
 */
function constrainDraggedTileCenter(
  proposedCenter: StagePosition,
  fallbackCenter: StagePosition,
  activeInstanceId: string,
  blockingBounds: readonly BlockingTileBounds[],
  map: MapData,
  gridOrigin: StagePosition,
): StagePosition {
  const deltaX = proposedCenter.x - fallbackCenter.x;
  const deltaY = proposedCenter.y - fallbackCenter.y;
  const stepCount = Math.max(
    1,
    Math.ceil(Math.max(Math.abs(deltaX), Math.abs(deltaY)) / 16),
  );
  let lastAllowedCenter = fallbackCenter;

  for (let step = 1; step <= stepCount; step += 1) {
    const nextCenter = {
      x: fallbackCenter.x + (deltaX * step) / stepCount,
      y: fallbackCenter.y + (deltaY * step) / stepCount,
    };

    if (
      !canPlaceDraggedTileCenter(
        nextCenter,
        activeInstanceId,
        blockingBounds,
        map,
        gridOrigin,
      )
    ) {
      return lastAllowedCenter;
    }

    lastAllowedCenter = nextCenter;
  }

  return lastAllowedCenter;
}

/**
 * 한 축 이동을 먼저 적용해 장애물에 막힌 상태에서도 다른 축으로 미끄러지게 한다.
 *
 * @param proposedCenter 포인터 이동량으로 계산한 다음 타일 중심
 * @param fallbackCenter 현재 타일 중심
 * @param activeInstanceId 드래그 중인 엔티티 id
 * @param blockingBounds 이동을 막는 타일의 충돌 영역 목록
 * @param map grid 범위를 제공하는 맵 데이터
 * @param gridOrigin 격자 시작 좌표
 * @returns 허용된 타일 중심 좌표
 */
function constrainDraggedTileCenterWithSlide(
  proposedCenter: StagePosition,
  fallbackCenter: StagePosition,
  activeInstanceId: string,
  blockingBounds: readonly BlockingTileBounds[],
  map: MapData,
  gridOrigin: StagePosition,
): StagePosition {
  const directCenter = constrainDraggedTileCenter(
    proposedCenter,
    fallbackCenter,
    activeInstanceId,
    blockingBounds,
    map,
    gridOrigin,
  );

  if (directCenter.x === proposedCenter.x && directCenter.y === proposedCenter.y) {
    return directCenter;
  }

  const xFirstCenter = constrainDraggedTileCenter(
    {
      x: proposedCenter.x,
      y: fallbackCenter.y,
    },
    fallbackCenter,
    activeInstanceId,
    blockingBounds,
    map,
    gridOrigin,
  );
  const xThenYCenter = constrainDraggedTileCenter(
    {
      x: xFirstCenter.x,
      y: proposedCenter.y,
    },
    xFirstCenter,
    activeInstanceId,
    blockingBounds,
    map,
    gridOrigin,
  );
  const yFirstCenter = constrainDraggedTileCenter(
    {
      x: fallbackCenter.x,
      y: proposedCenter.y,
    },
    fallbackCenter,
    activeInstanceId,
    blockingBounds,
    map,
    gridOrigin,
  );
  const yThenXCenter = constrainDraggedTileCenter(
    {
      x: proposedCenter.x,
      y: yFirstCenter.y,
    },
    yFirstCenter,
    activeInstanceId,
    blockingBounds,
    map,
    gridOrigin,
  );
  const xThenYDistance =
    Math.abs(proposedCenter.x - xThenYCenter.x) +
    Math.abs(proposedCenter.y - xThenYCenter.y);
  const yThenXDistance =
    Math.abs(proposedCenter.x - yThenXCenter.x) +
    Math.abs(proposedCenter.y - yThenXCenter.y);

  return xThenYDistance <= yThenXDistance ? xThenYCenter : yThenXCenter;
}

/**
 * 현재 위치에서 목표 위치를 향해 한 프레임에 이동할 중심 좌표를 계산한다.
 *
 * @param currentCenter 현재 타일 중심
 * @param targetCenter 포인터가 요구하는 목표 타일 중심
 * @returns 이번 프레임에 시도할 타일 중심
 */
function calculateNextSyncedCenter(
  currentCenter: StagePosition,
  targetCenter: StagePosition,
): StagePosition {
  const deltaX = targetCenter.x - currentCenter.x;
  const deltaY = targetCenter.y - currentCenter.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= DRAG_SYNC_EPSILON) {
    return targetCenter;
  }

  const stepDistance = Math.min(
    distance,
    Math.min(DRAG_SYNC_MAX_STEP, Math.max(DRAG_SYNC_EPSILON, distance * DRAG_SYNC_EASING)),
  );
  const stepRatio = stepDistance / distance;

  return {
    x: currentCenter.x + deltaX * stepRatio,
    y: currentCenter.y + deltaY * stepRatio,
  };
}

/**
 * ease-out 보간값을 계산한다.
 *
 * @param progress 0에서 1 사이의 진행도
 * @returns ease-out이 적용된 진행도
 */
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

function parseCssTimeToMilliseconds(cssTime: string): number | undefined {
  const value = cssTime.trim();

  if (value.endsWith("ms")) {
    const milliseconds = Number(value.slice(0, -2));

    return Number.isFinite(milliseconds) ? milliseconds : undefined;
  }

  if (value.endsWith("s")) {
    const seconds = Number(value.slice(0, -1));

    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
  }

  return undefined;
}

function readCssTimeVariable(
  element: HTMLElement | null,
  variableName: string,
): number {
  if (element === null) {
    return 0;
  }

  return (
    parseCssTimeToMilliseconds(
      getComputedStyle(element).getPropertyValue(variableName),
    ) ?? 0
  );
}

/**
 * 렌더링 타일 목록에서 이동을 막는 충돌 영역만 추출한다.
 *
 * @param renderableTiles 현재 맵에 렌더링 중인 타일 목록
 * @param gridOrigin 격자 시작 좌표
 * @returns enemy/block 타일 충돌 영역 목록
 */
function createBlockingBounds(
  renderableTiles: readonly RenderableMapTile[],
  gridOrigin: StagePosition,
): readonly BlockingTileBounds[] {
  return renderableTiles.flatMap((tile) => {
    if (!isBlockingTile(tile)) {
      return [];
    }

    return [
      {
        bounds: calculateTileBounds(
          calculateTileCenter(tile.entity, gridOrigin),
          COLLISION_INSET,
        ),
        instanceId: tile.entity.instanceId,
      },
    ];
  });
}

/**
 * 엔티티의 현재 grid 위치를 조회한다.
 *
 * @param entity 조회할 엔티티
 * @param entityPositions 런타임 위치 저장소
 * @returns 저장된 위치 또는 엔티티 기본 위치
 */
function getEntityGridPosition(
  entity: MapEntity,
  entityPositions: ReadonlyMap<string, GridPosition>,
): GridPosition {
  return entityPositions.get(entity.instanceId) ?? entity;
}

/**
 * 드래그 타일 경계와 가장 크게 겹친 아군 타일을 찾는다.
 *
 * @param draggedBounds 드래그 타일의 충돌 경계
 * @param activeInstanceId 드래그 중인 엔티티 id
 * @param renderableTiles 현재 맵에 렌더링 중인 타일 목록
 * @param entityPositions 런타임 위치 저장소
 * @param swapAnimations swap animation 중인 타일 목록
 * @param gridOrigin 격자 시작 좌표
 * @returns 충돌한 아군 타일 정보 또는 undefined
 */
function findCollidingAllyTile(
  draggedBounds: StageRect,
  activeInstanceId: string,
  renderableTiles: readonly RenderableMapTile[],
  entityPositions: ReadonlyMap<string, GridPosition>,
  swapAnimations: ReadonlyMap<string, SwapAnimationState>,
  gridOrigin: StagePosition,
): AllyTileCollision | undefined {
  let bestCollision: AllyTileCollision | undefined;

  renderableTiles.forEach((tile) => {
    if (
      tile.entity.instanceId === activeInstanceId ||
      !isAllyTile(tile) ||
      swapAnimations.has(tile.entity.instanceId)
    ) {
      return;
    }

    const gridPosition = getEntityGridPosition(tile.entity, entityPositions);
    const bounds = calculateTileBounds(
      calculateTileCenter(gridPosition, gridOrigin),
      COLLISION_INSET,
    );
    const intersectionBounds = calculateRectIntersection(draggedBounds, bounds);

    if (intersectionBounds === undefined) {
      return;
    }

    const intersectionArea = calculateRectArea(intersectionBounds);

    if (
      bestCollision === undefined ||
      intersectionArea > bestCollision.intersectionArea
    ) {
      bestCollision = {
        bounds,
        gridPosition,
        intersectionArea,
        intersectionBounds,
        tile,
      };
    }
  });

  return bestCollision;
}

/**
 * 지정한 grid 위치가 다른 아군에게 점유되어 있는지 확인한다.
 *
 * @param gridPosition 확인할 grid 위치
 * @param ignoredInstanceIds 점유 검사에서 제외할 엔티티 id 목록
 * @param renderableTiles 현재 맵에 렌더링 중인 타일 목록
 * @param entityPositions 런타임 위치 저장소
 * @returns 다른 아군 점유 여부
 */
function isGridOccupiedByOtherAlly(
  gridPosition: GridPosition,
  ignoredInstanceIds: ReadonlySet<string>,
  renderableTiles: readonly RenderableMapTile[],
  entityPositions: ReadonlyMap<string, GridPosition>,
): boolean {
  return renderableTiles.some((tile) => {
    if (!isAllyTile(tile) || ignoredInstanceIds.has(tile.entity.instanceId)) {
      return false;
    }

    const tilePosition = getEntityGridPosition(tile.entity, entityPositions);

    return tilePosition.x === gridPosition.x && tilePosition.y === gridPosition.y;
  });
}

/**
 * Pixi Graphics로 맵 격자를 그린다.
 *
 * @param graphics 격자를 그릴 Pixi Graphics 객체
 * @param map 격자를 구성할 맵 데이터
 */
function drawMapGrid(graphics: Graphics, map: MapData): void {
  const origin = calculateGridOrigin(map);

  graphics.clear();

  for (let y = 0; y < map.rows; y += 1) {
    for (let x = 0; x < map.cols; x += 1) {
      const cellX = origin.x + x * (MAP_TILE_SIZE + MAP_GRID_GAP);
      const cellY = origin.y + y * (MAP_TILE_SIZE + MAP_GRID_GAP);

      graphics.setFillStyle({ color: 0x111919, alpha: 0.46 });
      graphics.rect(cellX, cellY, MAP_TILE_SIZE, MAP_TILE_SIZE);
      graphics.fill();
      graphics.setStrokeStyle({ color: 0xf6f1e7, alpha: 0.34, width: 1 });
      graphics.rect(cellX, cellY, MAP_TILE_SIZE, MAP_TILE_SIZE);
      graphics.stroke();
    }
  }

  graphics.setStrokeStyle({ color: 0xf6f1e7, alpha: 0.46, width: 2 });
  graphics.rect(
    origin.x,
    origin.y,
    map.cols * MAP_TILE_SIZE + (map.cols - 1) * MAP_GRID_GAP,
    map.rows * MAP_TILE_SIZE + (map.rows - 1) * MAP_GRID_GAP,
  );
  graphics.stroke();
}

/**
 * 단일 맵 타일을 Pixi 스프라이트로 표시한다.
 *
 * @param props 타일 정보와 원본 텍스처
 * @returns Pixi 스프라이트 또는 null
 */
function PixiMapTile(props: PixiMapTileProps): React.ReactElement | null {
  const spriteRef = useRef<Sprite>(null);
  const croppedTexture = useMemo(() => {
    if (props.baseTexture === undefined) {
      return undefined;
    }

    return new Texture({
      source: props.baseTexture.source,
      frame: new Rectangle(
        props.tile.characterTile.tile_x,
        props.tile.characterTile.tile_y,
        props.tile.characterTile.tile_w,
        props.tile.characterTile.tile_h,
      ),
    });
  }, [props.baseTexture, props.tile.characterTile]);

  useEffect(() => {
    if (spriteRef.current === null) {
      return;
    }

    props.onSpriteMount({
      instanceId: props.tile.entity.instanceId,
      sprite: spriteRef.current,
    });

    return (): void => {
      props.onSpriteUnmount(props.tile.entity.instanceId);
    };
  }, [
    croppedTexture,
    props.onSpriteMount,
    props.onSpriteUnmount,
    props.tile.entity.instanceId,
  ]);

  if (croppedTexture === undefined) {
    return null;
  }

  const spriteScale =
    (MAP_TILE_SIZE * TILE_RENDER_RATIO) /
    Math.max(props.tile.characterTile.tile_w, props.tile.characterTile.tile_h);
  const tileCenter = calculateTileCenter(props.tile.entity, props.gridOrigin);

  return (
    <pixiSprite
      anchor={0.5}
      cursor={props.isDraggable ? "grab" : undefined}
      eventMode={props.isDraggable ? "static" : "none"}
      onPointerDown={(event: FederatedPointerEvent) => {
        if (props.isDraggable && spriteRef.current !== null) {
          props.onDragStart({
            event,
            instanceId: props.tile.entity.instanceId,
            sprite: spriteRef.current,
          });
        }
      }}
      ref={spriteRef}
      roundPixels
      scale={{ x: spriteScale, y: spriteScale }}
      texture={croppedTexture}
      x={tileCenter.x}
      y={tileCenter.y}
      zIndex={props.zIndex}
    />
  );
}

/**
 * 격자와 타일을 Pixi 캔버스에 렌더링한다.
 *
 * @param props Pixi 레이어 입력값
 * @returns Pixi 기반 맵 레이어
 */
function PixiMapLayer(props: PixiMapLayerProps): React.ReactElement {
  const renderableTiles = useMemo(
    () => createRenderableTiles(props.entities),
    [props.entities],
  );
  const textureUrls = useMemo(
    () => [...new Set(renderableTiles.map((tile) => tile.imageUrl))],
    [renderableTiles],
  );
  const [baseTextures, setBaseTextures] = useState<ReadonlyMap<string, Texture>>(
    () => new Map<string, Texture>(),
  );
  const gridOrigin = useMemo(
    () => calculateGridOrigin(props.map),
    [props.map],
  );
  const stageHitArea = useMemo(
    () => new Rectangle(0, 0, VIRTUAL_STAGE_WIDTH, VIRTUAL_STAGE_HEIGHT),
    [],
  );
  const blockingBounds = useMemo(
    () => createBlockingBounds(renderableTiles, gridOrigin),
    [gridOrigin, renderableTiles],
  );
  const activeDragRef = useRef<ActiveDragState | undefined>(undefined);
  const dragAnimationFrameRef = useRef<number | undefined>(undefined);
  const dragTimerIntervalRef = useRef<number | undefined>(undefined);
  const dragTimerTimeoutRef = useRef<number | undefined>(undefined);
  const entityPositionsRef = useRef<Map<string, GridPosition>>(new Map());
  const spriteRefsRef = useRef<Map<string, Sprite>>(new Map());
  const swapAnimationsRef = useRef<Map<string, SwapAnimationState>>(new Map());

  useEffect(() => {
    let isActive = true;

    async function loadTextures(): Promise<void> {
      const loadedTextureEntries = await Promise.all(
        textureUrls.map(async (textureUrl) => {
          const texture = await Assets.load<Texture>(textureUrl);

          return [textureUrl, texture] as const;
        }),
      );

      if (isActive) {
        setBaseTextures(new Map<string, Texture>(loadedTextureEntries));
      }
    }

    void loadTextures();

    return (): void => {
      isActive = false;
    };
  }, [textureUrls]);

  useEffect(() => {
    if (activeDragRef.current !== undefined) {
      return;
    }

    entityPositionsRef.current = new Map(
      props.entities.map((entity) => [
        entity.instanceId,
        {
          x: entity.x,
          y: entity.y,
        },
      ]),
    );
  }, [props.entities]);

  const drawGrid = useCallback(
    (graphics: Graphics): void => {
      drawMapGrid(graphics, props.map);
    },
    [props.map],
  );
  const updateSwapAnimations = useCallback((): void => {
    if (swapAnimationsRef.current.size === 0) {
      return;
    }

    const now = performance.now();

    swapAnimationsRef.current.forEach((animation, instanceId) => {
      const progress = Math.min(
        1,
        (now - animation.startedAt) / SWAP_ANIMATION_DURATION_MS,
      );
      const easedProgress = easeOutCubic(progress);
      const nextX =
        animation.from.x + (animation.to.x - animation.from.x) * easedProgress;
      const nextY =
        animation.from.y + (animation.to.y - animation.from.y) * easedProgress;

      animation.sprite.position.set(nextX, nextY);

      if (progress >= 1) {
        animation.sprite.position.set(animation.to.x, animation.to.y);
        swapAnimationsRef.current.delete(instanceId);
      }
    });
  }, []);
  const runDragFrame = useCallback((): void => {
    const currentDrag = activeDragRef.current;

    if (currentDrag === undefined) {
      updateSwapAnimations();
      dragAnimationFrameRef.current =
        swapAnimationsRef.current.size > 0
          ? window.requestAnimationFrame(runDragFrame)
          : undefined;
      return;
    }

    updateSwapAnimations();

    const currentCenter = {
      x: currentDrag.sprite.x,
      y: currentDrag.sprite.y,
    };
    const targetCenter = {
      x: currentDrag.targetX,
      y: currentDrag.targetY,
    };
    const proposedCenter = calculateNextSyncedCenter(currentCenter, targetCenter);
    const constrainedCenter = constrainDraggedTileCenterWithSlide(
      proposedCenter,
      currentCenter,
      currentDrag.instanceId,
      blockingBounds,
      props.map,
      gridOrigin,
    );
    const previousDragGridPosition =
      entityPositionsRef.current.get(currentDrag.instanceId) ??
      snapStagePositionToGrid(currentCenter, props.map, gridOrigin);
    const nextDragGridPosition = snapStagePositionToGrid(
      constrainedCenter,
      props.map,
      gridOrigin,
    );
    const draggedBounds = calculateTileBounds(constrainedCenter, COLLISION_INSET);
    const collidingAllyTile = findCollidingAllyTile(
      draggedBounds,
      currentDrag.instanceId,
      renderableTiles,
      entityPositionsRef.current,
      swapAnimationsRef.current,
      gridOrigin,
    );

    if (collidingAllyTile !== undefined) {
      const collisionDirection = resolveCollisionDirection({
        draggedBounds,
        intersectionBounds: collidingAllyTile.intersectionBounds,
        targetBounds: collidingAllyTile.bounds,
      });
      const swapGridPosition = {
        x: collidingAllyTile.gridPosition.x + collisionDirection.gridOffset.x,
        y: collidingAllyTile.gridPosition.y + collisionDirection.gridOffset.y,
      };
      const swapCenter = calculateTileCenter(swapGridPosition, gridOrigin);
      const ignoredInstanceIds = new Set([
        currentDrag.instanceId,
        collidingAllyTile.tile.entity.instanceId,
      ]);
      const canSwap =
        canPlaceDraggedTileCenter(
          swapCenter,
          collidingAllyTile.tile.entity.instanceId,
          blockingBounds,
          props.map,
          gridOrigin,
        ) &&
        !isGridOccupiedByOtherAlly(
          swapGridPosition,
          ignoredInstanceIds,
          renderableTiles,
          entityPositionsRef.current,
        );
      const collidingSprite = spriteRefsRef.current.get(
        collidingAllyTile.tile.entity.instanceId,
      );

      if (canSwap && collidingSprite !== undefined) {
        console.debug("[MapScene] swap decided", {
          collisionDirection: collisionDirection.direction,
          collisionGridPosition: collidingAllyTile.gridPosition,
          nextDragGridPosition,
          previousDragGridPosition,
          swapGridPosition,
          x: constrainedCenter.x,
          y: constrainedCenter.y,
        });

        swapAnimationsRef.current.set(collidingAllyTile.tile.entity.instanceId, {
          from: {
            x: collidingSprite.x,
            y: collidingSprite.y,
          },
          instanceId: collidingAllyTile.tile.entity.instanceId,
          sprite: collidingSprite,
          startedAt: performance.now(),
          to: swapCenter,
        });
        entityPositionsRef.current.set(
          collidingAllyTile.tile.entity.instanceId,
          swapGridPosition,
        );
      }
    }

    currentDrag.sprite.position.set(constrainedCenter.x, constrainedCenter.y);
    entityPositionsRef.current.set(
      currentDrag.instanceId,
      snapStagePositionToGrid(constrainedCenter, props.map, gridOrigin),
    );
    const reachedTarget =
      Math.hypot(
        currentDrag.targetX - constrainedCenter.x,
        currentDrag.targetY - constrainedCenter.y,
      ) <= DRAG_SYNC_EPSILON;
    const wasBlocked =
      constrainedCenter.x === currentCenter.x &&
      constrainedCenter.y === currentCenter.y &&
      !reachedTarget;

    if ((reachedTarget || wasBlocked) && swapAnimationsRef.current.size === 0) {
      dragAnimationFrameRef.current = undefined;
      return;
    }

    dragAnimationFrameRef.current = window.requestAnimationFrame(runDragFrame);
  }, [blockingBounds, gridOrigin, props.map, renderableTiles, updateSwapAnimations]);
  const ensureDragAnimation = useCallback((): void => {
    if (dragAnimationFrameRef.current !== undefined) {
      return;
    }

    dragAnimationFrameRef.current = window.requestAnimationFrame(runDragFrame);
  }, [runDragFrame]);
  const clearDragTimer = useCallback((): void => {
    if (dragTimerIntervalRef.current !== undefined) {
      window.clearInterval(dragTimerIntervalRef.current);
      dragTimerIntervalRef.current = undefined;
    }

    if (dragTimerTimeoutRef.current !== undefined) {
      window.clearTimeout(dragTimerTimeoutRef.current);
      dragTimerTimeoutRef.current = undefined;
    }
  }, []);
  const updateDragTimerDisplay = useCallback((): void => {
    const activeDrag = activeDragRef.current;

    if (activeDrag === undefined) {
      props.onDragTimerChange(props.dragTimeLimitSeconds);
      return;
    }

    const elapsedSeconds = (performance.now() - activeDrag.startedAt) / 1000;
    const remainingSeconds = Math.max(
      0,
      props.dragTimeLimitSeconds - elapsedSeconds,
    );

    props.onDragTimerChange(remainingSeconds);
  }, [props]);
  const completeActiveDrag = useCallback((): void => {
    const activeDrag = activeDragRef.current;

    if (activeDrag === undefined) {
      clearDragTimer();
      props.onDragTimerChange(props.dragTimeLimitSeconds);
      return;
    }

    const snappedPosition = snapStagePositionToGrid(
      {
        x: activeDrag.sprite.x,
        y: activeDrag.sprite.y,
      },
      props.map,
      gridOrigin,
    );
    const snappedCenter = calculateTileCenter(snappedPosition, gridOrigin);

    clearDragTimer();
    entityPositionsRef.current.set(activeDrag.instanceId, snappedPosition);
    activeDrag.sprite.zIndex = activeDrag.previousZIndex;

    props.onTurnEnd(
      Array.from(entityPositionsRef.current.entries()).map(
        ([instanceId, position]) => ({
          instanceId,
          x: position.x,
          y: position.y,
        }),
      ),
    );

    activeDrag.sprite.position.copyFrom(snappedCenter);
    activeDragRef.current = undefined;
    props.onDragTimerChange(props.dragTimeLimitSeconds);

    if (dragAnimationFrameRef.current !== undefined) {
      window.cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = undefined;
    }
  }, [clearDragTimer, gridOrigin, props]);
  const mountSprite = useCallback((input: SpriteMountInput): void => {
    spriteRefsRef.current.set(input.instanceId, input.sprite);
  }, []);
  const unmountSprite = useCallback((instanceId: string): void => {
    spriteRefsRef.current.delete(instanceId);
    swapAnimationsRef.current.delete(instanceId);
  }, []);
  const startDrag = useCallback((input: StartDragInput): void => {
    if (props.isInputLocked) {
      return;
    }

    input.event.stopPropagation();
    const previousZIndex = input.sprite.zIndex;

    input.sprite.zIndex = DRAGGED_TILE_Z_INDEX;

    const startedAt = performance.now();

    clearDragTimer();
    activeDragRef.current = {
      grabOffsetX: input.event.global.x - input.sprite.x,
      grabOffsetY: input.event.global.y - input.sprite.y,
      instanceId: input.instanceId,
      previousZIndex,
      sprite: input.sprite,
      startedAt,
      targetX: input.sprite.x,
      targetY: input.sprite.y,
    };
    props.onDragTimerChange(props.dragTimeLimitSeconds);
    dragTimerIntervalRef.current = window.setInterval(updateDragTimerDisplay, 100);
    dragTimerTimeoutRef.current = window.setTimeout(() => {
      props.onDragTimerChange(0);
      completeActiveDrag();
    }, props.dragTimeLimitSeconds * 1000);
    ensureDragAnimation();
  }, [
    clearDragTimer,
    completeActiveDrag,
    ensureDragAnimation,
    props,
    updateDragTimerDisplay,
  ]);
  const moveDrag = useCallback((event: FederatedPointerEvent): void => {
    const currentDrag = activeDragRef.current;

    if (currentDrag === undefined) {
      return;
    }

    activeDragRef.current = {
      ...currentDrag,
      targetX: event.global.x - currentDrag.grabOffsetX,
      targetY: event.global.y - currentDrag.grabOffsetY,
    };
    ensureDragAnimation();
  }, [ensureDragAnimation]);
  const endDrag = useCallback(
    (event: FederatedPointerEvent): void => {
      event.stopPropagation();
      completeActiveDrag();
    },
    [completeActiveDrag],
  );

  useEffect(() => {
    return (): void => {
      if (dragAnimationFrameRef.current !== undefined) {
        window.cancelAnimationFrame(dragAnimationFrameRef.current);
      }

      clearDragTimer();
    };
  }, [clearDragTimer]);

  return (
    <Application
      antialias
      autoDensity
      backgroundAlpha={0}
      className="map-scene__pixi-layer"
      height={VIRTUAL_STAGE_HEIGHT}
      resolution={window.devicePixelRatio}
      width={VIRTUAL_STAGE_WIDTH}
    >
      <pixiContainer
        eventMode={props.isInputLocked ? "none" : "static"}
        hitArea={stageHitArea}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerUpOutside={endDrag}
        sortableChildren
      >
        <pixiGraphics draw={drawGrid} zIndex={0} />
        {renderableTiles.map((tile, index) => (
          <PixiMapTile
            baseTexture={baseTextures.get(tile.imageUrl)}
            gridOrigin={gridOrigin}
            isDraggable={!props.isInputLocked && isAllyTile(tile)}
            key={tile.entity.instanceId}
            onDragStart={startDrag}
            onSpriteMount={mountSprite}
            onSpriteUnmount={unmountSprite}
            tile={tile}
            zIndex={TILE_BASE_Z_INDEX + index}
          />
        ))}
      </pixiContainer>
    </Application>
  );
}

/**
 * 데모 맵 JSON을 기반으로 격자 맵과 타일을 표시한다.
 *
 * @param props 맵 씬 이벤트 핸들러
 * @returns 데모 맵 화면
 */
export function MapScene(props: MapSceneProps): React.ReactElement {
  const map = mapDemo.map;
  const resolveTurnEndUseCase = useMemo(() => new ResolveTurnEndUseCase(), []);
  const [entities, setEntities] = useState<readonly MapEntity[]>(() =>
    createInitialMapEntities(map),
  );
  const [remainingDragSeconds, setRemainingDragSeconds] = useState(map.timer);
  const [battleAnimationState, setBattleAnimationState] = useState(
    emptyBattleAnimationQueueState,
  );
  const battleAnimationQueue = useMemo(
    () => new BattleAnimationQueue(setBattleAnimationState),
    [],
  );
  const damageLayerRef = useRef<HTMLDivElement>(null);
  const readBattleAnimationDurations = useCallback(
    (): BattleAnimationDurations => ({
      damageTextDurationMs: readCssTimeVariable(
        damageLayerRef.current,
        DAMAGE_TEXT_DURATION_CSS_VARIABLE,
      ),
      damageTextStaggerMs: readCssTimeVariable(
        damageLayerRef.current,
        DAMAGE_TEXT_STAGGER_CSS_VARIABLE,
      ),
      sandwichAttackDurationMs: readCssTimeVariable(
        damageLayerRef.current,
        SANDWICH_ATTACK_DURATION_CSS_VARIABLE,
      ),
      sandwichAttackStaggerMs: readCssTimeVariable(
        damageLayerRef.current,
        SANDWICH_ATTACK_STAGGER_CSS_VARIABLE,
      ),
      skillNameDurationMs: readCssTimeVariable(
        damageLayerRef.current,
        SKILL_NAME_DURATION_CSS_VARIABLE,
      ),
      skillNameStaggerMs: readCssTimeVariable(
        damageLayerRef.current,
        SKILL_NAME_STAGGER_CSS_VARIABLE,
      ),
    }),
    [],
  );
  const handleTurnEnd = useCallback(
    (inputs: readonly MoveMapEntityInput[]): void => {
      const nextPositionById = new Map(
        inputs.map((input) => [input.instanceId, input] as const),
      );
      const nextEntities = entities.map((entity) => {
        const nextPosition = nextPositionById.get(entity.instanceId);

        return nextPosition !== undefined
          ? {
              ...entity,
              x: nextPosition.x,
              y: nextPosition.y,
            }
          : entity;
      });
      const units: readonly TurnEndBoardUnit[] = nextEntities.map((entity) => ({
        characterId: entity.characterId,
        instanceId: entity.instanceId,
        x: entity.x,
        y: entity.y,
      }));
      const turnResult = resolveTurnEndUseCase.execute({
        characters: characterTiles,
        random: Math.random,
        skills: battleSkills,
        units,
      });
      const gridOrigin = calculateGridOrigin(map);
      const nextEntityById = new Map(
        nextEntities.map((entity) => [entity.instanceId, entity] as const),
      );
      const sandwichAttacks: readonly QueueSandwichAttackAnimationInput[] =
        turnResult.sandwichAttackEvents.flatMap((event) => {
          const firstActor = createSandwichCharacterAnimation(
            event.firstAttackerCharacterId,
            "left",
          );
          const secondActor = createSandwichCharacterAnimation(
            event.secondAttackerCharacterId,
            "right",
          );

          if (firstActor === undefined || secondActor === undefined) {
            return [];
          }

          return [
            {
              event,
              firstActor,
              secondActor,
              stagePosition: calculateTileCenter(
                {
                  x: event.targetX,
                  y: event.targetY,
                },
                gridOrigin,
              ),
            },
          ];
      });
      const skillNameGroupByAttacker = new Map<
        string,
        {
          readonly skillIds: Set<string>;
          readonly skillNames: string[];
          readonly stagePosition: BattleAnimationStagePosition;
        }
      >();

      turnResult.hitResultEvents.forEach((event) => {
        const attackerEntity = nextEntityById.get(event.attackerInstanceId);

        if (attackerEntity === undefined) {
          return;
        }

        const group =
          skillNameGroupByAttacker.get(event.attackerInstanceId) ??
          {
            skillIds: new Set<string>(),
            skillNames: [],
            stagePosition: calculateTileCenter(attackerEntity, gridOrigin),
          };

        if (!skillNameGroupByAttacker.has(event.attackerInstanceId)) {
          skillNameGroupByAttacker.set(event.attackerInstanceId, group);
        }

        if (group.skillIds.has(event.skillId)) {
          return;
        }

        group.skillIds.add(event.skillId);
        group.skillNames.push(event.skillName);
      });

      const skillNames: readonly QueueSkillNameAnimationInput[] = Array.from(
        skillNameGroupByAttacker,
        ([attackerInstanceId, group]) => ({
          animationId: attackerInstanceId,
          skillNames: group.skillNames,
          stagePosition: group.stagePosition,
        }),
      );
      const damageTexts: readonly QueueDamageTextAnimationInput[] =
        turnResult.hitResultEvents.map((event) => ({
          event,
          stagePosition: calculateTileCenter(
            {
              x: event.targetX,
              y: event.targetY,
            },
            gridOrigin,
          ),
        }));

      setEntities(nextEntities);
      battleAnimationQueue.enqueueTurnAnimations({
        damageTexts,
        durations: readBattleAnimationDurations(),
        sandwichAttacks,
        skillNames,
      });
    },
    [
      battleAnimationQueue,
      entities,
      map,
      readBattleAnimationDurations,
      resolveTurnEndUseCase,
    ],
  );

  useEffect(() => {
    return (): void => {
      battleAnimationQueue.dispose();
    };
  }, [battleAnimationQueue]);

  return (
    <VirtualStage
      ariaLabel="TerraBattle 맵 화면"
      backgroundImageUrl={resolveAssetUrl(map.background)}
    >
      <button
        className="map-scene__back-button"
        onClick={props.onBack}
        type="button"
      >
        Back
      </button>
      <div className="map-scene__timer-hud" aria-live="polite">
        <span className="map-scene__timer-label">Time</span>
        <span className="map-scene__timer-value">
          {remainingDragSeconds.toFixed(1)}
        </span>
      </div>
      <PixiMapLayer
        dragTimeLimitSeconds={map.timer}
        entities={entities}
        isInputLocked={battleAnimationState.isPlaying}
        map={map}
        onDragTimerChange={setRemainingDragSeconds}
        onTurnEnd={handleTurnEnd}
      />
      <div
        className={
          battleAnimationState.isPlaying
            ? "map-scene__damage-layer map-scene__damage-layer--input-lock"
            : "map-scene__damage-layer"
        }
        aria-hidden="true"
        ref={damageLayerRef}
      >
        {battleAnimationState.sandwichAttackAnimations.map((animation) => (
          <div
            className="map-scene__sandwich-attack"
            key={animation.animationId}
            style={{
              left: animation.stagePosition.x,
              top: animation.stagePosition.y,
            }}
          >
            {[animation.firstActor, animation.secondActor].map((actor) => (
              <img
                alt=""
                className={`map-scene__sandwich-character map-scene__sandwich-character--${actor.side}`}
                draggable={false}
                key={`${animation.animationId}:${actor.side}`}
                src={actor.imageUrl}
                style={
                  {
                    "--map-scene-sandwich-character-scale": actor.scale,
                    "--map-scene-sandwich-character-scale-enter": actor.scale * 0.82,
                    "--map-scene-sandwich-character-scale-exit": actor.scale * 0.74,
                    "--map-scene-sandwich-character-scale-impact": actor.scale * 1.12,
                    "--map-scene-sandwich-character-scale-near": actor.scale * 1.04,
                    animationDelay: `${animation.delayMs}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
        {battleAnimationState.skillNameAnimations.map((animation) => (
          <div
            className="map-scene__skill-name-box"
            key={animation.animationId}
            style={{
              animationDelay: `${animation.delayMs}ms`,
              left: animation.stagePosition.x,
              top: animation.stagePosition.y,
            }}
          >
            {animation.skillNames.map((skillName, index) => (
              <span
                className="map-scene__skill-name-text"
                key={`${animation.animationId}:${index}`}
              >
                {skillName}
              </span>
            ))}
          </div>
        ))}
        {battleAnimationState.damageTextAnimations.map((animation) => (
          <span
            className={`map-scene__damage-text map-scene__damage-text--${animation.result}`}
            key={animation.animationId}
            style={{
              animationDelay: `${animation.delayMs}ms`,
              left: animation.stagePosition.x,
              top: animation.stagePosition.y,
            }}
          >
            {animation.label}
          </span>
        ))}
      </div>
    </VirtualStage>
  );
}
