# Testing guidelines

## Layout

```text
tests/
├── unit/           # use cases, pure helpers, middleware units
├── integration/    # HTTP via Supertest + createApp()
├── helpers/        # shared test utilities (e.g. mint-step-up-token)
└── setup.ts        # loads .env.test
```

Mirror source paths under `tests/unit/` where practical (`modules/auth/...`).

## Conventions

- Vitest (`pnpm test`). No Jest.
- Prefer mocking **ports / infrastructure classes**, not Express itself.
- Dynamic `import("@/app/create-app")` after `vi.mock` when composition must see mocks.
- `createApp()` should compose modules at call time (not via a process-wide import singleton).
- Integration tests assert status codes, error codes, and cookies — not implementation details.

## What not to do

- Do not delete security-sensitive tests to make a refactor “pass”.
- Do not require a live Postgres for the default CI suite until a dedicated integration job exists (`docs/TODO.md`).
