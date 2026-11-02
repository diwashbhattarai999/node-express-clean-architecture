# Feature module guidelines

## When to create a module

Add a top-level module under `src/modules/` when the capability has its own HTTP surface and persistence/IO story (or a clear ops boundary like `health`). Prefer growing an auth submodule over a new top-level module when the capability is authentication/authorization adjacent.

## Recommended shape

```text
feature/
├── application/
│   ├── use-cases/
│   ├── ports/
│   ├── dto/
│   ├── errors/
│   └── services/          # only when multiple use cases share logic
├── infrastructure/        # adapters for this feature's ports
├── presentation/http/
│   ├── controllers/
│   ├── validators/
│   ├── routes/
│   └── middleware/        # feature-specific only
└── feature.module.ts      # factory: ports in → controllers/middleware out
```

Skip layers that do not earn their keep (uploads has no domain folder; health is intentionally thin).

## Auth submodules

- Own use cases, ports, and Postgres adapters under the submodule.
- Depend on sibling **ports** and `auth/shared` only.
- Receive sibling infrastructure through `auth.module.ts`, never `import …/infrastructure/…` from another submodule’s factory.
- Cross-cutting crypto/token helpers live in `auth/shared`.
- Cross-cutting account/credential errors that many submodules throw should live in `auth/shared/application/errors` when moved (incremental).

## Public API of a module

Export:

- `createXModule(options)` and `XModule` type (controllers + middleware the routes need).
- Route factory `createXRouter(moduleSlice)` with a narrow `Pick<>` when helpful.

Avoid barrel `index.ts` files that re-export the world.

## Adding a new endpoint (checklist)

1. Contract in `docs/AUTH_API.md` (or module docs) if auth-related.
2. Use case + unit test.
3. Validator + controller + route.
4. Wire in the submodule factory and router.
5. Integration test if HTTP/auth/cookies matter.
6. Changelog `[Unreleased]`.
