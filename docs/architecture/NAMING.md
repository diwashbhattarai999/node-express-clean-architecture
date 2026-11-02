# Naming conventions

| Kind | Convention | Example |
| --- | --- | --- |
| Files | kebab-case | `login.use-case.ts` |
| Use cases | `VerbNounUseCase` | `LoginUseCase` |
| Controllers | match use case | `LoginController` |
| Ports | `IThingRepository` / `IThingSigner` | `ISessionRepository` |
| Postgres adapters | `PostgresThingRepository` | `PostgresSessionRepository` |
| Errors | `ThingError` extending `AppError` | `InvalidCredentialsError` |
| Route factories | `createThingRouter` | `createAuthRouter` |
| Module factories | `createThingModule` | `createMfaModule` |
| DTO types | `ThingDto` / result aliases | `LoginDto`, `LoginResult` |

Prefer full words (`identifier`, `repository`) over abbreviations (`idRepo`, `svc`).

Route files: plural resource names (`users.routes.ts`, `sessions.routes.ts`). The historical `upload.routes.ts` name is acceptable; new files should stay plural.
