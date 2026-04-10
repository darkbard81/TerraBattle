# AGENTS.md

이 저장소에서 작업하는 에이전트는 이 문서를 전역 규칙으로 따른다.

## Implementation Rules

- 게임 규칙 로직과 렌더링 로직을 섞지 않는다.
- PixiJS는 월드 렌더링 중심으로 사용한다.
- React는 HUD와 앱 UI 중심으로 사용한다.
- 상태의 진실은 도메인/게임 상태에 두고 표현 계층은 이를 반영만 한다.

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
