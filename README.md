# TerraBattle

2D 시나리오 기반 타일 샌드위치 공격 퍼즐 게임 저장소.

## Current Stack

- Node.js
- TypeScript
- PixiJS
- React HUD

## Repository Principles

- 전역 공통 기준만 루트에 둔다.
- 작업 상세 문서는 각 작업 폴더 안에 둔다.
- 기본 문서 단위는 `md`다.
- `mermaid`는 필요한 `md` 안에 포함한다.
- 구조 검증이 필요한 경우에만 같은 폴더에 `schema.json`을 둔다.
- 구현보다 문서가 먼저다.

## Read Order

1. `README.md`
2. `AGENTS.md`
3. `CONVENTIONS.md`
4. 작업 대상 폴더의 문서들

## Root Documents

- `README.md`: 프로젝트 입구와 기본 읽기 순서
- `AGENTS.md`: Codex 등 작업 에이전트용 전역 작업 규칙
- `CONVENTIONS.md`: 전역 네이밍, 구조, 문서 규약
- `CHANGELOG.md`: 루트 기준의 주요 변경 이력
- `DECISIONS.md`: 전역 결정과 그 이유

## Working Rule

기능 구현이나 수정은 해당 작업 폴더 안의 문서를 먼저 작성하거나 갱신한 뒤 진행한다.
작업 폴더 문서가 없으면 먼저 문서를 만든다.

## Status

프로젝트 초기화 단계.
세부 규칙, 시나리오 구조, 시스템 문서는 각 작업 폴더에서 관리한다.
