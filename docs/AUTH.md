# Authentication Module

## 1. Purpose

The authentication module is responsible for:

* Account registration and authentication
* Login identity management
* Password credentials
* OAuth/OIDC identities
* Email and phone verification
* Password recovery
* Magic-link authentication
* Session management
* Access and refresh tokens
* Account linking
* Future MFA and passkey authentication

Authentication is separate from authorization.

* **Authentication:** Who is the user?
* **Authorization:** What is the user allowed to do?

---

# 2. Core Model

A `User` represents the account.

Authentication mechanisms belong to the user but are modeled independently.

```text
User
 │
 ├── Login Identities
 │     ├── Email
 │     ├── Phone
 │     └── Username
 │
 ├── Credentials
 │     ├── Password
 │     └── Passkeys
 │
 ├── External Identities
 │     ├── Google
 │     ├── GitHub
 │     ├── Apple
 │     └── Microsoft
 │
 ├── Sessions
 │
 └── MFA
```

### Important rules

* Username is never required for registration.
* Username is only a login identifier.
* A user may have multiple authentication mechanisms.
* Accounts are never automatically merged solely because emails match.
* OAuth identities must be explicitly linked to an existing account.
* A user must retain at least one viable authentication method before another is removed.

---

# 3. Account States

```text
PENDING_VERIFICATION
        │
        ▼
      ACTIVE
      /    \
     ▼      ▼
 SUSPENDED DISABLED
```

### `PENDING_VERIFICATION`

Account exists but the required identity has not been verified.

### `ACTIVE`

Account can authenticate normally.

### `SUSPENDED`

Authentication is blocked temporarily.

### `DISABLED`

Authentication is permanently/administratively blocked.

---

# 4. Registration

## 4.1 Email + Password

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "Secret123!",
  "confirmPassword": "Secret123!"
}
```

Flow:

```text
Register
   │
   ├── Validate
   ├── Normalize email
   ├── Check uniqueness
   ├── Create User
   ├── Create Password Credential
   ├── Create Verification Token
   └── Send Verification Email
```

The account remains `PENDING_VERIFICATION`.

No authenticated session is created.

---

## 4.2 Phone + Password

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "phone": "+9779812345678",
  "password": "Secret123!",
  "confirmPassword": "Secret123!"
}
```

Flow:

```text
Register
   │
   ├── Normalize phone to E.164
   ├── Check uniqueness
   ├── Create User
   ├── Create Password Credential
   ├── Create OTP Challenge
   └── Send SMS
```

The account remains `PENDING_VERIFICATION`.

---

## 4.3 OAuth

```http
GET /api/v1/auth/oauth/:provider
```

Supported providers are implementation-dependent.

Initial architecture should support:

```text
Google
GitHub
Apple
Microsoft
Generic OIDC/OAuth
```

Flow:

```text
Client
  │
  ▼
OAuth Provider
  │
  ▼
Callback
  │
  ▼
Validate Provider Identity
  │
  ├── Existing ExternalIdentity
  │        │
  │        ▼
  │      Login
  │
  └── New ExternalIdentity
           │
           ▼
       Create Account
           │
           ▼
         Login
```

OAuth provider verification is sufficient for initial account activation.

---

## 4.4 Magic Link

```http
POST /api/v1/auth/magic-link/request
```

Request:

```json
{
  "email": "user@example.com"
}
```

If the account does not exist, successful verification may create it.

```http
POST /api/v1/auth/magic-link/verify
```

The magic link is single-use and short-lived.

Successful verification creates an authenticated session.

---

# 5. Login

## 5.1 Password Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "identifier": "user@example.com",
  "password": "Secret123!"
}
```

`identifier` can be:

```text
email
phone
username
```

Flow:

```text
Login
  │
  ▼
Validate
  │
  ▼
Resolve Identifier
  │
  ▼
Find User + Credential
  │
  ▼
Check Account State
  │
  ▼
Verify Password
  │
  ▼
MFA Required?
  │
 ┌┴─────────────┐
No              Yes
│                │
▼                ▼
Create Session   MFA Challenge
│                │
│                ▼
│              Verify MFA
│                │
└───────┬────────┘
        ▼
   Issue Tokens
```

Invalid credentials must use generic errors to avoid account enumeration.

---

# 6. Access Tokens

Access tokens are short-lived and stateless.

Default:

```text
TTL: 10 minutes
```

JWT claims:

```json
{
  "sub": "user-id",
  "sid": "session-id",
  "iss": "api.example.com",
  "aud": "api",
  "iat": 1788000000,
  "exp": 1788000600,
  "jti": "token-id"
}
```

Required claims:

* `sub`
* `sid`
* `iss`
* `aud`
* `iat`
* `exp`
* `jti`

Access tokens are not stored in the database.

---

# 7. Refresh Tokens

Refresh tokens are:

* Opaque
* Cryptographically random
* Long-lived
* Stateful
* Rotated
* Revocable

Default:

```text
TTL: 30 days
```

Only the hash of the refresh token is stored.

```text
Random Token
     │
     ▼
