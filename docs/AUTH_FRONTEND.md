# Auth API — frontend guide

Implemented auth endpoints only. Base path: `/api/v1/auth`.

For the full planned contract (unimplemented routes), see [AUTH_API.md](AUTH_API.md).

---

## Conventions

### Success

```json
{
  "success": true,
  "message": "…",
  "data": {}
}
```

`data` may be `null`. List endpoints also include `meta` (pagination).

### Error

```json
{
  "success": false,
  "message": "…",
  "code": "ERROR_CODE",
  "requestId": "uuid",
  "details": null
}
```

| HTTP | Code | When |
| --- | --- | --- |
| 401 | `TOKEN_INVALID` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` / `TOKEN_REUSED` | Bad/missing/expired JWT or refresh |
| 401 | `INVALID_CREDENTIALS` | Wrong login password/identifier |
| 403 | `EMAIL_NOT_VERIFIED` / `ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED` | Account not allowed to sign in |
| 403 | `MFA_REQUIRED` | Password/OAuth/magic-link succeeded; continue with `details.mfaToken` |
| 403 | `PERMISSION_DENIED` | Missing required permission (admin routes) |
| 409 | `CONFLICT` | Identity already registered |
| 422 | `VALIDATION_ERROR` | Bad body/query (`details` has field errors) |

### Password rules

8–128 characters; at least one lowercase, uppercase, digit, and special character.

### Phone

E.164 only (e.g. `+9779812345678`).

---

## Tokens & cookies (web vs native)

| | Browser (SPA) | Native / non-cookie |
| --- | --- | --- |
| Access | `Authorization: Bearer <accessToken>` | same |
| Refresh | HttpOnly cookie `refresh_token` (path `/api/v1/auth`) | JSON `refreshToken` in body |
| CSRF | Cookie `csrf_token` (readable) → send header `X-CSRF-Token` | not required |

Access JWT TTL is short (~10 minutes; `expiresIn` is seconds). Refresh TTL is longer (~30 days).

**Always send cookies** on auth calls from the browser: `credentials: "include"`.

Endpoints that **set** cookies: login, email/phone verify, magic-link consume, MFA challenge verify, refresh.  
Endpoints that **clear** cookies: logout, logout-all, password reset.

**CSRF required** when the refresh cookie is present: refresh, logout, logout-all.

Frontend deep links from emails:

- Verify email: `{FRONTEND_BASE_URL}/verify-email?token=…`
- Reset password: `{FRONTEND_BASE_URL}/reset-password?token=…`
- Magic link: `{FRONTEND_BASE_URL}/magic-link?token=…`

---

## Quick map

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/register` | public |
| `POST` | `/identifiers/check` | public |
| `POST` | `/email/verify` | public |
| `POST` | `/email/verification/resend` | public |
| `POST` | `/phone/verify` | public |
| `POST` | `/phone/verification/resend` | public |
| `POST` | `/login` | public |
| `POST` | `/mfa/challenge` | public |
| `POST` | `/mfa/challenge/verify` | public |
| `POST` | `/magic-link/request` | public |
| `POST` | `/magic-link/consume` | public |
| `POST` | `/refresh` | refresh (+ CSRF if cookie) |
| `POST` | `/logout` | refresh and/or bearer (+ CSRF if cookie) |
| `POST` | `/logout-all` | bearer (+ CSRF if cookie) |
| `GET` | `/oauth/{provider}/authorize` | public |
| `GET` | `/oauth/{provider}/callback` | public (IdP redirect) |
| `POST` | `/oauth/{provider}/exchange` | public (native PKCE) |
| `GET` | `/providers` | public |
| `GET` | `/config` | public |
| `GET` | `/me` | bearer |
| `POST` | `/password/forgot` | public |
| `POST` | `/password/reset/validate` | public |
| `POST` | `/password/reset` | public |
| `POST` | `/password/change` | bearer |
| `GET` | `/sessions` | bearer |
| `GET` | `/sessions/{sessionId}` | bearer |
| `PATCH` | `/sessions/{sessionId}` | bearer |
| `DELETE` | `/sessions/{sessionId}` | bearer |
| `POST` | `/sessions/revoke-others` | bearer |

Also under `/api/v1/users` (same bearer):

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/me` | bearer |
| `PATCH` | `/me` | bearer |
| `GET` | `/me/identities` | bearer |
| `POST` | `/me/emails` | bearer |
| `POST` | `/me/emails/verify` | public (or matching bearer) |
| `DELETE` | `/me/emails/{identityId}` | bearer |
| `POST` | `/me/phones` | bearer |
| `DELETE` | `/me/phones/{identityId}` | bearer |
| `POST` | `/me/deletion-request` | bearer |
| `POST` | `/me/deletion-request/cancel` | bearer |
| `GET` | `/me/oauth-accounts` | bearer |
| `GET` | `/me/oauth-accounts/{provider}/authorize` | bearer |
| `POST` | `/me/oauth-accounts/{provider}/link` | bearer |
| `DELETE` | `/me/oauth-accounts/{provider}` | bearer |
| `PATCH` | `/me/username` | bearer |
| `GET` | `/me/security-events` | bearer |
| `GET` | `/me/mfa` | bearer |
| `POST` | `/me/mfa/enroll` | bearer |
| `POST` | `/me/mfa/enroll/confirm` | bearer |
| `DELETE` | `/me/mfa` | bearer |
| `POST` | `/me/mfa/recovery-codes/regenerate` | bearer |

Also under `/api/v1/authz` (same bearer):

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/me/roles` | bearer |
| `GET` | `/me/permissions` | bearer |
| `POST` | `/check` | bearer |

