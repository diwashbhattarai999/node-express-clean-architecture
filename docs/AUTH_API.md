# Authentication & authorization API contracts

Normative HTTP contracts for auth, account management, RBAC, admin, audit, and future MFA/passkeys.

**Related:** [AUTH.md](AUTH.md) (design), [DATABASE.md](DATABASE.md) (DDL), [AUTH_FRONTEND.md](AUTH_FRONTEND.md) (implemented endpoints for frontend).  
**Status:** Full planned contract; see AUTH_FRONTEND.md for what is live today.  
**Prefix:** `/api/v1` unless noted. Priorities: **P0** core · **P1** important · **P2** future.

---

## 1. Conventions

### 1.1 Response envelope

Success:

```json
{
  "success": true,
  "message": "Human-readable summary.",
  "data": {}
}
```

Success with pagination meta:

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": {
    "totalRecords": 0,
    "perPage": 10,
    "currentPage": 1,
    "totalPages": 0,
    "pagingCounter": 1,
    "hasPrevious": false,
    "hasNext": false,
    "prev": null,
    "next": null,
    "recordShown": 0
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Human-readable summary.",
  "code": "ERROR_CODE",
  "requestId": "uuid",
  "details": null
}
```

`details` is used for field-level validation (`422 VALIDATION_ERROR`).

### 1.2 Pagination & sorting (list endpoints)

| Query | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | int ≥ 1 | `1` | |
| `limit` | int 1–100 | `10` | |
| `sortBy` | string | endpoint-specific | |
| `sortOrder` | `asc` \| `desc` | `desc` | |

### 1.3 Authentication modes

| Mode | Meaning |
| --- | --- |
| `public` | No credentials |
| `bearer` | `Authorization: Bearer <access_jwt>` |
| `refresh` | Refresh cookie and/or body (see tokens) |
| `bearer + permission:<key>` | Authenticated **and** effective permission |

Access JWT TTL: **10 minutes** (claims: `sub`, `sid`, `iss`, `aud`, `iat`, `exp`, `jti` — see AUTH.md).

### 1.4 Refresh tokens (web + native)

- Opaque random token; **hash only** in DB; rotate on every refresh; reuse → revoke `family_id`.
- TTL: **30 days** (configurable later).
- **Browser:** `Set-Cookie: refresh_token=<raw>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`
- **Native:** may also receive `refreshToken` in JSON `data`; send it back in body on refresh/logout.
- Prefer cookie when present; otherwise use body `refreshToken`.

### 1.5 CSRF (cookie clients)

For browser calls that use the refresh cookie (`/auth/refresh`, `/auth/logout`, `/auth/logout-all`, session revoke that rely on cookie): require `X-CSRF-Token` matching a non-HttpOnly CSRF cookie (double-submit), or an equivalent documented scheme. Bearer-only native clients skip CSRF.

### 1.6 Anti-enumeration

Login, password forgot, identifier check, and magic-link request must not reveal whether an account/identifier exists (generic messages / uniform timing where practical).

### 1.7 Auth error codes (in addition to shared codes)

| Code | Typical HTTP | When |
| --- | --- | --- |
| `INVALID_CREDENTIALS` | 401 | Bad password/identifier (generic) |
| `EMAIL_NOT_VERIFIED` | 403 | Login blocked pending verification |
| `ACCOUNT_SUSPENDED` | 403 | User `suspended` |
| `ACCOUNT_DISABLED` | 403 | User `disabled` |
| `TOKEN_EXPIRED` | 401 | Access/refresh/auth token expired |
| `TOKEN_INVALID` | 401 | Malformed or unknown token |
| `TOKEN_REUSED` | 401 | Refresh reuse detected |
| `TOKEN_REVOKED` | 401 | Session/token revoked |
| `MFA_REQUIRED` | 403 | Login needs MFA challenge (future) |
| `STEP_UP_REQUIRED` | 403 | Sensitive action needs step-up (future) |
| `OAUTH_STATE_INVALID` | 400 | Bad OAuth state/PKCE |
| `LAST_AUTH_METHOD` | 409 | Cannot unlink last viable method |
| `PERMISSION_DENIED` | 403 | Missing permission |

Shared: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `CONFLICT` (409), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `TOO_MANY_REQUESTS` (429).

### 1.8 Schema prerequisites (RBAC)

Admin permission APIs require future tables `permissions` and `role_permissions` (see DATABASE.md / AUTH.md). Permission **keys** below are normative for the API.

---

## 2. Shared types

### `UserPublic`

```ts
{
  id: string;                 // uuid
  status: "pending_verification" | "active" | "suspended" | "disabled";
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;       // primary verified email if any
  username: string | null;    // if set
  createdAt: string;          // ISO-8601
  updatedAt: string;
}
```

### `UserProfile`

```ts
{
  firstName: string | null;
  lastName: string | null;
  locale: string | null;
  timezone: string | null;
  bio: string | null;
}
```

### `AuthTokensData`

```ts
{
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;          // seconds
  refreshToken?: string;      // native; omit when cookie-only
  user?: UserPublic;          // included on login/register/oauth when useful
}
```

### `SessionSummary`

```ts
{
  id: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  isCurrent: boolean;
}
```

### `LoginIdentity`

```ts
{
  id: string;
  type: "email" | "phone" | "username";
  identifier: string;         // display form
  verifiedAt: string | null;
  isPrimary: boolean;
  createdAt: string;
}
```

### `OAuthAccount`

```ts
{
  id: string;
  provider: string;           // google | github | apple | microsoft | oidc | ...
  providerEmail: string | null;
  linkedAt: string;           // createdAt
  lastUsedAt: string | null;
}
```

### `Role`

```ts
{
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
}
```

### `Permission`

```ts
{
  id: string;
  key: string;                // e.g. users.read
  name: string;
  description: string | null;
}
```

### `SecurityEvent`

```ts
{
  id: string;
  eventType: string;
  outcome: "success" | "failure" | "blocked";
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
```

### `AuthProviderPublic`

```ts
{
  id: string;                 // provider key
  name: string;
  type: "oauth" | "oidc" | "password" | "magic_link";
  enabled: boolean;
}
```

---

## 3. Authentication & account lifecycle

### 3.1 Register account — P0

`POST /api/v1/auth/register` · **Auth:** public

**Body**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string (email) | one of email/phone | Normalized lowercase |
| `phone` | string (E.164) | one of email/phone | |
| `password` | string | yes | Policy: 8–128, upper/lower/digit/special |
| `confirmPassword` | string | yes | Must match `password` |
| `displayName` | string | no | max 100 |

**Response** `201` `data`: `{ user: UserPublic }` — no session; status `pending_verification`.

**Errors:** `409 CONFLICT` (identity taken), `422 VALIDATION_ERROR`, `429`.

---

### 3.2 Verify email — P0

`POST /api/v1/auth/email/verify` · **Auth:** public

**Body:** `{ "token": string }`

**Response** `200` `data`: `{ user: UserPublic, ...AuthTokensData }` — activates account when requirements met; may issue session.

**Errors:** `401 TOKEN_INVALID` / `TOKEN_EXPIRED`, `422`.

---

### 3.3 Resend email verification — P0

`POST /api/v1/auth/email/verification/resend` · **Auth:** public

**Body:** `{ "email": string }`

**Response** `200` `data`: `null` — always same message (anti-enumeration).

**Errors:** `422`, `429`.

---

### 3.4 Verify phone — P1

`POST /api/v1/auth/phone/verify` · **Auth:** public

**Body:** `{ "phone": string, "code": string }` — 6-digit OTP.

**Response** `200` `data`: `{ user: UserPublic, ...AuthTokensData? }`

**Errors:** `401 TOKEN_INVALID`, `429` (attempt limit), `422`.

---

### 3.5 Resend phone verification — P1

`POST /api/v1/auth/phone/verification/resend` · **Auth:** public

**Body:** `{ "phone": string }`

**Response** `200` `data`: `null`

---

### 3.6 Login — P0

`POST /api/v1/auth/login` · **Auth:** public

**Body**

| Field | Type | Required |
| --- | --- | --- |
| `identifier` | string | yes — email, username, or phone |
| `password` | string | yes |

**Response** `200` `data`: `AuthTokensData` including `user` + `Set-Cookie` refresh.

**Errors:** `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` / `ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`, `403 MFA_REQUIRED` (future), `429`.

---

### 3.7 Refresh access token — P0

`POST /api/v1/auth/refresh` · **Auth:** refresh (+ CSRF if cookie)

**Body (optional native):** `{ "refreshToken"?: string }`

**Response** `200` `data`: `AuthTokensData` (rotated refresh cookie/body).

**Errors:** `401 TOKEN_INVALID` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` / `TOKEN_REUSED`.

---

### 3.8 Logout current session — P0

`POST /api/v1/auth/logout` · **Auth:** refresh and/or bearer (+ CSRF if cookie)

**Body (optional):** `{ "refreshToken"?: string }`

**Response** `200` `data`: `null` — clears refresh cookie.

---

### 3.9 Logout all sessions — P1

`POST /api/v1/auth/logout-all` · **Auth:** bearer (+ CSRF if also clearing cookie)

**Response** `200` `data`: `{ "revokedCount": number }`

---

### 3.10 Current authenticated user — P0

`GET /api/v1/auth/me` · **Auth:** bearer

**Response** `200` `data`: `{ user: UserPublic, roles: string[], permissions: string[] }`

---

### 3.11 Check identifier availability — P2

`POST /api/v1/auth/identifiers/check` · **Auth:** public (rate-limited)

**Body:** `{ "type": "email" | "phone" | "username", "identifier": string }`

**Response** `200` `data`: `{ "available": boolean }` — may always return `available: true` publicly and rely on register conflict; prefer generic response under anti-enumeration policy.

---

### 3.12 Request password reset — P0

`POST /api/v1/auth/password/forgot` · **Auth:** public

**Body:** `{ "email": string }`

**Response** `200` `data`: `null` — always success message.

---

### 3.13 Validate password-reset token — P1

`POST /api/v1/auth/password/reset/validate` · **Auth:** public

**Body:** `{ "token": string }`

**Response** `200` `data`: `{ "valid": boolean, "expiresAt"?: string }`

---

### 3.14 Reset password — P0

`POST /api/v1/auth/password/reset` · **Auth:** public

**Body:** `{ "token": string, "password": string, "confirmPassword": string }`

**Response** `200` `data`: `null` — revokes **all** sessions.

**Errors:** `401 TOKEN_`*, `422`.

---

### 3.15 Change password (authenticated) — P1

`POST /api/v1/auth/password/change` · **Auth:** bearer

**Body:** `{ "currentPassword": string, "password": string, "confirmPassword": string }`

**Response** `200` `data`: `null` — optionally revoke other sessions; keep current if product chooses (document: **revoke all other sessions**).

**Errors:** `401 INVALID_CREDENTIALS` (wrong current), `422`.

---

### 3.16 Change or add username — P1

`PATCH /api/v1/users/me/username` · **Auth:** bearer

**Body:** `{ "username": string }` — normalized uniqueness.

**Response** `200` `data`: `{ user: UserPublic }`

**Errors:** `409 CONFLICT`, `422`.

---

### 3.17 Request magic link — P2

`POST /api/v1/auth/magic-link/request` · **Auth:** public

**Body:** `{ "email": string }`

**Response** `200` `data`: `null`

---

### 3.18 Consume magic link — P2

`POST /api/v1/auth/magic-link/consume` · **Auth:** public

**Body:** `{ "token": string }`

**Response** `200` `data`: `AuthTokensData` with `user`

---

## 4. Session & device management

### 4.1 List sessions — P1

`GET /api/v1/auth/sessions` · **Auth:** bearer

**Query:** pagination; `includeRevoked` boolean default `false`.

**Response** `200` `data`: `SessionSummary[]` + `meta`

---

### 4.2 Get session — P1

`GET /api/v1/auth/sessions/{sessionId}` · **Auth:** bearer (own session only)

**Response** `200` `data`: `SessionSummary`

**Errors:** `404 NOT_FOUND`

---

### 4.3 Revoke session — P1

`DELETE /api/v1/auth/sessions/{sessionId}` · **Auth:** bearer

**Response** `200` `data`: `null`

---

### 4.4 Revoke all other sessions — P1

`POST /api/v1/auth/sessions/revoke-others` · **Auth:** bearer

**Response** `200` `data`: `{ "revokedCount": number }`

---

### 4.5 Update session label — P2

`PATCH /api/v1/auth/sessions/{sessionId}` · **Auth:** bearer

**Body:** `{ "deviceName": string }` max 255

**Response** `200` `data`: `SessionSummary`

---

## 5. User profile & login identities

### 5.1 Get own profile — P0

`GET /api/v1/users/me` · **Auth:** bearer

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile }`

---

### 5.2 Update own profile — P1

`PATCH /api/v1/users/me` · **Auth:** bearer

**Body (all optional):** `displayName`, `avatarUrl`, `firstName`, `lastName`, `locale`, `timezone`, `bio`

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile }`

