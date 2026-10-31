# Architecture

This project follows Clean Architecture with feature-first organization.

## Dependency Rule

Dependencies must point toward the domain.

- Domain must not depend on infrastructure or frameworks.
- Application may depend on domain.
- Infrastructure implements contracts defined by inner layers.
- Presentation depends on application contracts.
- Composition happens at the application boundary.

## Dependency Direction

Interface → Application → Domain

Infrastructure → Application/Domain

## Module Structure

Each business module owns its own:

- domain
- application
- infrastructure
- presentation

Large modules may use **internal submodules** (same clean-architecture layers per area) with a single composition root. The auth module is organized as `identity`, `credentials`, `verification`, `sessions`, `oauth`, `authorization` (scaffold), and `shared`. Each area owns a factory (`identity.module.ts`, `oauth.module.ts`, …); `src/modules/auth/auth.module.ts` only creates shared ports and spreads those factories. Submodules depend on `auth/shared` and receive sibling ports only via composition — not via presentation imports.

## Shared Code

The `shared` directory contains only genuinely cross-cutting abstractions and utilities.

Cross-cutting **ports** for external IO live under `shared` and are implemented in `infrastructure`:

| Port | Shared | Infrastructure |
| --- | --- | --- |
| Email | `IEmailSender` | Resend / noop |
| Object storage | `IObjectStorage` | Local filesystem / S3 |
| Outbound HTTP | `IHttpClient` | Axios (`AxiosHttpClient`) |
| Jobs | `IJobQueue` | BullMQ / noop |

Application and domain depend only on the ports. Axios and vendor SDKs stay in infrastructure. Compose implementations in `src/app/composition.ts`.

## Dependency Injection

- Dependencies are manually injected.
- No DI container framework is used.
- The composition root creates concrete implementations.
- Application and domain layers depend on abstractions.
- Infrastructure implements application/domain abstractions.
- `create-app.ts` is responsible for Express application assembly.
- `server.ts` owns API runtime lifecycle; `worker.ts` owns the job worker.
- Global mutable service containers are prohibited.
- Infrastructure connections are initialized explicitly.
- Infrastructure resources are closed during graceful shutdown.