SHA-256
     │
     ▼
Database
```

The raw token is never persisted.

---

# 8. Sessions

A session represents one authenticated login instance.

Example:

```text
User
 ├── Chrome Session
 ├── iPhone Session
 └── Firefox Session
```

Conceptual model:

```text
Session
 ├── id
 ├── userId
 ├── familyId
 ├── refreshTokenHash
 ├── createdAt
 ├── lastUsedAt
 ├── expiresAt
 ├── revokedAt?
 ├── replacedBySessionId?
 ├── ipAddress?
 └── userAgent?
```

`familyId` groups refresh-token rotations belonging to the same authentication chain.

---

# 9. Refresh Flow

```text
POST /api/v1/auth/refresh
          │
          ▼
Extract Refresh Token
          │
          ▼
Hash Token
          │
          ▼
Find Session
          │
          ▼
Validate Session
          │
          ├── Expired ──► Reject
          ├── Revoked ──► Reject
          └── Valid
                 │
                 ▼
          Rotate Refresh Token
                 │
          ┌──────┴──────┐
          ▼             ▼
      Revoke Old     Create New
        Token          Token
          │             │
          └──────┬──────┘
                 ▼
          Issue New Access Token
```

Every successful refresh rotates the refresh token.

---

# 10. Refresh Token Reuse Detection

Example:

```text
R1 → R2 → R3
```

If `R1` is used again:

```text
R1
 │
 ▼
Already Consumed
 │
 ▼
REUSE DETECTED
 │
 ▼
Revoke Session Family
```

All sessions/tokens belonging to that family become invalid.

The user must authenticate again.

---

# 11. Logout

## Current Session

```http
POST /api/v1/auth/logout
```

Revokes the current session.

## All Sessions

```http
POST /api/v1/auth/logout-all
```

Revokes every active session belonging to the user.

---

# 12. Session Management

```http
GET /api/v1/auth/sessions
```

Returns the user's active sessions.

```http
DELETE /api/v1/auth/sessions/:sessionId
```

Revokes a specific session.

A user should be able to identify sessions using safe metadata such as:

```text
device
browser
OS
approximate location
last activity
created date
```

Sensitive token material is never exposed.

---

# 13. Email Verification

```http
POST /api/v1/auth/email/verification/resend
POST /api/v1/auth/email/verify
```

Verification tokens are:

* Cryptographically random
* Stored hashed
* Single-use
* Expiring
* Invalidated when replaced

Default lifetime:

```text
24 hours
```

Successful verification activates the account when all required verification conditions are satisfied.

---

# 14. Phone Verification

```http
POST /api/v1/auth/phone/verification/resend
POST /api/v1/auth/phone/verify
```

OTP:

```text
6 digits
5–10 minute lifetime
Single-use
Attempt-limited
Rate-limited
```

OTP hashes are stored instead of plaintext OTPs.

---

# 15. Password Recovery

## Request

```http
POST /api/v1/auth/password/forgot
```

Request:

```json
{
  "email": "user@example.com"
}
```

The response must not reveal whether an account exists.

## Reset

```http
POST /api/v1/auth/password/reset
```

Request:

```json
{
  "token": "...",
  "password": "NewSecret123!",
  "confirmPassword": "NewSecret123!"
}
```

Flow:

```text
Reset Request
     │
     ▼
Generate Token
     │
     ▼
Send Email
     │
     ▼
User Opens Link
     │
     ▼
Validate Token
     │
     ▼
Update Password
     │
     ▼
Consume Token
     │
     ▼
Revoke All Sessions
```

---

# 16. Change Password

```http
POST /api/v1/auth/password/change
```

Request:

```json
{
  "currentPassword": "...",
  "password": "NewSecret123!",
  "confirmPassword": "NewSecret123!"
}
```

After a successful change:

```text
Current Session → remains active
Other Sessions  → revoked
```

Password reset revokes **all sessions**.

---

# 17. Username

Username is optional and never used for registration.

```http
PUT /api/v1/auth/username
```

Request:

```json
{
  "username": "diwash"
}
```

Rules:

* Globally unique
* Case-insensitive uniqueness
* Normalized
* Length constrained
* Character constrained
* Reserved names supported

Username can subsequently be used as a login identifier.

---

# 18. Account Linking

Authenticated users can link additional authentication methods.

Examples:

```text
User
 ├── Email
 ├── Phone
 ├── Username
 ├── Password
 ├── Google
 └── GitHub