---

### 5.3 List login identities — P1

`GET /api/v1/users/me/identities` · **Auth:** bearer

**Response** `200` `data`: `LoginIdentity[]`

---

### 5.4 Add email — P1

`POST /api/v1/users/me/emails` · **Auth:** bearer

**Body:** `{ "email": string }`

**Response** `201` `data`: `LoginIdentity` — sends verification; `verifiedAt` null.

**Errors:** `409 CONFLICT`

---

### 5.5 Verify newly added email — P1

`POST /api/v1/users/me/emails/verify` · **Auth:** bearer or public with token

**Body:** `{ "token": string }`

**Response** `200` `data`: `LoginIdentity`

---

### 5.6 Remove email — P1

`DELETE /api/v1/users/me/emails/{identityId}` · **Auth:** bearer

**Response** `200` `data`: `null`

**Errors:** `409 LAST_AUTH_METHOD`, `404`

---

### 5.7 Add phone — P2

`POST /api/v1/users/me/phones` · **Auth:** bearer

**Body:** `{ "phone": string }`

**Response** `201` `data`: `LoginIdentity`

---

### 5.8 Remove phone — P2

`DELETE /api/v1/users/me/phones/{identityId}` · **Auth:** bearer

**Response** `200` `data`: `null`

**Errors:** `409 LAST_AUTH_METHOD`

