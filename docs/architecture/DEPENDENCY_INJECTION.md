# Dependency injection guidelines

## Rules

1. Construct adapters at the composition boundary (`composition.ts`, `auth.module.ts`, worker runtime).
2. Pass **ports** (interfaces) into use cases and submodule factories.
3. Do not `new` another feature’s Postgres repository inside a sibling `*.module.ts`.
4. Prefer one shared instance per process for repositories that are stateless adapters.
5. Controllers only depend on use cases (or narrow application services).
6. Never stash services on `globalThis` or a hidden registry.

## Auth composition pattern

```text
createAuthModule
  ├── new Postgres*Repository (shared instances)
  ├── new Jose*Signer / Argon2 / WebAuthn / MFA crypto
  ├── createPasskeysModule({ ports… })
  ├── createMfaModule({ ports… })
  ├── createStepUpModule({ ports… })
  ├── createIdentityModule({ …, permissionRepository, roleRepository })
  ├── createCredentialsModule({ …, permissionRepository })
  ├── createSessionsModule({ …, permissionRepository })
  ├── createAuthorizationModule({ …, permissionRepository, roleRepository })
  └── createAuditModule({ …, permissionRepository })
```

Authorization repositories are owned by the authorization submodule’s infrastructure folder but **instantiated once** at the auth composition root and injected everywhere that needs `IPermissionRepository` / `IRoleRepository`.

## Shared application helpers

When several sign-in paths create a session the same way, use `issueAuthSession` in `auth/shared` instead of copy-pasting UUID + hash + `createSession` + `sign`. Keep refresh rotation and verification-token flows that require transactional session creation in their own repositories.

## Worker

`createWorkerRuntime` may construct the small set of repos/use cases jobs need. When job surface grows, extract a `createAuthJobHandlers(deps)` from auth composition rather than duplicating auth.module wiring.
