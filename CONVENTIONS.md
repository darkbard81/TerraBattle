# CONVENTIONS

프로젝트 전역 공통 규약.

## Document Placement

- 전역 문서는 루트에 둔다.
- 작업 상세 문서는 각 작업 폴더 안에 둔다.
- 기본 문서 단위는 `md`다.
- 구조 검증이 필요한 경우에만 옆에 `schema.json`을 둔다.
- `mermaid`는 필요한 `md` 안에 직접 포함한다.

## Document Writing

- 문장은 가능하면 판정 가능한 형태로 쓴다.
- 모호한 표현보다 입력, 출력, 조건, 예외를 분명하게 쓴다.
- 코드가 아니라 규칙과 책임을 먼저 적는다.
- 구현 세부보다 경계와 계약을 우선 적는다.

## Folder-Level Docs

각 작업 폴더 문서는 필요에 따라 아래를 포함할 수 있다.

- 목적
- 범위
- 책임
- 입력/출력
- 상태 구조
- 예외 처리
- 테스트 기준
- mermaid 다이어그램
- 필요 시 `schema.json`

## Naming

- 문서 파일명은 소문자 kebab-case를 기본으로 한다.
- 타입, 클래스, 컴포넌트 이름은 TypeScript 관례를 따른다.
- 폴더명은 의미 단위 중심으로 짓는다.

## Architecture Boundary

- 게임 규칙은 TypeScript 도메인 로직으로 분리한다.
- PixiJS는 월드 렌더링과 시각 표현을 담당한다.
- React는 HUD와 앱 UI를 담당한다.
- 규칙 상태와 표현 상태를 분리한다.

## Change Discipline

- 전역 규약 변경은 `DECISIONS.md` 또는 관련 루트 문서에 반영한다.
- 큰 변경은 `CHANGELOG.md`에 남긴다.
- 작업 상세 변경은 해당 폴더 문서에 남긴다.