---

### 5.9 Request account deletion — P1

`POST /api/v1/users/me/deletion-request` · **Auth:** bearer

**Body (optional):** `{ "password"?: string, "reason"?: string }`

**Response** `200` `data`: `{ "scheduledFor": string }` — soft-delete / grace period policy; sets deletion markers.

---

### 5.10 Cancel account deletion — P1

`POST /api/v1/users/me/deletion-request/cancel` · **Auth:** bearer

**Response** `200` `data`: `null`

---

## 6. OAuth 2.0 / OIDC

Providers: `google`, `github`, `apple`, `microsoft`, generic `oidc`. Native: Authorization Code + **PKCE**. Never auto-merge on email match.

### 6.1 Start provider auth — P1

`GET /api/v1/auth/oauth/{provider}/authorize` · **Auth:** public

**Path:** `provider` string

**Query**

| Param | Required | Notes |
| --- | --- | --- |
| `redirectUri` | yes | Allow-listed |
| `state` | yes | CSRF |
| `codeChallenge` | native | S256 |
| `codeChallengeMethod` | native | `S256` |
| `intent` | no | `login` \| `link` default `login` |

**Response** `302` to IdP (or `200` `{ "authorizationUrl": string }` if `?response=json`).

---

### 6.2 Provider callback — P1