Also under `/api/v1/admin` (bearer + permission):

| Method | Path | Auth |
| --- | --- | --- |
| `GET` | `/roles` | bearer + `roles.read` |
| `GET` | `/roles/:roleId` | bearer + `roles.read` |
| `POST` | `/roles` | bearer + `roles.create` |
| `PATCH` | `/roles/:roleId` | bearer + `roles.update` |
| `DELETE` | `/roles/:roleId` | bearer + `roles.delete` |
| `GET` | `/permissions` | bearer + `permissions.read` |
| `GET` | `/permissions/:permissionId` | bearer + `permissions.read` |
| `PUT` | `/roles/:roleId/permissions` | bearer + `permissions.assign` |
| `DELETE` | `/roles/:roleId/permissions/:permissionId` | bearer + `permissions.assign` |
| `GET` | `/roles/:roleId/users` | bearer + `roles.read` |
| `GET` | `/users/:userId/roles` | bearer + `roles.read` |
| `POST` | `/users/:userId/roles` | bearer + `roles.assign` |
| `DELETE` | `/users/:userId/roles/:roleId` | bearer + `roles.assign` |
| `PUT` | `/users/:userId/roles` | bearer + `roles.assign` |
| `GET` | `/users/:userId/permissions` | bearer + `permissions.read` |
| `GET` | `/users` | bearer + `users.read` |
| `GET` | `/users/:userId` | bearer + `users.read` |
| `PATCH` | `/users/:userId` | bearer + `users.update` |
| `POST` | `/users/:userId/suspend` | bearer + `users.suspend` |
| `POST` | `/users/:userId/reactivate` | bearer + `users.suspend` |
| `POST` | `/users/:userId/disable` | bearer + `users.suspend` |
| `POST` | `/users/:userId/enable` | bearer + `users.suspend` |
| `POST` | `/users/:userId/sessions/revoke-all` | bearer + `sessions.revoke` |
| `POST` | `/users/:userId/password-reset` | bearer + `users.update` |
| `DELETE` | `/users/:userId` | bearer + `users.delete` |
| `GET` | `/audit-logs` | bearer + `audit_logs.read` |
| `GET` | `/audit-logs/:eventId` | bearer + `audit_logs.read` |
| `POST` | `/audit-logs/exports` | bearer + `audit_logs.export` |
| `GET` | `/audit-logs/exports/:exportId` | bearer + `audit_logs.export` |

---

## Shared shapes

### `UserPublic`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "displayName": "Ada Lovelace",
  "avatarUrl": null,
  "email": "ada@example.com",
  "username": null,
  "createdAt": "2026-10-28T00:00:00.000Z",
  "updatedAt": "2026-10-28T00:00:00.000Z"
}
```

`status`: `pending_verification` | `active` | `suspended` | `disabled`

### `LoginIdentity`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "type": "email",
  "identifier": "ada@example.com",
  "verifiedAt": "2026-01-01T00:00:00.000Z",
  "isPrimary": true,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

`type`: `email` | `phone` | `username`. `identifier` is the display form (not necessarily normalized).

### `OAuthAccount`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440020",
  "provider": "google",
  "providerEmail": "ada@example.com",
  "linkedAt": "2026-01-01T00:00:00.000Z",
  "lastUsedAt": "2026-01-03T00:00:00.000Z"
}
```

`provider`: `google` | `github` | `apple` | `microsoft` | `oidc`. `providerEmail` and `lastUsedAt` may be `null`.

### `AuthProviderPublic`

```json
{
  "id": "google",
  "name": "Google",
  "type": "oauth",
  "enabled": true
}
```

`type`: `oauth` | `oidc` | `password` | `magic_link`. Hide providers with `enabled: false`.

### `SecurityEvent`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440080",
  "eventType": "login_success",
  "outcome": "success",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "metadata": { "method": "password" }
}
```

`outcome`: `success` | `failure` | `blocked`. `metadata` is optional and never includes secrets.

### `Role`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "key": "member",
  "name": "Member",
  "description": "Default member role",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

`description` may be `null`.

### `Permission`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "key": "roles.read",
  "name": "Read roles",
  "description": "List and view roles"
}
```

`description` may be `null`. No `createdAt`.

### Session tokens (`data` after login / verify)

```json
{
  "user": { "...": "UserPublic" },
  "accessToken": "eyJ…",
  "tokenType": "Bearer",
  "expiresIn": 600,
  "refreshToken": "opaque-refresh-token"
}
```

Refresh returns the same fields **without** `user`.

---

## Endpoints

### Register

`POST /api/v1/auth/register`

**Body** — at least one of `email` / `phone`:

```json
{
  "email": "ada@example.com",
  "password": "Test@1234",
  "confirmPassword": "Test@1234",
  "displayName": "Ada Lovelace"
}
```

**Response** `201` — no session yet; user is `pending_verification`.

```json
{
  "success": true,
  "message": "Account registered. Please verify your identity to activate the account.",
  "data": { "user": { "...": "UserPublic" } }
}
```

---

### Check identifier availability

`POST /api/v1/auth/identifiers/check`

**Auth:** public. Validates format only; does **not** reveal whether an email, phone, or username is taken (`available: true`). Reserved usernames (`admin`, `root`, …) return `available: false`. Use register / `PATCH /users/me/username` `409 CONFLICT` for real uniqueness.

```json
{ "type": "email", "identifier": "ada@example.com" }
```

