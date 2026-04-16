import { Application, extend } from "@pixi/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { resolveAssetUrl } from "../../assets/assetUrls.js";
import {
  VIRTUAL_STAGE_HEIGHT,
  VIRTUAL_STAGE_WIDTH,
  VirtualStage,
} from "../../shared/display/VirtualStage.js";

extend({
  Container,
  Graphics,
  Sprite,
});

const MAP_TILE_SIZE = 128;
const MAP_GRID_GAP = 0;
const TILE_RENDER_RATIO = 0.88;

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
interface CharacterTileData {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly image_path: string;
  readonly tile_x: number;
  readonly tile_y: number;
  readonly tile_w: number;
  readonly tile_h: number;
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
  readonly onEntityMove: (input: MoveMapEntityInput) => void;
}

/**
 * Pixi 타일 스프라이트 입력값이다.
 */
interface PixiMapTileProps {
  readonly activeDrag: ActiveDragState | undefined;
  readonly tile: RenderableMapTile;
  readonly baseTexture: Texture | undefined;
  readonly gridOrigin: { readonly x: number; readonly y: number };
  readonly isDraggable: boolean;
  readonly onDragStart: (input: StartDragInput) => void;
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
  readonly spriteX: number;
  readonly spriteY: number;
}

/**
 * 현재 드래그 중인 엔티티 상태다.
 */
interface ActiveDragState {
  readonly instanceId: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly pointerX: number;
  readonly pointerY: number;
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
    y: (VIRTUAL_STAGE_HEIGHT - gridHeight) / 2,
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
 * 지정한 엔티티가 드래그 가능한 아군인지 확인한다.
 *
 * @param tile 확인할 타일 정보
 * @returns 드래그 가능한 아군 여부
 */
function isAllyTile(tile: RenderableMapTile): boolean {
  return tile.entity.type === "ally" || tile.characterTile.type === "ally";
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

  if (croppedTexture === undefined) {
    return null;
  }

  const spriteScale =
    (MAP_TILE_SIZE * TILE_RENDER_RATIO) /
    Math.max(props.tile.characterTile.tile_w, props.tile.characterTile.tile_h);
  const tileCenter = calculateTileCenter(props.tile.entity, props.gridOrigin);
  const dragX =
    props.activeDrag?.instanceId === props.tile.entity.instanceId
      ? props.activeDrag.pointerX - props.activeDrag.offsetX
      : undefined;
  const dragY =
    props.activeDrag?.instanceId === props.tile.entity.instanceId
      ? props.activeDrag.pointerY - props.activeDrag.offsetY
      : undefined;
  const x = dragX ?? tileCenter.x;
  const y = dragY ?? tileCenter.y;

  return (
    <pixiSprite
      anchor={0.5}
      cursor={props.isDraggable ? "grab" : undefined}
      eventMode={props.isDraggable ? "static" : "none"}
      onPointerDown={(event: FederatedPointerEvent) => {
        if (props.isDraggable) {
          props.onDragStart({
            event,
            instanceId: props.tile.entity.instanceId,
            spriteX: x,
            spriteY: y,
          });
        }
      }}
      roundPixels
      scale={{ x: spriteScale, y: spriteScale }}
      texture={croppedTexture}
      x={x}
      y={y}
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
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | undefined>();

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

  const drawGrid = useCallback(
    (graphics: Graphics): void => {
      drawMapGrid(graphics, props.map);
    },
    [props.map],
  );
  const startDrag = useCallback((input: StartDragInput): void => {
    input.event.stopPropagation();

    setActiveDrag({
      instanceId: input.instanceId,
      offsetX: input.event.global.x - input.spriteX,
      offsetY: input.event.global.y - input.spriteY,
      pointerX: input.event.global.x,
      pointerY: input.event.global.y,
    });
  }, []);
  const moveDrag = useCallback((event: FederatedPointerEvent): void => {
    setActiveDrag((currentDrag) => {
      if (currentDrag === undefined) {
        return currentDrag;
      }

      return {
        ...currentDrag,
        pointerX: event.global.x,
        pointerY: event.global.y,
      };
    });
  }, []);
  const endDrag = useCallback(
    (event: FederatedPointerEvent): void => {
      if (activeDrag === undefined) {
        return;
      }

      const snappedPosition = snapStagePositionToGrid(
        {
          x: event.global.x - activeDrag.offsetX,
          y: event.global.y - activeDrag.offsetY,
        },
        props.map,
        gridOrigin,
      );

      props.onEntityMove({
        instanceId: activeDrag.instanceId,
        x: snappedPosition.x,
        y: snappedPosition.y,
      });

      setActiveDrag(undefined);
    },
    [activeDrag, gridOrigin, props],
  );

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
        eventMode="static"
        hitArea={stageHitArea}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerUpOutside={endDrag}
      >
        <pixiGraphics draw={drawGrid} />
        {renderableTiles.map((tile) => (
          <PixiMapTile
            activeDrag={activeDrag}
            baseTexture={baseTextures.get(tile.imageUrl)}
            gridOrigin={gridOrigin}
            isDraggable={isAllyTile(tile)}
            key={tile.entity.instanceId}
            onDragStart={startDrag}
            tile={tile}
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
  const [entities, setEntities] = useState<readonly MapEntity[]>(() =>
    createInitialMapEntities(map),
  );
  const moveEntity = useCallback((input: MoveMapEntityInput): void => {
    setEntities((currentEntities) =>
      currentEntities.map((entity) =>
        entity.instanceId === input.instanceId
          ? {
              ...entity,
              x: input.x,
              y: input.y,
            }
          : entity,
      ),
    );
  }, []);

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
      <PixiMapLayer entities={entities} map={map} onEntityMove={moveEntity} />
    </VirtualStage>
  );
}
