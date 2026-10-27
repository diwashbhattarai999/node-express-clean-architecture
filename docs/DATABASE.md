# Database schemas

PostgreSQL schemas defined with Drizzle ORM.

**Source of truth:** [`src/infrastructure/database/drizzle/schema/`](../src/infrastructure/database/drizzle/schema/)  
**Migrations:** [`drizzle/`](../drizzle/) (`pnpm db:generate`, `pnpm db:migrate`; reset local volumes with `pnpm db:reset` after baseline reshapes)  
**Auth design:** [AUTH.md](AUTH.md)

```text
users
 ├── user_profiles
 ├── login_identities
 ├── password_credentials
 ├── external_identities
 ├── sessions
 ├── auth_tokens
 ├── mfa_factors
 ├── mfa_recovery_codes
 ├── mfa_challenges
 ├── passkeys
 ├── security_audit_logs
 ├── login_attempts
 └── user_roles → roles
```

Rules:

- `users` is the account only — no password or login identifier columns.
- Store hashes only for passwords, refresh tokens, auth tokens, recovery codes, and login-attempt identifiers.
- Access tokens are not persisted.
- Raw secrets must never be written to the database.
- OAuth `provider` is a validated `varchar` (not a DB enum) so new providers do not require enum migrations. Common keys: `google`, `github`, `apple`, `microsoft`, `oidc`.

---

## Enums

Defined in [`schema/enums.ts`](../src/infrastructure/database/drizzle/schema/enums.ts).

| Postgres type | Values |
| --- | --- |
| `user_status` | `pending_verification`, `active`, `suspended`, `disabled` |
| `login_identity_type` | `email`, `phone`, `username` |
| `auth_token_type` | `email_verification`, `phone_verification`, `password_reset`, `magic_link` |
| `mfa_factor_type` | `totp`, `sms`, `email`, `webauthn` |
| `security_event_outcome` | `success`, `failure`, `blocked` |
| `security_event_type` | `login_success`, `login_failure`, `logout`, `logout_all`, `refresh`, `refresh_reuse`, `password_change`, `password_reset`, `identity_linked`, `identity_unlinked`, `mfa_enabled`, `mfa_disabled`, `session_revoked`, `passkey_registered`, `passkey_removed`, `passkey_used` |
| `session_revocation_reason` | `logout`, `logout_all`, `rotation_reuse`, `admin`, `password_reset`, `expired` |

---

## `users`

