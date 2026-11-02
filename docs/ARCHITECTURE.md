# Architecture

This project follows Clean Architecture with feature-first organization. Full contributor guides: [`docs/architecture/`](architecture/README.md).

## Dependency Rule

Dependencies must point toward the domain / application core.

- Domain (when present) must not depend on infrastructure or frameworks.
- Application may depend on domain types and ports only.
- Infrastructure implements contracts defined by inner layers.
- Presentation depends on application contracts.
- Composition happens at the application boundary (`src/app/composition.ts`, `auth.module.ts`).

## Module Structure

Each business module owns the layers it needs:

- `application` (use cases, ports, DTOs, errors)
- `infrastructure` (adapters)
- `presentation` (HTTP)

Do not create empty `domain/` folders. Auth keeps most types/ports under `application/` today.

Large modules may use **internal submodules** with a single composition root. Auth is organized as `identity`, `credentials`, `verification`, `sessions`, `oauth`, `authorization`, `audit`, `mfa`, `passkeys`, `step-up`, and `shared`. Each area owns a factory (`identity.module.ts`, …); `src/modules/auth/auth.module.ts` creates shared ports and spreads those factories. Submodules depend on `auth/shared` and receive sibling ports only via composition — not via sibling infrastructure imports.

Product “users” HTTP (`/api/v1/users`) is part of auth identity (plus MFA/passkeys/OAuth/audit hubs). There is no separate `src/modules/users`.

## Shared Code

The `shared` directory contains only genuinely cross-cutting abstractions and utilities.

Cross-cutting **ports** for external IO live under `shared` and are implemented in `infrastructure`:

| Port | Shared | Infrastructure |
| --- | --- | --- |
| Email | `IEmailSender` | Resend / noop |
| Object storage | `IObjectStorage` | Local filesystem / S3 |
| Outbound HTTP | `IHttpClient` | Axios (`AxiosHttpClient`) |
| Jobs | `IJobQueue` | BullMQ / noop |

HTTP validation helpers (`validate`, `asHandler`) live under `shared/http` and may be re-exported from `app/middleware` for convenience.

## Dependency Injection

- Dependencies are manually injected.
- No DI container framework is used.
- The composition root creates concrete implementations once and injects ports.
- `create-app.ts` assembles Express and receives (or creates) application modules.
- `server.ts` owns API runtime lifecycle; `worker.ts` owns the job worker.
- Global mutable service containers are prohibited.
- Infrastructure resources are closed during graceful shutdown.
