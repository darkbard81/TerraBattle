# TerraBattle

2D 시나리오 기반 타일 샌드위치 공격 퍼즐 게임 저장소.

## Current Stack

- Node.js
- TypeScript
- PixiJS
- React HUD

## Prerequisites

- Node.js `^20.19.0 || >=22.12.0`
- npm

## Repository Principles

- [Basic Rule](docs/core_definition.md)
- [Resolution Rule](docs/resolution_rule.md)
- [RoadMap](RoadMap.md)
- [Architecture](docs/architecture.md)

## Current Bootstrap

- Vite + React + TypeScript + PixiJS 초기 구성이 적용되어 있습니다.
- React는 타이틀 HUD를, PixiJS는 배경 월드 렌더링을 담당합니다.
- 현재 구현 범위는 `Title 화면`까지입니다.

## Commands

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run test`
- `npm run test:run`
- `npm run build`
- `npm run preview`

## Recommended verification order

1. `npm install`
2. `npm run dev`
3. `npm run test:run`
4. `npm run typecheck`
5. `npm run build`