```

OAuth linking:

```http
POST /api/v1/auth/identities/:provider/link
```

Unlink:

```http
DELETE /api/v1/auth/identities/:provider
```

Account merging must never happen automatically.

A user must authenticate with the existing account before linking an external identity that belongs to another account.

A user cannot remove their last viable authentication mechanism.

---

# 19. Current User

```http
GET /api/v1/auth/me
```

Returns the authenticated user's account information.

Authentication is provided through the access token.

---

# 20. Future MFA

Planned:

```http
POST   /api/v1/auth/mfa/setup
POST   /api/v1/auth/mfa/verify
DELETE /api/v1/auth/mfa
```

Potential mechanisms:

```text
TOTP
Recovery Codes
WebAuthn / Passkeys
```

MFA must be completed before creating a fully authenticated session.

---

# 21. Future Passkeys

Planned:

```http
POST /api/v1/auth/passkeys/register/options
POST /api/v1/auth/passkeys/register
POST /api/v1/auth/passkeys/login/options
POST /api/v1/auth/passkeys/login
```

Passkeys are treated as authentication credentials belonging to the user.

---

# 22. Complete API Inventory

```text
REGISTRATION
POST   /auth/register
GET    /auth/oauth/:provider
POST   /auth/magic-link/request
POST   /auth/magic-link/verify

LOGIN
POST   /auth/login
GET    /auth/oauth/:provider
POST   /auth/magic-link/request
POST   /auth/magic-link/verify

SESSION
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all
GET    /auth/sessions
DELETE /auth/sessions/:sessionId

CURRENT USER
GET    /auth/me

EMAIL
POST   /auth/email/verification/resend
POST   /auth/email/verify

PHONE
POST   /auth/phone/verification/resend
POST   /auth/phone/verify

PASSWORD
POST   /auth/password/forgot
POST   /auth/password/reset
POST   /auth/password/change

USERNAME
PUT    /auth/username

IDENTITIES
POST   /auth/identities/:provider/link
DELETE /auth/identities/:provider

MFA
POST   /auth/mfa/setup
POST   /auth/mfa/verify
DELETE /auth/mfa

PASSKEYS
POST   /auth/passkeys/register/options
POST   /auth/passkeys/register
POST   /auth/passkeys/login/options
POST   /auth/passkeys/login
```

---

# 23. Security Requirements

### Passwords

* Argon2id
* Never store plaintext
* Never log passwords
* Strong password policy
* Password reset invalidates sessions

### Tokens

* CSPRNG
* Hash tokens at rest
* Short-lived access tokens
* Refresh-token rotation
* Refresh-token reuse detection
* Single-use verification/reset tokens

### Authentication

* Generic credential errors
* Account enumeration protection
* Rate limiting
* MFA support
* Session revocation

### Browser security

* HTTPS
* `HttpOnly`
* `Secure`
* Appropriate `SameSite`
* CSRF protection where cookie-based authentication is used
* Strict CORS configuration

### Logging

Never log:

```text
passwords
access tokens
refresh tokens
reset tokens
verification tokens
OTP values
```

Security events should be auditable.

---

# 24. High-Level User Flow

```text
                         ┌──────────┐
                         │ Visitor  │
                         └────┬─────┘
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
         Email Signup    Phone Signup      OAuth Signup
              │               │                │
              ▼               ▼                ▼
        Verify Email     Verify Phone      Provider Verified
              │               │                │
              └───────────────┼────────────────┘
                              ▼
                         ┌──────────┐
                         │   User   │
                         └────┬─────┘
                              │
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
             Password       OAuth        Magic Link
                │             │              │
                └─────────────┼──────────────┘
                              ▼
                       MFA Required?
                         /       \
                       No         Yes
                       │           │
                       │        Verify MFA
                       │           │
                       └─────┬─────┘
                             ▼
                         SESSION
                       /          \
                      ▼            ▼
                Access Token   Refresh Token
                      │            │
                      ▼            ▼
                  API Calls     Rotation
                                   │
                                   ▼
                              New Tokens
```

---

# 25. Architecture Boundary

```text
Presentation
     │
     ▼
Application
     │
     ▼
Domain
     ▲
     │
Infrastructure
```

The domain/application layer must not depend on:

```text
Express
JWT library
Argon2 implementation
PostgreSQL
Redis
OAuth SDK
Email provider
SMS provider
```

Those are infrastructure adapters.

---

# 26. Implementation Phases

### Phase 1 — Foundation

* Authentication domain
* Identity model
* Credential model
* Session model
* Domain errors
* Ports

### Phase 2 — Password Authentication

* Registration
* Argon2id
* Login
* Access tokens
* Sessions

### Phase 3 — Refresh Security

* Refresh tokens
* Rotation
* Reuse detection
* Logout
* Session revocation

### Phase 4 — Verification & Recovery

* Email verification
* Phone verification
* Password reset
* Change password
* Magic links

### Phase 5 — Identity Management

* Username
* Account linking
* OAuth/OIDC

### Phase 6 — Production Hardening

* Rate limiting
* Security headers
* CSRF
* Audit events
* Security logging
* Session/device management

### Phase 7 — Advanced Authentication

* MFA
* Recovery codes
* Passkeys
* Advanced OAuth/OIDC

---

# 27. Design Principle

The fundamental model is:

```text
User
  ↓
has identities
  ↓
has credentials
  ↓
authenticates
  ↓
creates session
  ↓
session issues access/refresh tokens
  ↓
refresh token rotates
  ↓
session eventually expires/revokes
```

Authentication mechanisms can evolve without changing the fundamental `User` account model.
