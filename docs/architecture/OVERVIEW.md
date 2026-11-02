# Architecture overview

Pragmatic modular monolith: feature modules, Clean Architecture layers where they pay for themselves, and **explicit manual composition**. Prefer readable TypeScript over pattern density.

Canonical short rules also live in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md). This folder holds the fuller guide for contributors.

## Target layout (adapted to this repo)

```text
src/
├── app/
│   ├── composition.ts          # API composition root
│   ├── create-app.ts           # Express factory (middleware + routes)
│   ├── http/                   # Node HTTP server tuning
│   ├── jobs/                   # Worker handlers + runtime wiring
│   ├── middleware/             # Global Express middleware
│   └── routes/                 # API + root mounts (factories take modules)
├── config/                     # Env schema + providers
├── infrastructure/             # Adapters for shared ports + DB/Redis
├── modules/
│   ├── auth/                   # Large feature with internal submodules
│   ├── uploads/
│   └── health/
├── shared/                     # Cross-cutting ports, errors, HTTP helpers
├── scripts/
├── server.ts
└── worker.ts
```

Do **not** invent empty `domain/` folders. Auth currently keeps ports/errors under `application/` — that is intentional until domain rules become richer than types + invariants already expressed in use cases.

## Dependency direction

```text
presentation → application (ports / use cases)
application  → ports + shared types (no Express, no Drizzle, no sibling infra)
infrastructure → implements application ports
app/composition → constructs infra + wires modules
```

Cross-feature auth dependencies are **injected** at `auth.module.ts` (ports), not by importing another submodule’s `infrastructure/`.

## Feature modules

| Module | Owns |
| --- | --- |
| `auth` | Registration, login, sessions, OAuth, MFA, passkeys, step-up, RBAC, audit, `/users/me` |
| `uploads` | Object storage upload/download/delete demo |
| `health` | Liveness/readiness probes |

Auth submodules each expose `create*Module` + route factories. HTTP hubs (`users.routes`, `admin.routes`) may aggregate controllers from several submodule modules — that is presentation aggregation, not a use-case cycle.

## Composition and DI

1. `createApplicationModules()` builds shared adapters and feature modules once per `createApp()` call.
2. `createAuthModule()` constructs shared repositories/signers and passes ports into submodule factories.
3. Controllers receive use cases via constructors; routes only attach middleware and handlers.
4. Worker uses `createWorkerRuntime()` — keep job wiring thin; prefer injecting the same ports/factories when adding jobs that touch auth.

No global service locator. No DI framework.

## Errors

- Throw `AppError` subclasses from application/presentation.
- Map Zod → `ValidationError` at the validation middleware.
- Terminal `errorHandler` formats `ApiErrorResponse`; unexpected errors become 500 without leaking internals outside local.

Auth-specific codes (`ACCOUNT_SUSPENDED`, `PERMISSION_DENIED`, `STEP_UP_REQUIRED`, …) stay meaningful — do not collapse them into a single `FORBIDDEN`.

## Testing

- Unit: use cases with mocked ports under `tests/unit/`.
- Integration: Supertest + `createApp()` under `tests/integration/` (repos typically mocked).
- Prefer constructing modules via composition after mocks; avoid relying on import-time singletons.

## Security

Structural refactors must preserve: refresh rotation + reuse detection, CSRF cookie pairing, MFA/step-up gates, OAuth state/PKCE, Argon2id/WebAuthn verification, and audit event semantics.