Account row. File: [`users.schema.ts`](../src/infrastructure/database/drizzle/schema/users.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `status` | `user_status` | Default `pending_verification` |
| `display_name` | `varchar(100)` | Nullable |
| `avatar_url` | `varchar(2048)` | Nullable |
| `activated_at` | `timestamptz` | Nullable |
| `suspended_at` | `timestamptz` | Nullable |
| `disabled_at` | `timestamptz` | Nullable |
| `deleted_at` | `timestamptz` | Soft delete |
| `created_at` / `updated_at` | `timestamptz` | |

**Indexes:** `(status, created_at)`, `created_at`

---

## `user_profiles`

Optional richer profile (1:1). File: [`user-profiles.schema.ts`](../src/infrastructure/database/drizzle/schema/user-profiles.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` PK FK → `users.id` | `ON DELETE CASCADE` |
| `first_name` / `last_name` | `varchar(100)` | Nullable |
| `locale` | `varchar(35)` | Nullable |
| `timezone` | `varchar(64)` | Nullable |
| `bio` | `text` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | |

---

## `login_identities`

Normalized login identifiers. File: [`auth/login-identities.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/login-identities.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | `ON DELETE CASCADE` |
| `type` | `login_identity_type` | |
| `identifier` | `varchar(255)` | User-facing value |
| `normalized_identifier` | `varchar(255)` | Canonical lookup (email lowercased, phone E.164, username policy) |
| `verified_at` | `timestamptz` | Null = unverified |
| `is_primary` | `boolean` | Default `false` |
| `created_at` / `updated_at` | `timestamptz` | |

**Indexes:** Unique `(type, normalized_identifier)`; partial unique `(user_id, type)` where `is_primary`; `(user_id, type)`

---

## `password_credentials`

At most one password per user. File: [`auth/password-credentials.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/password-credentials.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | Unique; `ON DELETE CASCADE` |
| `password_hash` | `varchar(255)` | Argon2id |
| `password_changed_at` | `timestamptz` | |
| `created_at` / `updated_at` | `timestamptz` | |

---

## `external_identities`

OAuth/OIDC links. File: [`auth/external-identities.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/external-identities.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | `ON DELETE CASCADE` |
| `provider` | `varchar(100)` | e.g. `google`, `oidc` |
| `provider_user_id` | `varchar(255)` | Stable subject |
| `issuer` | `varchar(512)` | Nullable; required semantics for generic OIDC |
| `provider_email` | `varchar(255)` | Nullable snapshot |
| `provider_email_verified` | `boolean` | Default `false` |
| `last_used_at` | `timestamptz` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | |

**Indexes:** Unique `(provider, provider_user_id)`; partial unique `(issuer, provider_user_id)` where `issuer is not null`; `(user_id, provider)`

---

## `sessions`

Refresh-token session generations. File: [`auth/sessions.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/sessions.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | `ON DELETE CASCADE` |
| `family_id` | `uuid` | Rotation / reuse family |
| `refresh_token_hash` | `text` | Unique |
| `created_at` / `last_used_at` / `expires_at` | `timestamptz` | |
| `revoked_at` | `timestamptz` | Null = active |
| `replaced_by_session_id` | `uuid` self-FK | Set on rotation |
| `ip_address` | `inet` | Nullable |
| `user_agent` | `text` | Nullable |
| `device_name` | `varchar(255)` | Nullable |
| `revocation_reason` | `session_revocation_reason` | Nullable |

**Indexes:** Unique `refresh_token_hash`; `(user_id, revoked_at, expires_at)`; active `user_id`; `family_id`; `expires_at`; `replaced_by_session_id`

---

## `auth_tokens`

Verification / reset / magic-link tokens. File: [`auth/auth-tokens.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/auth-tokens.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | Required; `ON DELETE CASCADE` |
| `identity_id` | `uuid` FK → `login_identities.id` | Nullable |
| `type` | `auth_token_type` | |
| `token_hash` | `text` | Unique |
| `expires_at` / `consumed_at` / `revoked_at` | `timestamptz` | |
| `attempt_count` | `integer` | Default `0` |
| `created_at` | `timestamptz` | |
| `requested_ip` | `inet` | Nullable |
| `requested_user_agent` | `text` | Nullable |
| `replaced_by_token_id` | `uuid` self-FK | Resend invalidation |

**Indexes:** Unique `token_hash`; `(user_id, type, expires_at)`; partial active `(user_id, type)`; `expires_at`

---

## `mfa_factors`

Registered second factors. File: [`auth/mfa-factors.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/mfa-factors.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK → `users.id` | `ON DELETE CASCADE` |
| `type` | `mfa_factor_type` | |
| `label` | `varchar(100)` | Nullable |
| `secret_encrypted` | `text` | Opaque TOTP secret (app encryption) |
| `destination` | `varchar(255)` | Maskable SMS/email destination |
| `is_verified` | `boolean` | |
| `verified_at` / `last_used_at` / `disabled_at` | `timestamptz` | Nullable |
| `created_at` / `updated_at` | `timestamptz` | |

---

## `mfa_recovery_codes`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | `ON DELETE CASCADE` |
| `code_hash` | `text` | Unique |
| `used_at` / `revoked_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | |

**Indexes:** Unique `code_hash`; `user_id`; `(user_id, used_at)`

---

## `mfa_challenges`

Temporary MFA verification attempts. File: [`auth/mfa-challenges.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/mfa-challenges.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Required |
| `factor_id` | `uuid` FK → `mfa_factors` | Nullable |
| `session_id` | `uuid` FK → `sessions` | Nullable |
| `challenge_hash` | `text` | Nullable |
| `expires_at` / `verified_at` | `timestamptz` | |
| `attempt_count` | `integer` | Default `0` |
| `created_at` | `timestamptz` | |

**Indexes:** `(user_id, expires_at)`, `(factor_id, expires_at)`

---

## `passkeys`

WebAuthn credentials. File: [`auth/passkeys.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/passkeys.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | `ON DELETE CASCADE` |
| `credential_id` | `text` | Unique |
| `public_key` | `bytea` | |
| `sign_count` | `bigint` | Default `0` |
| `transports` | `text[]` | Nullable |
| `aaguid` | `varchar(36)` | Nullable |
| `backed_up` | `boolean` | Nullable |
| `name` | `varchar(100)` | Friendly label |
| `created_at` / `last_used_at` / `revoked_at` | `timestamptz` | |

**Indexes:** Unique `credential_id`; `(user_id, revoked_at)`

---

## `security_audit_logs`

Append-only security events. File: [`auth/security-audit-logs.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/security-audit-logs.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK | Nullable; `ON DELETE SET NULL` |
| `event_type` | `security_event_type` | |
| `outcome` | `security_event_outcome` | Required |
| `ip_address` | `inet` | Nullable |
| `user_agent` | `text` | Nullable |
| `session_id` | `uuid` | Stored id only (no FK) |
| `metadata` | `jsonb` | Sanitized, non-secret |
| `created_at` | `timestamptz` | |

**Indexes:** `(user_id, created_at)`, `(event_type, created_at)`, `created_at`

---

## `login_attempts`

Durable login analytics (not the sole rate limiter). File: [`auth/login-attempts.schema.ts`](../src/infrastructure/database/drizzle/schema/auth/login-attempts.schema.ts).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `identifier_hash` | `text` | HMAC of normalized identifier (app) |
| `user_id` | `uuid` FK | Nullable |
| `outcome` | `security_event_outcome` | |
| `reason` | `varchar(100)` | Sanitized |
| `ip_address` | `inet` | Nullable |
| `created_at` | `timestamptz` | |

**Indexes:** `(identifier_hash, created_at)`, `(ip_address, created_at)`

---

## `roles` / `user_roles`

Authorization stubs (no seeded rows). Files under [`authorization/`](../src/infrastructure/database/drizzle/schema/authorization/).

### `roles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `key` | `varchar(64)` | Unique stable key |
| `name` | `varchar(100)` | |
| `description` | `varchar(255)` | Nullable |
| `created_at` | `timestamptz` | |

### `user_roles`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | `uuid` FK → `users` | Composite PK with `role_id` |
| `role_id` | `uuid` FK → `roles` | |
| `assigned_at` | `timestamptz` | |
| `assigned_by` | `uuid` FK → `users` | Nullable |

---

## File layout

```text
src/infrastructure/database/drizzle/schema/
  enums.ts
  helpers.ts
  users.schema.ts
  user-profiles.schema.ts
  index.ts
  auth/
    login-identities.schema.ts
    password-credentials.schema.ts
    external-identities.schema.ts
    sessions.schema.ts
    auth-tokens.schema.ts
    mfa-factors.schema.ts
    mfa-recovery-codes.schema.ts
    mfa-challenges.schema.ts
    passkeys.schema.ts
    security-audit-logs.schema.ts
    login-attempts.schema.ts
  authorization/
    roles.schema.ts
    user-roles.schema.ts
```

Drizzle Kit loads `enums.ts` plus `**/*.schema.ts` (see [`drizzle.config.ts`](../drizzle.config.ts)).
