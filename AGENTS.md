# AGENTS.md

이 저장소에서 작업하는 에이전트는 이 문서를 전역 규칙으로 따른다.

## Project rules

- Use TypeScript for all new code.
- Use ESM only. Do not use CommonJS.
- Prefer named exports over default exports unless the framework requires otherwise.
- Prefer function components for React UI components.
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
- React component props are an exception; define a dedicated `Props` interface or type when it improves readability or reuse.
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