`GET /api/v1/auth/oauth/{provider}/callback` · **Auth:** public

**Query:** `code`, `state`, error params from IdP

**Response** `302` to app with session cookie set, or JSON `AuthTokensData` for configured SPA callback mode.

**Errors:** `400 OAUTH_STATE_INVALID`, `409 CONFLICT` (identity linked elsewhere).

---

### 6.3 Exchange native code — P1

`POST /api/v1/auth/oauth/{provider}/exchange` · **Auth:** public

**Body:** `{ "code": string, "codeVerifier": string, "redirectUri": string, "state": string }`

**Response** `200` `data`: `AuthTokensData` with `user`

---

### 6.4 List linked OAuth accounts — P1

`GET /api/v1/users/me/oauth-accounts` · **Auth:** bearer

**Response** `200` `data`: `OAuthAccount[]`

---

### 6.5 Start linking OAuth — P1

`GET /api/v1/users/me/oauth-accounts/{provider}/authorize` · **Auth:** bearer

Same query as 6.1 with `intent=link`.

**Response** `302` or `{ "authorizationUrl": string }`

---

### 6.6 Complete OAuth link — P1

`POST /api/v1/users/me/oauth-accounts/{provider}/link` · **Auth:** bearer

**Body:** `{ "code": string, "codeVerifier"?: string, "redirectUri": string, "state": string }`

**Response** `200` `data`: `OAuthAccount`

---

### 6.7 Unlink OAuth — P1

`DELETE /api/v1/users/me/oauth-accounts/{provider}` · **Auth:** bearer

**Response** `200` `data`: `null`

**Errors:** `409 LAST_AUTH_METHOD`

---

### 6.8 List auth providers — P1

`GET /api/v1/auth/providers` · **Auth:** public

**Response** `200` `data`: `AuthProviderPublic[]`

---

## 7. RBAC — roles & permissions

Suggested permission keys: `users.read`, `users.update`, `users.suspend`, `users.delete`, `roles.read`, `roles.create`, `roles.update`, `roles.delete`, `roles.assign`, `permissions.read`, `permissions.assign`, `sessions.read`, `sessions.revoke`, `audit_logs.read`, `audit_logs.export`.

### 7.1 My roles — P0

`GET /api/v1/authz/me/roles` · **Auth:** bearer

**Response** `200` `data`: `Role[]` (or `{ key, name }[]`)

---

### 7.2 My effective permissions — P0

`GET /api/v1/authz/me/permissions` · **Auth:** bearer

**Response** `200` `data`: `{ "permissions": string[] }`

---

### 7.3 Check permission — P1

`POST /api/v1/authz/check` · **Auth:** bearer

**Body:** `{ "permission": string, "resourceId"?: string }`

**Response** `200` `data`: `{ "allowed": boolean }`

---

### 7.4 List roles — P1

`GET /api/v1/admin/roles` · **Auth:** bearer + `roles.read`

**Query:** pagination, `search?`

**Response** `200` `data`: `Role[]` + `meta`

---

### 7.5 Get role — P1

`GET /api/v1/admin/roles/{roleId}` · **Auth:** bearer + `roles.read`

**Response** `200` `data`: `{ role: Role, permissions: Permission[] }`

---

### 7.6 Create role — P1

`POST /api/v1/admin/roles` · **Auth:** bearer + `roles.create`

**Body:** `{ "key": string, "name": string, "description"?: string }`

**Response** `201` `data`: `Role`

---

### 7.7 Update role — P1

`PATCH /api/v1/admin/roles/{roleId}` · **Auth:** bearer + `roles.update`

**Body:** `{ "name"?: string, "description"?: string }` — `key` immutable.

**Response** `200` `data`: `Role`

---

### 7.8 Delete role — P1

`DELETE /api/v1/admin/roles/{roleId}` · **Auth:** bearer + `roles.delete`

**Response** `200` `data`: `null`

**Errors:** `409` if role assigned and policy forbids delete.

---

### 7.9 List permissions — P1

`GET /api/v1/admin/permissions` · **Auth:** bearer + `permissions.read`

**Query:** pagination, `search?`

**Response** `200` `data`: `Permission[]` + `meta`

---

### 7.10 Get permission — P2

`GET /api/v1/admin/permissions/{permissionId}` · **Auth:** bearer + `permissions.read`

**Response** `200` `data`: `Permission`

---

### 7.11 Assign permissions to role — P1

`PUT /api/v1/admin/roles/{roleId}/permissions` · **Auth:** bearer + `permissions.assign`

**Body:** `{ "permissionIds": string[] }` — full replace set.

**Response** `200` `data`: `Permission[]`

---

### 7.12 Remove permission from role — P1

`DELETE /api/v1/admin/roles/{roleId}/permissions/{permissionId}` · **Auth:** bearer + `permissions.assign`

**Response** `200` `data`: `null`

---

### 7.13 List users for role — P2

`GET /api/v1/admin/roles/{roleId}/users` · **Auth:** bearer + `roles.read`

**Query:** pagination

**Response** `200` `data`: `UserPublic[]` + `meta`