`type`: `email` | `phone` | `username`. Phone must be E.164.

**Response** `200` `data`: `{ "available": boolean }`.

**Errors:** `422 VALIDATION_ERROR`.

---

### Verify email

`POST /api/v1/auth/email/verify`

```json
{ "token": "token-from-email-link" }
```

**Response** `200` — session tokens + cookies. Activates account when verification requirements are met.

---

### Resend email verification

`POST /api/v1/auth/email/verification/resend`

```json
{ "email": "ada@example.com" }
```

**Response** `200` — always the same message (anti-enumeration):

```json
{
  "success": true,
  "message": "If an account needs verification, a new email has been sent.",
  "data": null
}
```

---

### Verify phone

`POST /api/v1/auth/phone/verify`

```json
{
  "phone": "+9779812345678",
  "code": "123456"
}
```

**Response** `200` — session tokens + cookies (same shape as login).

---

### Resend phone verification

`POST /api/v1/auth/phone/verification/resend`

```json
{ "phone": "+9779812345678" }
```

**Response** `200` — anti-enumeration (`data: null`); SMS delivery may still be pending on the backend.

---

### Login

`POST /api/v1/auth/login`

`identifier` may be email, phone, or username.

```json
{
  "identifier": "ada@example.com",
  "password": "Test@1234"
}
```

**Response** `200` — session tokens + cookies.

**Errors:** `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` / `ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`, `403 MFA_REQUIRED` (`details.mfaToken`).

---

### Request magic link

`POST /api/v1/auth/magic-link/request`

**Auth:** public. Anti-enumeration: same `200` whether or not the email exists. Sends a 15-minute single-use link to existing `active` or `pending_verification` accounts. Does not create accounts.

```json
{ "email": "ada@example.com" }
```

**Response** `200` — always:

```json
{
  "success": true,
  "message": "If an account exists for that email, a sign-in link has been sent.",
  "data": null
}
```

Email deep link: `{FRONTEND_BASE_URL}/magic-link?token=…`. POST that token to consume.

---

### Consume magic link

`POST /api/v1/auth/magic-link/consume`

**Auth:** public. Login-only (no auto-signup). Activates `pending_verification` users and verifies the email identity on the token.

```json
{ "token": "token-from-email-link" }
```

**Response** `200` — same `AuthTokensData` + cookies as login (`message`: `Signed in.`).

**Errors:** `401 TOKEN_INVALID` / `TOKEN_EXPIRED`, `403 ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED` (token not consumed), `403 MFA_REQUIRED` (`details.mfaToken`), `422`.

---

### MFA status

`GET /api/v1/users/me/mfa`

**Auth:** bearer.

**Response** `200` `data`: `{ enabled, factors: [{ id, type, label, verifiedAt }] }`.

---

### Begin MFA enroll

`POST /api/v1/users/me/mfa/enroll`

```json
{ "type": "totp" }
```

`type` is `totp` | `sms` | `email`. SMS/email may include `destination`; otherwise the verified phone/email is used.

**Response** `200` TOTP: `{ factorId, secret, otpauthUrl }`. SMS/email: `{ factorId }` and a 10-minute OTP is sent (SMS is logged until a provider is wired).

---

### Confirm MFA enroll

`POST /api/v1/users/me/mfa/enroll/confirm`

```json
{ "factorId": "uuid", "code": "123456" }
```

**Response** `200` `{ recoveryCodes: string[] }` — 10 codes on first enable; store them, they are not shown again.

---

### Disable MFA

`DELETE /api/v1/users/me/mfa`

```json
{ "password": "Test@1234" }
```

Or `{ "code": "123456" }` (TOTP or recovery code).

**Response** `200` `data`: `null`.

---

### Begin MFA challenge

`POST /api/v1/auth/mfa/challenge`

Use `details.mfaToken` from `403 MFA_REQUIRED` after login / magic-link / OAuth.

```json
{ "mfaToken": "continuation-token" }
```

Optional `factorId`. **Response** `200`: `{ challengeId, expiresAt }`.

---

### Verify MFA challenge

`POST /api/v1/auth/mfa/challenge/verify`

```json
{ "challengeId": "uuid", "code": "123456" }
```

`code` may be TOTP, SMS/email OTP, or a recovery code.

**Response** `200` — same `AuthTokensData` + cookies as login.

---

### Regenerate recovery codes

`POST /api/v1/users/me/mfa/recovery-codes/regenerate`

**Auth:** bearer. Invalidates unused codes.

**Response** `200` `{ recoveryCodes: string[] }`.

---

### List auth providers

`GET /api/v1/auth/providers`

**Auth:** public. Use this to render sign-in buttons.

**Response** `200` `data`: `AuthProviderPublic[]` — `password` and `magic_link` are enabled; OAuth/OIDC keys are enabled when configured in env.

---

### Auth config

`GET /api/v1/auth/config`

**Auth:** public. Password policy, feature flags, and the same provider catalog as `/auth/providers`.

**Response** `200` `data`:

```json
{
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireDigit": true,
    "requireSpecial": true
  },
  "features": {
    "registration": true,
    "oauth": true,
    "magicLink": true,
    "mfa": true,
    "passkeys": false,
    "phoneAuth": true
  },
  "providers": []
}
```

---

### Start OAuth

`GET /api/v1/auth/oauth/{provider}/authorize`

**Auth:** public. `{provider}` is `google` \| `github` \| `apple` \| `microsoft` \| `oidc`. The provider must have a client id in env or the API returns `404`.

Query:

