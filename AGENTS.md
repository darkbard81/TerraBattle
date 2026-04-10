# AGENTS.md

이 저장소에서 작업하는 에이전트는 이 문서를 전역 규칙으로 따른다.

## Implementation Rules

- 게임 규칙 로직과 렌더링 로직을 섞지 않는다.
- PixiJS는 월드 렌더링 중심으로 사용한다.
- React는 HUD와 앱 UI 중심으로 사용한다.
- 상태의 진실은 도메인/게임 상태에 두고 표현 계층은 이를 반영만 한다.

## Purpose

This repository uses TypeScript with ESM modules.
Prefer code that is explicit, typed, domain-oriented, and easy to maintain.

## Core standards

- Use TypeScript for all new source files.
- Use ESM import/export syntax only.
- Prefer `import` / `export` over CommonJS `require` / `module.exports`.
- Prefer named exports over default exports unless framework conventions require default export.
- Prefer class-based implementation for domain services, entities, and use-case orchestration.
- Prefer `interface` or `type` for data contracts and DTO-like shapes.
- Write public and protected API documentation with TSDoc comments using `/** ... */`.
- Keep code modular and place types close to the domain that owns them.
- Avoid large mixed-purpose files.

## TypeScript style

- Enable strict typing and avoid `any`.
- Prefer explicit return types on exported functions, methods, and class members that form part of the public API.
- Prefer `readonly` for immutable fields and properties when possible.
- Prefer `private` / `protected` / `public` intentionally.
- If a function or method has exactly one parameter, do not create a dedicated input interface for that parameter.
- This includes single boolean parameters.
- If a function or method has two or more parameters, define an input interface and pass a single object parameter.
- If a function or method returns multiple result fields, define and use an output interface.
- Do not create unnecessary wrapper interfaces for single-value outputs.
- Prefer enums or string literal unions for mode-like branching when they represent domain states or options.

## Documentation with TSDoc

- Add TSDoc comments to exported classes, interfaces, types, functions, and non-trivial public methods.
- At minimum include a summary, `@param` tags, and `@returns` when applicable.
- Add `@throws` when the method can throw.
- Add `@example` for domain APIs when the usage is not obvious.
- Do not duplicate obvious type information in prose.
- Keep comments aligned with actual behavior; update TSDoc when implementation changes.
- Write TSDoc comment text in Korean.

## API shape rules

### Allowed

- One clearly meaningful primitive parameter:
  - `findById(id: UserId): Promise<User>`
- One object parameter defined by an interface:
  - `createUser(input: CreateUserInput): Promise<CreateUserOutput>`
- One boolean parameter when the meaning is obvious:
  - `setEnabled(enabled: boolean): void`

### Required for multiple values

- Define an input interface and pass one object parameter:
  - `createOrder(input: CreateOrderInput): Promise<CreateOrderOutput>`

### Avoid

- Multiple positional parameters when there are 2 or more business fields:
  - `createOrder(customerId, amount, currency, urgent)`

## Domain-oriented file layout

Organize code by domain, not by technical layer only.

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
  order/
    domain/
      Order.ts
      Order.types.ts
    application/
      OrderService.ts
      OrderService.types.ts

Rules:

- Keep domain-specific interfaces and types inside the owning domain folder.
- Use `*.types.ts` for request/response interfaces and shared domain type aliases.
- Use `*.ts` class files for entities, services, repositories, and policies.
- Do not create a single global `types` dump file for unrelated domains.
- Shared cross-domain primitives may live in a focused shared module, for example:
  - `src/shared/types/Identifier.ts`
  - `src/shared/types/Pagination.ts`

## ESM rules

- Use ESM syntax consistently.
- Use `export` and `import` statements in all TypeScript modules.
- Keep import paths consistent with the repository build settings.
- Prefer type-only imports where applicable:
  - `import type { CreateUserInput } from "./UserService.types.js";`
- Do not mix CommonJS and ESM in the same module.

## Class design rules

- Prefer classes for:
  - domain entities with behavior
  - application services
  - repositories
  - policy or strategy objects
- Keep constructors small and explicit.
- Prefer dependency injection through constructor parameters.
- Keep classes focused on one responsibility.
- Prefer composition over inheritance unless inheritance is clearly justified.

## Interface design rules

- Use interfaces for:
  - method input contracts with two or more fields
  - method output contracts with multiple result fields
  - repository contracts
  - external API request/response models
  - configuration objects
- Use descriptive names:
  - `CreateUserInput`
  - `CreateUserOutput`
  - `UserRepository`
  - `ListOrdersQuery`
- Avoid vague names:
  - `Data`
  - `Info`
  - `ResultObj`

## Implementation examples

### Good: single parameter, no wrapper interface needed

```ts
/**
 * Finds a user by id.
 *
 * @param id User identifier.
 * @returns Matched user.
 */
public async findById(id: string): Promise<User> {
  throw new Error("Not implemented");
}
```

### Good: multiple input values use an interface

```ts
export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
}

export interface CreateUserOutput {
  userId: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
}
```

```ts
/**
 * Creates a user in the system.
 *
 * @param input User creation request data.
 * @returns Created user summary.
 */
export class UserService {
  public async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    return {
      userId: "U001",
      displayName: input.displayName,
      status: "ACTIVE",
    };
  }
}
```

### Good: type-only import with ESM

```ts
import type { CreateUserInput, CreateUserOutput } from "./UserService.types.js";

export class UserService {
  public async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    throw new Error("Not implemented");
  }
}
```

### Avoid: positional multi-argument API

```ts
createUser(email: string, displayName: string, role: string, active: boolean)
```

## Testing and verification

- Add or update tests for behavior changes.
- Run lint, type-check, and tests before finalizing.
- Do not leave unused exports, dead interfaces, or stale comments.

## Change discipline

- Keep diffs small and domain-local when possible.
- When adding or changing a public API, update TSDoc in the same change.
- When introducing a new multi-field request or response, define or update the corresponding interface in the domain-local `*.types.ts` file.
