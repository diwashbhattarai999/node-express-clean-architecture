# Architecture audit (Phase 1)

Snapshot of the repository as of v1.7.0. Inspection covered bootstrap, composition, all feature modules (auth submodules, uploads, health), infrastructure, shared code, workers, tests, Docker/CI, and docs. No code was changed during the audit itself.

## Current architecture overview

Modular monolith with Clean Architecture layers and **manual composition** (no DI container).

| Area | Location | Role |
| --- | --- | --- |
| Process entry | `src/server.ts`, `src/worker.ts` | API / worker lifecycle |
| HTTP assembly | `src/app/create-app.ts` | Middleware order + route mounts |
| Composition root | `src/app/composition.ts` | Wire ports → modules |
| Worker composition | `src/app/jobs/create-worker-runtime.ts` | Separate job graph |
| Config | `src/config/` | Zod-validated env |
| Feature modules | `src/modules/auth`, `uploads`, `health` | Business capabilities |
| Shared ports/utils | `src/shared/` | Cross-cutting contracts |
| Adapters | `src/infrastructure/` | Postgres, Redis, email, storage, HTTP client, BullMQ |

**Request path:** Express middleware → versioned router → module route → validator → controller → use case → repository port → Drizzle adapter → `sendSuccess` / thrown `AppError` → error handler.

**Auth** is a large internal modular monolith: `identity`, `credentials`, `verification`, `sessions`, `oauth`, `authorization`, `audit`, `mfa`, `passkeys`, `step-up`, `shared`, composed in `auth.module.ts`.

There is **no** standalone `src/modules/users` — `/api/v1/users` is owned by auth identity (+ MFA/passkeys/OAuth/audit route hubs).

## What is already strong

- Clear inward dependency rule and port table for email/storage/HTTP/jobs.
- Manual DI with typed submodule factories and `Pick<>` on repositories.
- Consistent HTTP envelope, Zod validation, `AppError` / `ErrorCode`.
- Auth product surface is complete (AUTH_API 92/92) with solid unit + integration coverage.
- Graceful shutdown, HTTP timeouts, Helmet/CORS/rate limit, Pino redaction.
- Provider switches (email/storage/jobs) with fail-fast env validation.
- Docker multi-stage + migrate-on-start; Compose `api` + `worker`.

## Actual problems (fix / high value)

These hurt maintainability or correctness without requiring speculative redesign.

1. **Sibling modules construct authorization infrastructure**  
   `identity`, `credentials`, `sessions`, and `audit` each `new PostgresPermissionRepository()` (and identity also constructs `PostgresRoleRepository`). Violates “sibling ports via composition only” and duplicates adapters.

2. **Eager module composition at route import**  
   `src/app/routes/v1/index.ts` calls `createApplicationModules()` at load time. Couples first import to singletons; harder to inject alternate graphs in tests.

3. **Duplicated sign-in session issuance**  
   Login, magic-link consume, MFA verify, passkey login, and OAuth complete all repeat create-session + access-token signing. Refresh/rotation correctly stays separate.

4. **Dead / misleading rate-limit skip**  
   Skip checks `path.startsWith("/uploads")`, but uploads mount at `/api/v1/uploads`. Today uploads are already rate-limited; “fixing” the path to skip them would weaken protection. Prefer removing the dead skip.

5. **Presentation → `src/app` dependency**  
   Controllers import `@/app/middleware/validation`. Framework glue belongs under `shared/http` (or a thin presentation helper), with `app` re-exporting if needed.

6. **README / ARCHITECTURE drift**  
   README still shows `modules/users/` as the sample slice; product user APIs live under auth.

7. **Dual composition roots for jobs**  
   Worker rebuilds repos/use cases instead of reusing auth factories — drift risk when job handlers grow.

## Optional improvements (not blockers)

- Dual Redis clients (`redis` for readiness, `ioredis` for BullMQ) — workable; unify only if Redis usage expands.
- Health module is functional/ops-oriented (not factory-wired) — acceptable.
- Uploads lack auth by design for the starter demo — document; do not silently lock down without a product decision.
- No real Postgres/BullMQ integration tests in CI — tracked in `docs/TODO.md`.
- Fat `IIdentityRepository` and large authorization use-case prelude — incremental extraction later.
- Verification email/phone create sessions inside repository transactions — keep; do not force through a shared issuer that breaks atomicity.
- Three 403 families (`FORBIDDEN`, `PERMISSION_DENIED`, account codes) — intentional for clients; document, do not merge.

## Security notes (preserve behavior)

- Do not change refresh rotation, reuse detection, CSRF cookie rules, MFA/step-up gates, or OAuth PKCE/state as part of structural refactors.
- Do not skip rate limiting on upload routes without an explicit product decision.
- Keep secrets out of git; env schema remains the source of truth.

## Testing gaps

- HTTP integration tests mock repositories (fast, but no real DB contract tests).
- No worker runtime / BullMQ integration tests.
- Biome includes `src/**` only (tests not linted).
- CI: lint, typecheck, test, build — no Postgres/Redis services.

## Dependency flow (simplified)

```text
server.ts → createApp → createApplicationModules → createAuthModule / createUploadsModule
                ↓
         Express middleware → /api/v1/* routers → controllers → use cases → ports
                ↓
         infrastructure adapters (Drizzle, Jose, Argon2, WebAuthn, …)

worker.ts → createWorkerRuntime → job handlers → auth use cases (manual wire)
```