| Param | Required | Notes |
| --- | --- | --- |
| `redirectUri` | yes | App return URL. Same origin as `FRONTEND_BASE_URL`, or an exact `OAUTH_REDIRECT_URIS` entry |
| `state` | yes | Client CSRF (8–512 chars). Stored and returned on callback later |
| `intent` | no | `login` (default) or `link` |
| `response` | no | `json` to get the IdP URL instead of a `302` |
| `codeChallenge` / `codeChallengeMethod` | native | PKCE S256. Omitted for browser: the API generates PKCE and sets HttpOnly cookie `oauth_code_verifier` |

IdP `redirect_uri` is the API callback (`{BASE_URL}/api/v1/auth/oauth/{provider}/callback`) — not `redirectUri`.

**Response** `302` to the IdP, or `200`:

```json
{ "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

**Errors:** `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### OAuth callback

`GET /api/v1/auth/oauth/{provider}/callback`

**Auth:** public. The IdP redirects here with `code` + `state` (or `error`). Browser clients must send the `oauth_code_verifier` cookie set during authorize.

On success the API sets session cookies (`refresh_token` + `csrf_token`) and `302`s to the stored app `redirectUri` with the original client `state` query. Existing `external_identities` log in; a new subject creates an active account. A matching email on another account is **not** merged — the new OAuth account is created without that email login identity.

Native clients that sent their own PKCE get a `302` to `redirectUri` with `code` + client `state` (state is not consumed). Then call exchange.

**Errors:** `400 OAUTH_STATE_INVALID` (bad/expired/consumed state or IdP error), `403 ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`, `404 NOT_FOUND` (provider not configured for token exchange), `409 CONFLICT` (provider subject already linked in a race). `intent=link` does **not** sign in: `302` to the app with `code` + client `state` so you can call `POST /users/me/oauth-accounts/{provider}/link`.

---

### Exchange native OAuth code

`POST /api/v1/auth/oauth/{provider}/exchange`

**Auth:** public. Use after authorize with client PKCE and the callback handoff.

```json
{
  "code": "idp-authorization-code",
  "codeVerifier": "the-pkce-verifier-you-created",
  "redirectUri": "myapp://oauth",
  "state": "the-same-client-csrf-as-authorize"
}
```

`redirectUri` and `state` must match the authorize request. The API still talks to the IdP using the API callback URL.

**Response** `200` — session tokens + cookies + `user` (same shape as login).

**Errors:** `400 OAUTH_STATE_INVALID`, `403 ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`, `404 NOT_FOUND`, `409 CONFLICT`, `422 VALIDATION_ERROR`.

---

### List linked OAuth accounts

`GET /api/v1/users/me/oauth-accounts`

**Auth:** bearer.

**Response** `200` `data`: `OAuthAccount[]` (newest `linkedAt` first). Empty list when none are linked.

---

### Start linking OAuth

`GET /api/v1/users/me/oauth-accounts/{provider}/authorize`

**Auth:** bearer. Same query as start OAuth (`redirectUri`, `state`, optional `response=json` and PKCE). Always stored as `intent=link` with the current user id. Browser PKCE cookie `oauth_code_verifier` is scoped to `/api/v1/users/me/oauth-accounts` so it is sent to `POST .../link`, not the login callback.

**Response** `302` to the IdP, or `200` `{ "authorizationUrl": "…" }`. After the IdP, the login callback `302`s `code` + `state` to `redirectUri`. Then call complete link.

**Errors:** `401 TOKEN_*`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### Complete OAuth link

`POST /api/v1/users/me/oauth-accounts/{provider}/link`

**Auth:** bearer. Use after start-link + IdP + callback handoff.

```json
{
  "code": "idp-authorization-code",
  "codeVerifier": "optional-if-browser-cookie-is-present",
  "redirectUri": "http://localhost:5173/settings/linked",
  "state": "the-same-client-csrf-as-authorize"
}
```

`redirectUri` and `state` must match the start-link request. `codeVerifier` is required for native PKCE; browser clients can omit it when the `oauth_code_verifier` cookie is present. Does **not** issue a new session.

**Response** `200` `data`: `OAuthAccount`.

**Errors:** `400 OAUTH_STATE_INVALID`, `401 TOKEN_*`, `404 NOT_FOUND`, `409 CONFLICT` (subject linked elsewhere, or this provider already linked), `422 VALIDATION_ERROR`.

---

### Unlink OAuth

`DELETE /api/v1/users/me/oauth-accounts/{provider}`

**Auth:** bearer. Removes that provider link. Allowed when another sign-in method remains (another OAuth provider, or an email/phone/username login identity).

**Response** `200` `data`: `null`.

**Errors:** `409 LAST_AUTH_METHOD`, `404 NOT_FOUND`, `422` (unknown provider), `401 TOKEN_*`.

---

### Refresh

`POST /api/v1/auth/refresh`

**Browser:** cookies only + `X-CSRF-Token` (body can be `{}`).

**Native:**

```json
{ "refreshToken": "opaque-refresh-token" }
```

**Response** `200`:

```json
{
  "success": true,
  "message": "Token refreshed.",
  "data": {
    "accessToken": "eyJ…",
    "tokenType": "Bearer",
    "expiresIn": 600,
    "refreshToken": "new-opaque-refresh-token"
  }
}
```

Store the new refresh token (cookie is rotated automatically for browsers).

---

### Logout (current session)

`POST /api/v1/auth/logout`

Send refresh cookie and/or bearer. Optional body for native:

```json
{ "refreshToken": "opaque-refresh-token" }
```