---

### 7.14 List roles for user — P1

`GET /api/v1/admin/users/{userId}/roles` · **Auth:** bearer + `roles.read`

**Response** `200` `data`: `Role[]`

---

### 7.15 Assign role to user — P1

`POST /api/v1/admin/users/{userId}/roles` · **Auth:** bearer + `roles.assign`

**Body:** `{ "roleId": string }`

**Response** `201` `data`: `Role`

---

### 7.16 Remove role from user — P1

`DELETE /api/v1/admin/users/{userId}/roles/{roleId}` · **Auth:** bearer + `roles.assign`

**Response** `200` `data`: `null`

---

### 7.17 Replace user roles — P2

`PUT /api/v1/admin/users/{userId}/roles` · **Auth:** bearer + `roles.assign`

**Body:** `{ "roleIds": string[] }`

**Response** `200` `data`: `Role[]`

---

### 7.18 User effective permissions (admin) — P2

`GET /api/v1/admin/users/{userId}/permissions` · **Auth:** bearer + `permissions.read`

**Response** `200` `data`: `{ "permissions": string[] }`

---

## 8. Administrative user management

All require bearer + listed permission. Mutating actions should write `security_audit_logs`.

### 8.1 List users — P1

`GET /api/v1/admin/users` · **Auth:** bearer + `users.read`

**Query:** pagination; `search?`; `status?`; `sortBy` = `createdAt`  `displayName`  `status`; `sortOrder`

**Response** `200` `data`: `UserPublic[]` + `meta`

---

### 8.2 Get user — P1

`GET /api/v1/admin/users/{userId}` · **Auth:** bearer + `users.read`

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile, roles: Role[], identities: LoginIdentity[] }`

---

### 8.3 Update user — P1

`PATCH /api/v1/admin/users/{userId}` · **Auth:** bearer + `users.update`

**Body (optional):** `displayName`, `avatarUrl`, profile fields

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile }`

---

### 8.4 Suspend user — P1

`POST /api/v1/admin/users/{userId}/suspend` · **Auth:** bearer + `users.suspend`

**Body (optional):** `{ "reason"?: string }`

**Response** `200` `data`: `UserPublic` — sets `status=suspended`, `suspendedAt`; revoke sessions recommended.

---

### 8.5 Reactivate user — P1

`POST /api/v1/admin/users/{userId}/reactivate` · **Auth:** bearer + `users.suspend`

**Response** `200` `data`: `UserPublic` — `status=active`, clear `suspendedAt`.

---

### 8.6 Disable user — P1

`POST /api/v1/admin/users/{userId}/disable` · **Auth:** bearer + `users.delete` (or dedicated disable permission; use `users.suspend` until split)

**Body (optional):** `{ "reason"?: string }`

**Response** `200` `data`: `UserPublic` — `status=disabled`, `disabledAt`.

---

### 8.7 Enable user — P1

`POST /api/v1/admin/users/{userId}/enable` · **Auth:** bearer + `users.suspend`

**Response** `200` `data`: `UserPublic`

---

### 8.8 Revoke all user sessions — P1

`POST /api/v1/admin/users/{userId}/sessions/revoke-all` · **Auth:** bearer + `sessions.revoke`

**Response** `200` `data`: `{ "revokedCount": number }`

---

### 8.9 Admin-initiated password reset — P2

`POST /api/v1/admin/users/{userId}/password-reset` · **Auth:** bearer + `users.update`

**Response** `200` `data`: `null` — emails reset link; does not return raw token.

---

### 8.10 Permanently delete user — P2

`DELETE /api/v1/admin/users/{userId}` · **Auth:** bearer + `users.delete`

**Query:** `hard=true` required for irreversible delete.

**Response** `200` `data`: `null`

---

## 9. Security events, audit, config, health

### 9.1 Own security activity — P1

`GET /api/v1/users/me/security-events` · **Auth:** bearer

**Query:** pagination; `eventType?`; `from?` / `to?` ISO dates

**Response** `200` `data`: `SecurityEvent[]` + `meta` — sanitized metadata only.

---

### 9.2 Admin audit logs — P1

`GET /api/v1/admin/audit-logs` · **Auth:** bearer + `audit_logs.read`

**Query:** pagination; `userId?`; `eventType?`; `outcome?`; `from?`; `to?`

**Response** `200` `data`: `SecurityEvent[]` + `meta`

---

### 9.3 Audit log detail — P2

`GET /api/v1/admin/audit-logs/{eventId}` · **Auth:** bearer + `audit_logs.read`

**Response** `200` `data`: `SecurityEvent`

---

### 9.4 Export audit logs — P2

`POST /api/v1/admin/audit-logs/exports` · **Auth:** bearer + `audit_logs.export`

**Body:** `{ "from": string, "to": string, "format": "csv" | "json", "filters"?: object }`

**Response** `202` `data`: `{ "exportId": string, "status": "pending" }` — async job pattern.

---

### 9.5 Auth config / capabilities — P1

`GET /api/v1/auth/config` · **Auth:** public

**Response** `200` `data`:

