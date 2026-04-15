# AGENTS.md

이 저장소에서 작업하는 에이전트는 이 문서를 전역 규칙으로 따른다.

## Implementation Rules

- 게임 규칙 로직과 렌더링 로직을 섞지 않는다.
- React: 장면 전환, UI, 상태관리
- Pixi: 각 장면 안의 맵/유닛/이펙트 렌더링
- @pixi/react: React 컴포넌트 트리와 Pixi 장면을 연결
- 상태의 진실은 도메인/게임 상태에 두고 표현 계층은 이를 반영만 한다.
- Pixi `Application`은 앱 루트에서 가능한 한 하나만 유지하고, 장면 전환 시에는 내부 레이어를 교체한다.
- 장면은 `Scene`, `Layer`, `HUD` 역할로 분리한다.
- Pixi 레이어와 React HUD는 분리하되, 같은 장면 단위에서 함께 조합할 수 있어야 한다.
- 장면 전환, 턴, 선택 상태, 모달, 메뉴 열림 같은 논리 상태는 React state / reducer / store에서 관리한다.
- 좌표 보간, 파티클, 카메라 흔들림, 짧은 이펙트 진행도처럼 초당 자주 바뀌는 값 전체를 React state에만 몰아넣지 않는다.
- 고빈도 프레임 갱신 값은 Pixi 렌더 루프 또는 장면 내부 상태에서 처리하고, React에는 의미 있는 게임 상태만 반영한다.

## Project rules

- Use TypeScript for all new code.
- Use ESM only. Do not use CommonJS.
- Prefer named exports over default exports unless the framework requires otherwise.
- Prefer class-based implementation for domain entities, services, repositories, and use-case orchestration.
- Prefer `interface` or `type` for data contracts.

## TypeScript conventions

- Use strict typing. Avoid `any`.
- Add explicit return types to exported functions, methods, and public APIs.
- Use `public`, `protected`, and `private` intentionally.
- Prefer `readonly` where values should not change.
- Prefer composition over inheritance unless inheritance is clearly justified.

## Parameter and return rules

- If a function or method has exactly one parameter, do not create an interface only for that parameter.
- This rule also applies to a single boolean parameter.
- If a function or method has two or more parameters, define an input interface and pass a single object parameter.
- If a function or method returns multiple meaningful fields, define and use an output interface.
- Do not create unnecessary wrapper interfaces for single-value inputs or outputs.
- If a boolean parameter makes the call ambiguous, prefer a string literal union, enum, or separate method names.

## TSDoc rules

- Add TSDoc comments to exported classes, interfaces, types, functions, and non-trivial public methods.
- At minimum include a summary, `@param`, and `@returns` when applicable.
- Add `@throws` when the method can throw.
- Add `@example` when the usage is not obvious.
- Keep comments aligned with actual behavior.
- Write TSDoc comments in Korean.

## File and domain structure

- Organize code by domain.
- Keep domain-specific types near the owning domain.
- Use `*.types.ts` for request, response, and shared domain type definitions.
- Do not create one large global types file for unrelated domains.

Example:

src/
  user/
    domain/
      User.ts
      User.types.ts
    application/
      UserService.ts
      UserService.types.ts
    infrastructure/
      UserRepository.ts

Preferred scene-oriented example:

src/
  app/
    App.tsx
    GameShell.tsx
  game/
    state/
      GameState.types.ts
      GameStateReducer.ts
  scene/
    title/
      TitleScene.ts
      TitleScene.types.ts
      TitleLayer.tsx
      TitleHUD.tsx
    battle/
      BattleScene.ts
      BattleLayer.tsx
      BattleHUD.tsx

## ESM rules

- Use `import` / `export` in all modules.
- Do not mix ESM and CommonJS.
- Prefer type-only imports when possible.

Example:

```ts
import type { CreateUserInput, CreateUserOutput } from "./UserService.types.js";
```

## Naming rules

- Use descriptive names such as:
  - `CreateUserInput`
  - `CreateUserOutput`
  - `ListOrdersQuery`
  - `UserRepository`
- Avoid vague names such as:
  - `Data`
  - `Info`
  - `ResultObj`

## Verification

- Update or add tests for behavior changes.
- Keep public API types and TSDoc in sync with implementation.
- Keep changes small and domain-local where possible.