**Response** `200` — `data: null`; cookies cleared.

---

### Logout all sessions

`POST /api/v1/auth/logout-all`

**Auth:** `Authorization: Bearer …`  
**CSRF:** if refresh cookie is present.

**Response** `200`:

```json
{
  "success": true,
  "message": "Signed out of all sessions.",
  "data": { "revokedCount": 3 }
}
```

Cookies cleared.

---

### Current user

`GET /api/v1/auth/me`

**Auth:** bearer.

```json
{
  "success": true,
  "message": "Authenticated user.",
  "data": {
    "user": { "...": "UserPublic" },
    "roles": ["member"],
    "permissions": []
  }
}
```

`roles` here are keys only. Use `GET /authz/me/roles` for full `Role` objects. `permissions` on this response is still empty; use `GET /authz/me/permissions` for effective keys.

---

### List own roles

`GET /api/v1/authz/me/roles`

**Auth:** bearer.

**Response** `200` `data`: `Role[]` (newest assignment first). Empty list when none are assigned.

---

### List own permissions

`GET /api/v1/authz/me/permissions`

**Auth:** bearer.

**Response** `200` `data`: `{ "permissions": string[] }` — distinct keys from assigned roles, sorted. Empty list when none are assigned.

---

### Check permission

`POST /api/v1/authz/check`

**Auth:** bearer.

```json
{ "permission": "users.read", "resourceId": "optional-resource-id" }
```

**Response** `200` `data`: `{ "allowed": true }` if any assigned role grants that key. `resourceId` is accepted but not scoped yet. Missing permission is `allowed: false` (not `403`).

---

### List roles (admin)

`GET /api/v1/admin/roles`

**Auth:** bearer + `roles.read`. Query: `page`, `limit` (max 100), optional `search` (matches key, name, or description).

**Response** `200` `data`: `Role[]` + pagination `meta`, sorted by `key`. Empty page when none match.

**Errors:** `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Get role (admin)

`GET /api/v1/admin/roles/{roleId}`

**Auth:** bearer + `roles.read`. `roleId` must be a UUID.

**Response** `200` `data`: `{ "role": Role, "permissions": Permission[] }`, permissions sorted by `key`. Empty `permissions` when the role has none.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Create role (admin)

`POST /api/v1/admin/roles`

**Auth:** bearer + `roles.create`.

```json
{ "key": "editor", "name": "Editor", "description": "Can edit content" }
```

`key` is stored lowercase and must be unique. `description` is optional (`null` when omitted or blank).

**Response** `201` `data`: `Role`.

**Errors:** `409 CONFLICT`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Update role (admin)

`PATCH /api/v1/admin/roles/{roleId}`

**Auth:** bearer + `roles.update`. `roleId` must be a UUID.

```json
{ "name": "Lead editor", "description": "Reviews content" }
```

`key` is immutable (sending it is `422`). At least one of `name` or `description` is required. `description: null` or `""` clears it.

**Response** `200` `data`: `Role`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Delete role (admin)

`DELETE /api/v1/admin/roles/{roleId}`

**Auth:** bearer + `roles.delete`. `roleId` must be a UUID.

**Response** `200` `data`: `null`.

**Errors:** `409 CONFLICT` if any user still has the role, `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### List permissions (admin)

`GET /api/v1/admin/permissions`

**Auth:** bearer + `permissions.read`. Query: `page`, `limit` (max 100), optional `search` (matches key, name, or description).

**Response** `200` `data`: `Permission[]` + pagination `meta`, sorted by `key`. Empty page when none match.

**Errors:** `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Get permission (admin)

`GET /api/v1/admin/permissions/{permissionId}`

**Auth:** bearer + `permissions.read`. `permissionId` must be a UUID.

**Response** `200` `data`: `Permission`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Assign permissions to role (admin)

`PUT /api/v1/admin/roles/{roleId}/permissions`

**Auth:** bearer + `permissions.assign`. `roleId` must be a UUID.

```json
{ "permissionIds": ["550e8400-e29b-41d4-a716-446655440040"] }
```

Full replace. Empty array clears all. Duplicates are ignored. Unknown permission ids are `422`.

**Response** `200` `data`: `Permission[]`, sorted by `key`.

**Errors:** `404 NOT_FOUND` (role), `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Remove permission from role (admin)

`DELETE /api/v1/admin/roles/{roleId}/permissions/{permissionId}`

**Auth:** bearer + `permissions.assign`. Both ids must be UUIDs.

**Response** `200` `data`: `null`.

**Errors:** `404 NOT_FOUND` if the role is missing or the permission is not assigned, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### List users for role (admin)

`GET /api/v1/admin/roles/{roleId}/users`

**Auth:** bearer + `roles.read`. `roleId` must be a UUID.

**Query:** `page` (default 1), `limit` (default 10, max 100).

**Response** `200` `data`: `UserPublic[]` + `meta`. Newest assignments first. Soft-deleted users are omitted.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### List roles for user (admin)

`GET /api/v1/admin/users/{userId}/roles`

**Auth:** bearer + `roles.read`. `userId` must be a UUID.

**Response** `200` `data`: `Role[]`. Newest assignments first, then `key`. Soft-deleted users are `404`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Assign role to user (admin)

`POST /api/v1/admin/users/{userId}/roles`

**Auth:** bearer + `roles.assign`. `userId` must be a UUID.

```json
{ "roleId": "550e8400-e29b-41d4-a716-446655440030" }
```

**Response** `201` `data`: `Role`.