```ts
{
  passwordPolicy: { minLength: 8; requireUppercase: true; requireLowercase: true; requireDigit: true; requireSpecial: true };
  features: {
    registration: boolean;
    oauth: boolean;
    magicLink: boolean;
    mfa: boolean;
    passkeys: boolean;
    phoneAuth: boolean;
  };
  providers: AuthProviderPublic[];
}
```

---

### 9.6 Health — P0 (implemented)

`GET /health` · **Auth:** public · **Note:** root path (not under `/api/v1`).

**Response** `200` `data`: `{ "status": "ok" }`

---

### 9.7 Readiness — P1 (implemented)

`GET /ready` · **Auth:** public · **Note:** root path.

**Response** `200` when Postgres + Redis healthy; else `503`.

---

## 10. MFA, passkeys, step-up — P2 (future)

Contracts below are planning-level; WebAuthn payloads follow the chosen library.

### 10.1 MFA status — #77

`GET /api/v1/users/me/mfa` · **Auth:** bearer  
**Response** `200` `data`: `{ enabled: boolean, factors: { id, type, label, verifiedAt }[] }`

### 10.2 Begin MFA enroll — #78

`POST /api/v1/users/me/mfa/enroll` · **Auth:** bearer (+ step-up later)  
**Body:** `{ "type": "totp" | "sms" | "email", "destination"?: string }`  
**Response** `200` `data`: `{ factorId, secret?: string, otpauthUrl?: string }` (TOTP)

### 10.3 Confirm MFA enroll — #79

`POST /api/v1/users/me/mfa/enroll/confirm` · **Auth:** bearer  
**Body:** `{ "factorId": string, "code": string }`  
**Response** `200` `data`: `{ recoveryCodes: string[] }` — show once

### 10.4 Disable MFA — #80

`DELETE /api/v1/users/me/mfa` · **Auth:** bearer + step-up  
**Body:** `{ "code"?: string, "password"?: string }`  
**Response** `200` `data`: `null`

### 10.5 Begin MFA challenge — #81

`POST /api/v1/auth/mfa/challenge` · **Auth:** public (continuation token from login)  
**Body:** `{ "mfaToken": string, "factorId"?: string }`  
**Response** `200` `data`: `{ challengeId, expiresAt }`

### 10.6 Verify MFA challenge — #82

`POST /api/v1/auth/mfa/challenge/verify` · **Auth:** public  
**Body:** `{ "challengeId": string, "code": string }`  
**Response** `200` `data`: `AuthTokensData`

### 10.7 Regenerate recovery codes — #83

`POST /api/v1/users/me/mfa/recovery-codes/regenerate` · **Auth:** bearer + step-up  
**Response** `200` `data`: `{ recoveryCodes: string[] }`

### 10.8 List passkeys — #84

`GET /api/v1/users/me/passkeys` · **Auth:** bearer  
**Response** `200` `data`: `{ id, name, createdAt, lastUsedAt }[]`

### 10.9 Passkey register options — #85

`POST /api/v1/users/me/passkeys/register/options` · **Auth:** bearer  
**Response** `200` `data`: WebAuthn `PublicKeyCredentialCreationOptions` JSON

### 10.10 Passkey register verify — #86

`POST /api/v1/users/me/passkeys/register/verify` · **Auth:** bearer  
**Body:** WebAuthn attestation response + `{ "name"?: string }`  
**Response** `201` `data`: `{ id, name, createdAt }`

### 10.11 Passkey login options — #87

`POST /api/v1/auth/passkeys/login/options` · **Auth:** public  
**Body:** `{ "identifier"?: string }`  
**Response** `200` `data`: WebAuthn `PublicKeyCredentialRequestOptions` JSON

### 10.12 Passkey login verify — #88

`POST /api/v1/auth/passkeys/login/verify` · **Auth:** public  
**Body:** WebAuthn assertion response  
**Response** `200` `data`: `AuthTokensData`

### 10.13 Rename passkey — #89

`PATCH /api/v1/users/me/passkeys/{passkeyId}` · **Auth:** bearer  
**Body:** `{ "name": string }`  
**Response** `200` `data`: `{ id, name, ... }`

### 10.14 Delete passkey — #90

`DELETE /api/v1/users/me/passkeys/{passkeyId}` · **Auth:** bearer + step-up  
**Response** `200` `data`: `null`  
**Errors:** `409 LAST_AUTH_METHOD`

### 10.15 Step-up challenge — #91

`POST /api/v1/auth/step-up/challenge` · **Auth:** bearer  
**Body:** `{ "method": "password" | "mfa" | "passkey" }`  
**Response** `200` `data`: method-specific challenge payload + `stepUpId`

### 10.16 Step-up verify — #92

`POST /api/v1/auth/step-up/verify` · **Auth:** bearer  
**Body:** `{ "stepUpId": string, "password"?: string, "code"?: string, ... }`  
**Response** `200` `data`: `{ "stepUpToken": string, "expiresIn": number }` — short-lived elevation claim/header

---

## 11. Permission matrix (protected endpoints)

