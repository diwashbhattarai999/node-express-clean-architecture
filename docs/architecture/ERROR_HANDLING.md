# Error handling conventions

## Hierarchy

| Layer | Responsibility |
| --- | --- |
| Application / auth shared | Throw specific `AppError` subclasses with stable `ErrorCode` |
| Presentation validation | Zod failures → `ValidationError` (422 + field errors) |
| Infrastructure | Translate unique violations / vendor failures; do not leak SQL |
| `errorHandler` | Map `AppError` / `ZodError` → JSON; log with `requestId`; hide unexpected messages outside local |

## Stable client codes

Prefer additive `ErrorCode` values over overloading `FORBIDDEN`. Examples:

- Account state: `ACCOUNT_SUSPENDED`, `ACCOUNT_DISABLED`, `ACCOUNT_NOT_VERIFIED`
- RBAC: `PERMISSION_DENIED`
- Step-up / MFA: `STEP_UP_REQUIRED`, `MFA_REQUIRED`

## Async Express

Use `asHandler` / `asRequestHandler` so rejected promises reach `next(err)`. Do not swallow errors in controllers.