**Errors:** `404 NOT_FOUND` (user or role), `409 CONFLICT` if already assigned, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Remove role from user (admin)

`DELETE /api/v1/admin/users/{userId}/roles/{roleId}`

**Auth:** bearer + `roles.assign`. Both ids must be UUIDs.

**Response** `200` `data`: `null`.

**Errors:** `404 NOT_FOUND` if the user, role, or assignment is missing, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Replace user roles (admin)

`PUT /api/v1/admin/users/{userId}/roles`

**Auth:** bearer + `roles.assign`. `userId` must be a UUID.

```json
{ "roleIds": ["550e8400-e29b-41d4-a716-446655440030"] }
```

Full replace. Empty array clears all. Duplicates are ignored. Unknown role ids are `422`.

**Response** `200` `data`: `Role[]`. Newest assignments first, then `key`.

**Errors:** `404 NOT_FOUND` (user), `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### User effective permissions (admin)

`GET /api/v1/admin/users/{userId}/permissions`

**Auth:** bearer + `permissions.read`. `userId` must be a UUID.

**Response** `200` `data`: `{ "permissions": string[] }` — distinct keys from the user's roles, sorted ascending.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### List users (admin)

`GET /api/v1/admin/users`

**Auth:** bearer + `users.read`.

**Query:** pagination; `search?`; `status?` (`pending_verification` | `active` | `suspended` | `disabled`); `sortBy` (`createdAt` | `displayName` | `status`, default `createdAt`); `sortOrder`.

**Response** `200` `data`: `UserPublic[]` + `meta`. Soft-deleted users are omitted.

---

### Get user (admin)

`GET /api/v1/admin/users/{userId}`

**Auth:** bearer + `users.read`. `userId` must be a UUID.

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile, roles: Role[], identities: LoginIdentity[] }`.

**Errors:** `404 NOT_FOUND` (user), `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Update user (admin)

`PATCH /api/v1/admin/users/{userId}`

**Auth:** bearer + `users.update`.

**Body (at least one):** `displayName`, `avatarUrl`, `firstName`, `lastName`, `locale`, `timezone`, `bio` — same field rules as `PATCH /users/me`.

**Response** `200` `data`: `{ user: UserPublic, profile: UserProfile }`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Suspend user (admin)

`POST /api/v1/admin/users/{userId}/suspend`

**Auth:** bearer + `users.suspend`.

**Body (optional):** `{ "reason"?: string }` — accepted, not persisted.

**Response** `200` `data`: `UserPublic` — `status=suspended`. Active sessions are revoked.

---

### Reactivate user (admin)

`POST /api/v1/admin/users/{userId}/reactivate`

**Auth:** bearer + `users.suspend`.

**Response** `200` `data`: `UserPublic` — `status=active`.

---

### Disable user (admin)

`POST /api/v1/admin/users/{userId}/disable`

**Auth:** bearer + `users.suspend` (until a dedicated disable permission is split).

**Body (optional):** `{ "reason"?: string }` — accepted, not persisted.

**Response** `200` `data`: `UserPublic` — `status=disabled`. Active sessions are revoked.

---

### Enable user (admin)

`POST /api/v1/admin/users/{userId}/enable`

**Auth:** bearer + `users.suspend`.

**Response** `200` `data`: `UserPublic` — `status=active`.

---

### Revoke all user sessions (admin)

`POST /api/v1/admin/users/{userId}/sessions/revoke-all`

**Auth:** bearer + `sessions.revoke`.

**Response** `200` `data`: `{ "revokedCount": number }`.

---

### Admin-initiated password reset

`POST /api/v1/admin/users/{userId}/password-reset`

**Auth:** bearer + `users.update`.

**Response** `200` `data`: `null` — emails a reset link when the user has a verified email and password; never returns the raw token. Succeeds without emailing if the user exists but is not eligible.

**Errors:** `404 NOT_FOUND` (user), `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Permanently delete user (admin)

`DELETE /api/v1/admin/users/{userId}?hard=true`

**Auth:** bearer + `users.delete`. Query `hard=true` is required.