| Endpoint group | Permission(s) |
| --- | --- |
| `GET/PATCH /users/me`, identities, deletion | authenticated only |
| `GET /authz/me/*`, `POST /authz/check` | authenticated only |
| `GET /admin/users`, `GET /admin/users/{id}` | `users.read` |
| `PATCH /admin/users/{id}`, password-reset | `users.update` |
| suspend / reactivate / enable / disable | `users.suspend` (disable may also require `users.delete`) |
| `DELETE /admin/users/{id}` | `users.delete` |
| `POST .../sessions/revoke-all` | `sessions.revoke` |
| role CRUD | `roles.read` / `create` / `update` / `delete` |
| assign roles | `roles.assign` |
| permissions list/get | `permissions.read` |
| assign permissions to role | `permissions.assign` |
| audit list/detail | `audit_logs.read` |
| audit export | `audit_logs.export` |

---

## 12. Implementation order

| Phase | Scope | APIs |
| --- | --- | --- |
| 1 | Core accounts & credentials | #1–10, #12, #14 |
| 2 | Sessions & account management | #19–33 |
| 3 | RBAC (+ `permissions` / `role_permissions` DDL) | #42–59 |
| 4 | Admin, audit, hardening | #60–76 |
| 5 | OAuth & passwordless | #11, #17–18, #34–41 |
| 6 | MFA & passkeys | #77–92 |

---

## 13. Endpoint index

