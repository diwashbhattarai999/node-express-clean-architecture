# TODO — Prioritized remaining work

Checked against `docs/ROADMAP.md` and the current codebase (2026-08-29).

**Already in place:** Phases 1–5 foundation, Biome/Lefthook/commitlint, Vitest unit + users integration tests, Express bootstrap (`/health`, `/ready`, graceful shutdown), env Zod validation, middleware (helmet, CORS, rate limit, compression, request IDs, Pino), users CRUD vertical slice, Drizzle/Postgres + Compose, Zod validators, AppError/field errors, pagination/filter/sort, `/api/v1`, GitHub Actions CI, Dependabot.

| Priority | Item | Phase | Notes |
| --- | --- | --- | --- |
| P0 | Root `README.md` (overview, setup, env, DB, scripts) | 28 | Done |
| P0 | Fix `drizzle.config.ts` schema path | 9 | Points at `schema/*.ts`; actual schema is under `drizzle/schema/` |
| P0 | Pin `packageManager` / Node engines in `package.json` | 25 | CI uses pnpm 11 + Node 22; package metadata does not |
| P1 | App Dockerfile (multi-stage, non-root, `.dockerignore`) | 22 | Compose only runs Postgres today |
| P1 | Authentication module (per `docs/AUTH.md`) | 13 | Password hash/verify exists; no login/session/tokens/middleware |
| P1 | Protect users (and future) routes with auth middleware | 13 / 8 | Users API is currently open |
| P2 | Authorization / RBAC | 14 | Design + middleware + use-case rules |
| P2 | Unauthorized / Forbidden / Conflict error conventions | 11 | Email-already-exists is 400 today; auth errors missing |
| P2 | OpenAPI / Swagger UI synced with routes | 19 | Not started |
| P3 | Coverage thresholds in Vitest + CI coverage gate | 3 / 23 | Coverage configured, no thresholds |
| P3 | Real test DB strategy + repository tests | 8 / 9 | Integration tests mock the repository |
| P3 | E2E test structure and smoke flows | 3 / 23 | `tests/e2e` empty / unused |
| P3 | Include `tests/**` in Biome | 2 | Biome currently scopes to `src/**` only |
| P4 | HTTP server timeouts + keep-alive | 4 / 7 | Shutdown timeout only |
| P4 | Transaction abstraction for multi-step writes | 6 / 9 | Not needed yet for simple CRUD |
| P4 | Database seeding | 9 | — |
| P4 | Dependency audit / vulnerability scanning in CI | 15 / 23 / 25 | Dependabot present; no audit step |
| P5 | Redis / caching layer (if required) | 16 | — |
| P5 | Email abstraction + provider | 17 | Needed for verification/recovery in AUTH |
| P5 | Background jobs / queue | 18 | — |
| P5 | File uploads / object storage | 21 | — |
| P5 | Metrics, tracing, OpenTelemetry | 12 / 27 | Logging only today |
| P6 | Architecture enforcement (dependency-cruiser or similar) | 29 | Documented rules; not automated |
| P6 | Shared domain base entity / ID / date abstractions | 6 | Ad-hoc today |
| P6 | Branch/PR/release/changelog conventions | 24 | Hooks + Conventional Commits done |
| P6 | Production hardening checklist (Phase 30 remainder) | 30 | Docker image, full docs, security checklist |

## Suggested next sequence

1. Fix drizzle config + engines/`packageManager`
2. App Docker image
3. Auth (sessions/tokens per AUTH.md) → lock down users API
4. RBAC + error conventions
5. OpenAPI
6. Coverage / real DB tests / E2E
7. Optional infra (Redis, email, jobs, uploads, OTel)