**Response** `200` `data`: `null`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR` (missing `hard=true`).

---

### Own security events

`GET /api/v1/users/me/security-events`

**Auth:** bearer.

**Query:** pagination; `eventType?`; `from?` / `to?` ISO dates.

**Response** `200` `data`: `SecurityEvent[]` + `meta`. Metadata is sanitized.

---

### Admin audit logs

`GET /api/v1/admin/audit-logs`

**Auth:** bearer + `audit_logs.read`.

**Query:** pagination; `userId?`; `eventType?`; `outcome?`; `from?`; `to?`.

**Response** `200` `data`: `SecurityEvent[]` + `meta`.

---

### Audit log detail

`GET /api/v1/admin/audit-logs/{eventId}`

**Auth:** bearer + `audit_logs.read`.

**Response** `200` `data`: `SecurityEvent`.

**Errors:** `404 NOT_FOUND`, `403 PERMISSION_DENIED`, `401 TOKEN_*`, `422 VALIDATION_ERROR`.

---

### Export audit logs

`POST /api/v1/admin/audit-logs/exports`

**Auth:** bearer + `audit_logs.export`.

**Body:** `{ "from": string, "to": string, "format": "csv" | "json", "filters"?: { "userId"?, "eventType"?, "outcome"? } }`

**Response** `202` `data`: `{ "exportId": string, "status": "pending" }`. The worker writes the file to object storage at `audit-exports/{exportId}.{format}`.

Poll `GET /api/v1/admin/audit-logs/exports/{exportId}` (same permission) until the file is ready. Ready responses are the raw CSV/JSON attachment (`Content-Disposition: attachment`). `404 NOT_FOUND` means the job is still pending or the id is unknown.

---

### Own profile

`GET /api/v1/users/me`

**Auth:** bearer. Account + optional extended profile (all profile fields may be `null`).

**Response** `200`:

```json
{
  "success": true,
  "message": "Profile loaded.",
  "data": {
    "user": { "...": "UserPublic" },
    "profile": {
      "firstName": "Ada",
      "lastName": "Lovelace",
      "locale": "en-US",
      "timezone": "UTC",
      "bio": null
    }
  }
}
```

Unlike `GET /auth/me`, this does **not** include `roles` / `permissions`.

---

### Update own profile

`PATCH /api/v1/users/me`

**Auth:** bearer. All fields optional; send at least one. `null` or `""` clears a field.

```json
{
  "displayName": "Ada",
  "avatarUrl": "https://cdn.example.com/ada.png",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "locale": "en-US",
  "timezone": "UTC",
  "bio": null
}
```

**Response** `200` — same shape as `GET /users/me` (`user` + `profile`).

**Errors:** `422` (empty body / invalid field), `401 TOKEN_*`.

---

### List login identities

`GET /api/v1/users/me/identities`

**Auth:** bearer.

**Response** `200` `data`: `LoginIdentity[]` (primary first).

---

### Add email

`POST /api/v1/users/me/emails`

**Auth:** bearer. Adds an unverified email identity and sends a verification link. Primary only if the user has no other primary email.

```json
{ "email": "second@example.com" }
```

**Response** `201` `data`: `LoginIdentity` (`verifiedAt: null`).

**Errors:** `409 CONFLICT` (email already used), `422`, `401 TOKEN_*`.

---

### Verify added email

`POST /api/v1/users/me/emails/verify`

**Auth:** public with `{ "token" }` from the verification email. Optional bearer is allowed only if it belongs to the same user. Does **not** issue a session (unlike `POST /auth/email/verify`).

```json
{ "token": "token-from-email-link" }
```

**Response** `200` `data`: `LoginIdentity` (`verifiedAt` set).

**Errors:** `401 TOKEN_INVALID` / `TOKEN_EXPIRED`, `422`.

---

### Remove email

`DELETE /api/v1/users/me/emails/{identityId}`

**Auth:** bearer. Unlinks that email identity. Remaining emails keep a primary (oldest remaining email is promoted when the removed one was primary). Blocked when it is the last login identity (email, phone, or username).

**Response** `200` `data`: `null`.

**Errors:** `409 LAST_AUTH_METHOD`, `404 NOT_FOUND`, `422` (invalid UUID), `401 TOKEN_*`.

---

### Add phone

`POST /api/v1/users/me/phones`

**Auth:** bearer. Adds an unverified phone identity. Primary only if the user has no other primary phone. SMS is not wired yet (OTP is logged like registration). Confirm with `POST /api/v1/auth/phone/verify`.

```json
{ "phone": "+9779812345678" }
```

**Response** `201` `data`: `LoginIdentity` (`verifiedAt: null`).

**Errors:** `409 CONFLICT` (phone already used), `422`, `401 TOKEN_*`.

---

### Remove phone

`DELETE /api/v1/users/me/phones/{identityId}`

**Auth:** bearer. Unlinks that phone identity. Remaining phones keep a primary (oldest remaining phone is promoted when the removed one was primary). Blocked when it is the last login identity (email, phone, or username).

**Response** `200` `data`: `null`.

**Errors:** `409 LAST_AUTH_METHOD`, `404 NOT_FOUND`, `422` (invalid UUID), `401 TOKEN_*`.

---

### Request account deletion

`POST /api/v1/users/me/deletion-request`

**Auth:** bearer. Sets deletion markers and enqueues a delayed job. The worker applies `deleted_at` + session revoke at `scheduledFor` (and a 15-minute sweep as backup). Account stays usable until then. Repeat calls keep the original schedule. Needs `pnpm worker` (or Compose `worker`) running.

```json
{ "password": "optional-current-password", "reason": "optional" }
```

**Response** `200`:

```json
{ "scheduledFor": "2026-11-14T00:00:00.000Z" }
```

**Errors:** `401 INVALID_CREDENTIALS` (password sent and wrong), `422`, `401 TOKEN_*`.

---

### Cancel account deletion

`POST /api/v1/users/me/deletion-request/cancel`

**Auth:** bearer. Clears deletion markers and removes the delayed apply job. Account stays fully usable. Safe until the worker has already applied `deleted_at`.

**Response** `200` `data`: `null`.

**Errors:** `404 NOT_FOUND` (no pending request), `401 TOKEN_*`.

---

### Change or set username

`PATCH /api/v1/users/me/username`

**Auth:** bearer. Creates or replaces the username login identity (case-insensitive unique).

```json
{ "username": "Ada" }
```

Rules: 3–30 chars; starts with a letter; letters, digits, `.`, `_`, `-` only; reserved names rejected.

**Response** `200`:

```json
{
  "success": true,
  "message": "Username updated.",
  "data": {
    "user": { "...": "UserPublic", "username": "ada" }
  }
}
```

**Errors:** `409 CONFLICT` (taken), `422` (format / reserved), `401 TOKEN_*`.

---

### Forgot password

`POST /api/v1/auth/password/forgot`

```json
{ "email": "ada@example.com" }
```

**Response** `200` — always:

```json
{
  "success": true,
  "message": "If an account exists for that email, a password reset link has been sent.",
  "data": null
}
```

---

### Validate password-reset token

`POST /api/v1/auth/password/reset/validate`

**Auth:** public. Soft check for the reset form — always `200` (except validation errors).

```json
{ "token": "token-from-email-link" }
```

**Response** `200` when valid:

```json
{
  "success": true,
  "message": "Password reset token is valid.",
  "data": {
    "valid": true,
    "expiresAt": "2026-11-01T12:00:00.000Z"
  }
}
```

**Response** `200` when invalid/expired/used:

```json
{
  "success": true,
  "message": "Password reset token is invalid.",
  "data": { "valid": false }
}
```

---

### Reset password

`POST /api/v1/auth/password/reset`

```json
{
  "token": "token-from-email-link",
  "password": "NewTest@1234",
  "confirmPassword": "NewTest@1234"
}
```

**Response** `200` — `data: null`; all sessions revoked; cookies cleared. User must log in again.

---

### Change password

`POST /api/v1/auth/password/change`

**Auth:** bearer. Keeps the current session; cookies are **not** cleared. Other active sessions are revoked.

```json
{
  "currentPassword": "OldTest@1234",
  "password": "NewTest@1234",
  "confirmPassword": "NewTest@1234"
}
```

**Response** `200`:

```json
{
  "success": true,
  "message": "Password has been changed.",
  "data": null
}
```

**Errors:** `401 INVALID_CREDENTIALS` (wrong current password), `401 TOKEN_*`, `422`.

---

### List sessions

`GET /api/v1/auth/sessions?page=1&limit=10&includeRevoked=false`

**Auth:** bearer.

| Query | Default | Notes |
| --- | --- | --- |
| `page` | `1` | ≥ 1 |
| `limit` | `10` | 1–100 |
| `includeRevoked` | `false` | `"true"` \| `"false"` |

**Response** `200`:

```json
{
  "success": true,
  "message": "Sessions retrieved.",
  "data": [
    {
      "id": "session-uuid",
      "createdAt": "2026-10-28T00:00:00.000Z",
      "lastUsedAt": "2026-10-28T01:00:00.000Z",
      "expiresAt": "2026-11-27T00:00:00.000Z",
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0…",
      "deviceName": null,
      "isCurrent": true
    }
  ],
  "meta": {
    "totalRecords": 1,
    "perPage": 10,
    "currentPage": 1,
    "totalPages": 1,
    "pagingCounter": 1,
    "hasPrevious": false,
    "hasNext": false,
    "prev": null,
    "next": null,
    "recordShown": 1
  }
}
```

---

### Get session

`GET /api/v1/auth/sessions/{sessionId}`

**Auth:** bearer (own sessions only).

**Response** `200`:

```json
{
  "success": true,
  "message": "Session retrieved.",
  "data": {
    "id": "session-uuid",
    "createdAt": "2026-10-28T00:00:00.000Z",
    "lastUsedAt": "2026-10-28T01:00:00.000Z",
    "expiresAt": "2026-11-27T00:00:00.000Z",
    "ipAddress": "127.0.0.1",
    "userAgent": "Mozilla/5.0…",
    "deviceName": null,
    "isCurrent": true
  }
}
```

**Errors:** `404 NOT_FOUND` (missing or not owned), `401 TOKEN_*`, `422` (invalid UUID).

---

### Update session label

`PATCH /api/v1/auth/sessions/{sessionId}`

**Auth:** bearer (own sessions only). Sets `deviceName` (1–255 characters after trim).

```json
{ "deviceName": "MacBook Pro" }
```

**Response** `200` `data`: `SessionSummary` with the new `deviceName`.

**Errors:** `404 NOT_FOUND` (missing or not owned), `401 TOKEN_*`, `422` (invalid UUID / empty or too-long name).

---

### Revoke session

`DELETE /api/v1/auth/sessions/{sessionId}`

**Auth:** bearer (own sessions only). Idempotent if already revoked.

**Response** `200`:

```json
{
  "success": true,
  "message": "Session revoked.",
  "data": null
}
```

If you revoke the **current** session, auth cookies are cleared (same as logout). Clear the local access token too.

**Errors:** `404 NOT_FOUND` (missing or not owned), `401 TOKEN_*`, `422` (invalid UUID).

---

### Revoke other sessions

`POST /api/v1/auth/sessions/revoke-others`

**Auth:** bearer. Keeps the current session; no body; cookies are **not** cleared.

**Response** `200`:

```json
{
  "success": true,
  "message": "Other sessions revoked.",
  "data": { "revokedCount": 2 }
}
```

---

## Suggested frontend flows

1. **Register** → open verify email/phone → **verify** → store access (+ refresh for native) → app.
2. **Login** → store tokens → call **`/auth/me`** (authz snapshot) and/or **`GET/PATCH /users/me`** (profile) as needed.
3. On `401 TOKEN_EXPIRED` / `TOKEN_INVALID` for API calls → **refresh** once → retry; if refresh fails → login screen.
4. **Logout** (or **logout-all**) → clear local access token; cookies cleared by API.
5. **Revoke others** from a sessions UI → other devices signed out; current session stays.
6. **Change password** (settings) → other sessions die; stay signed in on this device.
7. **Set username** (optional) via `PATCH /users/me/username` — then usable at login.
8. Forgot password → email link → **validate** token → **reset** → login.

Use an HTTP client with `credentials: "include"` for all `/api/v1/auth/*` calls from the browser, and attach `Authorization` + `X-CSRF-Token` where noted above.