| #   | Method | Path                                                      | Priority | Status                                         |
| --- | ------ | --------------------------------------------------------- | -------- | ---------------------------------------------- |
| 1   | POST   | `/api/v1/auth/register`                                   | P0       | Done                                           |
| 2   | POST   | `/api/v1/auth/email/verify`                               | P0       | Done                                           |
| 3   | POST   | `/api/v1/auth/email/verification/resend`                  | P0       | Done                                           |
| 4   | POST   | `/api/v1/auth/phone/verify`                               | P1       | Partially Done (SMS provider integration left) |
| 5   | POST   | `/api/v1/auth/phone/verification/resend`                  | P1       | Partially Done                                 |
| 6   | POST   | `/api/v1/auth/login`                                      | P0       | Done                                           |
| 7   | POST   | `/api/v1/auth/refresh`                                    | P0       | Done                                           |
| 8   | POST   | `/api/v1/auth/logout`                                     | P0       | Done                                           |
| 9   | POST   | `/api/v1/auth/logout-all`                                 | P1       | Done                                           |
| 10  | GET    | `/api/v1/auth/me`                                         | P0       | Done                                           |
| 11  | POST   | `/api/v1/auth/identifiers/check`                          | P2       |                                                |
| 12  | POST   | `/api/v1/auth/password/forgot`                            | P0       | Done                                           |
| 13  | POST   | `/api/v1/auth/password/reset/validate`                    | P1       | Done                                           |
| 14  | POST   | `/api/v1/auth/password/reset`                             | P0       | Done                                           |
| 15  | POST   | `/api/v1/auth/password/change`                            | P1       | Done                                           |
| 16  | PATCH  | `/api/v1/users/me/username`                               | P1       | Done                                           |
| 17  | POST   | `/api/v1/auth/magic-link/request`                         | P2       |                                                |
| 18  | POST   | `/api/v1/auth/magic-link/consume`                         | P2       |                                                |
| 19  | GET    | `/api/v1/auth/sessions`                                   | P1       | Done                                           |
| 20  | GET    | `/api/v1/auth/sessions/{sessionId}`                       | P1       | Done                                           |
| 21  | DELETE | `/api/v1/auth/sessions/{sessionId}`                       | P1       | Done                                           |
| 22  | POST   | `/api/v1/auth/sessions/revoke-others`                     | P1       | Done                                           |
| 23  | PATCH  | `/api/v1/auth/sessions/{sessionId}`                       | P2       |                                                |
| 24  | GET    | `/api/v1/users/me`                                        | P0       | Done                                           |
| 25  | PATCH  | `/api/v1/users/me`                                        | P1       | Done                                           |
| 26  | GET    | `/api/v1/users/me/identities`                             | P1       | Done                                           |
| 27  | POST   | `/api/v1/users/me/emails`                                 | P1       | Done                                           |
| 28  | POST   | `/api/v1/users/me/emails/verify`                          | P1       | Done                                           |
| 29  | DELETE | `/api/v1/users/me/emails/{identityId}`                    | P1       | Done                                           |
| 30  | POST   | `/api/v1/users/me/phones`                                 | P2       |                                                |
| 31  | DELETE | `/api/v1/users/me/phones/{identityId}`                    | P2       |                                                |
| 32  | POST   | `/api/v1/users/me/deletion-request`                       | P1       |                                                |
| 33  | POST   | `/api/v1/users/me/deletion-request/cancel`                | P1       |                                                |
| 34  | GET    | `/api/v1/auth/oauth/{provider}/authorize`                 | P1       |                                                |
| 35  | GET    | `/api/v1/auth/oauth/{provider}/callback`                  | P1       |                                                |
| 36  | POST   | `/api/v1/auth/oauth/{provider}/exchange`                  | P1       |                                                |
| 37  | GET    | `/api/v1/users/me/oauth-accounts`                         | P1       |                                                |
| 38  | GET    | `/api/v1/users/me/oauth-accounts/{provider}/authorize`    | P1       |                                                |
| 39  | POST   | `/api/v1/users/me/oauth-accounts/{provider}/link`         | P1       |                                                |
| 40  | DELETE | `/api/v1/users/me/oauth-accounts/{provider}`              | P1       |                                                |
| 41  | GET    | `/api/v1/auth/providers`                                  | P1       |                                                |
| 42  | GET    | `/api/v1/authz/me/roles`                                  | P0       |                                                |
| 43  | GET    | `/api/v1/authz/me/permissions`                            | P0       |                                                |
| 44  | POST   | `/api/v1/authz/check`                                     | P1       |                                                |
| 45  | GET    | `/api/v1/admin/roles`                                     | P1       |                                                |
| 46  | GET    | `/api/v1/admin/roles/{roleId}`                            | P1       |                                                |
| 47  | POST   | `/api/v1/admin/roles`                                     | P1       |                                                |
| 48  | PATCH  | `/api/v1/admin/roles/{roleId}`                            | P1       |                                                |
| 49  | DELETE | `/api/v1/admin/roles/{roleId}`                            | P1       |                                                |
| 50  | GET    | `/api/v1/admin/permissions`                               | P1       |                                                |
| 51  | GET    | `/api/v1/admin/permissions/{permissionId}`                | P2       |                                                |
| 52  | PUT    | `/api/v1/admin/roles/{roleId}/permissions`                | P1       |                                                |
| 53  | DELETE | `/api/v1/admin/roles/{roleId}/permissions/{permissionId}` | P1       |                                                |
| 54  | GET    | `/api/v1/admin/roles/{roleId}/users`                      | P2       |                                                |
| 55  | GET    | `/api/v1/admin/users/{userId}/roles`                      | P1       |                                                |
| 56  | POST   | `/api/v1/admin/users/{userId}/roles`                      | P1       |                                                |
| 57  | DELETE | `/api/v1/admin/users/{userId}/roles/{roleId}`             | P1       |                                                |
| 58  | PUT    | `/api/v1/admin/users/{userId}/roles`                      | P2       |                                                |
| 59  | GET    | `/api/v1/admin/users/{userId}/permissions`                | P2       |                                                |
| 60  | GET    | `/api/v1/admin/users`                                     | P1       |                                                |
| 61  | GET    | `/api/v1/admin/users/{userId}`                            | P1       |                                                |
| 62  | PATCH  | `/api/v1/admin/users/{userId}`                            | P1       |                                                |
| 63  | POST   | `/api/v1/admin/users/{userId}/suspend`                    | P1       |                                                |
| 64  | POST   | `/api/v1/admin/users/{userId}/reactivate`                 | P1       |                                                |
| 65  | POST   | `/api/v1/admin/users/{userId}/disable`                    | P1       |                                                |
| 66  | POST   | `/api/v1/admin/users/{userId}/enable`                     | P1       |                                                |
| 67  | POST   | `/api/v1/admin/users/{userId}/sessions/revoke-all`        | P1       |                                                |
| 68  | POST   | `/api/v1/admin/users/{userId}/password-reset`             | P2       |                                                |
| 69  | DELETE | `/api/v1/admin/users/{userId}`                            | P2       |                                                |
| 70  | GET    | `/api/v1/users/me/security-events`                        | P1       |                                                |
| 71  | GET    | `/api/v1/admin/audit-logs`                                | P1       |                                                |
| 72  | GET    | `/api/v1/admin/audit-logs/{eventId}`                      | P2       |                                                |
| 73  | POST   | `/api/v1/admin/audit-logs/exports`                        | P2       |                                                |
| 74  | GET    | `/api/v1/auth/config`                                     | P1       |                                                |
| 75  | GET    | `/health`                                                 | P0       |                                                |
| 76  | GET    | `/ready`                                                  | P1       |                                                |
| 77  | GET    | `/api/v1/users/me/mfa`                                    | P2       |                                                |
| 78  | POST   | `/api/v1/users/me/mfa/enroll`                             | P2       |                                                |
| 79  | POST   | `/api/v1/users/me/mfa/enroll/confirm`                     | P2       |                                                |
| 80  | DELETE | `/api/v1/users/me/mfa`                                    | P2       |                                                |
| 81  | POST   | `/api/v1/auth/mfa/challenge`                              | P2       |                                                |
| 82  | POST   | `/api/v1/auth/mfa/challenge/verify`                       | P2       |                                                |
| 83  | POST   | `/api/v1/users/me/mfa/recovery-codes/regenerate`          | P2       |                                                |
| 84  | GET    | `/api/v1/users/me/passkeys`                               | P2       |                                                |
| 85  | POST   | `/api/v1/users/me/passkeys/register/options`              | P2       |                                                |
| 86  | POST   | `/api/v1/users/me/passkeys/register/verify`               | P2       |                                                |
| 87  | POST   | `/api/v1/auth/passkeys/login/options`                     | P2       |                                                |
| 88  | POST   | `/api/v1/auth/passkeys/login/verify`                      | P2       |                                                |
| 89  | PATCH  | `/api/v1/users/me/passkeys/{passkeyId}`                   | P2       |                                                |
| 90  | DELETE | `/api/v1/users/me/passkeys/{passkeyId}`                   | P2       |                                                |
| 91  | POST   | `/api/v1/auth/step-up/challenge`                          | P2       |                                                |
| 92  | POST   | `/api/v1/auth/step-up/verify`                             | P2       |                                                |
