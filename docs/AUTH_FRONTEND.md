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

Endpoints that **set** cookies: login, email/phone verify, refresh.  
Endpoints that **clear** cookies: logout, logout-all, password reset.

**CSRF required** when the refresh cookie is present: refresh, logout, logout-all.

Frontend deep links from emails:

- Verify email: `{FRONTEND_BASE_URL}/verify-email?token=…`
- Reset password: `{FRONTEND_BASE_URL}/reset-password?token=…`

---

## Quick map

| Method | Path | Auth |
| --- | --- | --- |
| `POST` | `/register` | public |
| `POST` | `/email/verify` | public |
| `POST` | `/email/verification/resend` | public |
| `POST` | `/phone/verify` | public |
| `POST` | `/phone/verification/resend` | public |
| `POST` | `/login` | public |
| `POST` | `/refresh` | refresh (+ CSRF if cookie) |
| `POST` | `/logout` | refresh and/or bearer (+ CSRF if cookie) |
| `POST` | `/logout-all` | bearer (+ CSRF if cookie) |
| `GET` | `/oauth/{provider}/authorize` | public |
| `GET` | `/oauth/{provider}/callback` | public (IdP redirect) |
| `POST` | `/oauth/{provider}/exchange` | public (native PKCE) |
| `GET` | `/me` | bearer |
| `POST` | `/password/forgot` | public |
| `POST` | `/password/reset/validate` | public |
| `POST` | `/password/reset` | public |
| `POST` | `/password/change` | bearer |
| `GET` | `/sessions` | bearer |
| `GET` | `/sessions/{sessionId}` | bearer |
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
| `POST` | `/me/deletion-request` | bearer |
| `POST` | `/me/deletion-request/cancel` | bearer |
| `PATCH` | `/me/username` | bearer |

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

**Errors:** `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` / `ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`.

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

**Errors:** `400 OAUTH_STATE_INVALID` (bad/expired/consumed state, IdP error, or `intent=link`), `403 ACCOUNT_SUSPENDED` / `ACCOUNT_DISABLED`, `404 NOT_FOUND` (provider not configured for token exchange), `409 CONFLICT` (provider subject already linked in a race).

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

`permissions` is empty until RBAC lands.

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
