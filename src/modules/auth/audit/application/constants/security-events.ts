export const SECURITY_EVENT_TYPES = [
  "login_success",
  "login_failure",
  "logout",
  "logout_all",
  "refresh",
  "refresh_reuse",
  "password_change",
  "password_reset",
  "identity_linked",
  "identity_unlinked",
  "mfa_enabled",
  "mfa_disabled",
  "session_revoked",
  "passkey_registered",
  "passkey_removed",
  "passkey_used",
] as const;

export type TSecurityEventType = (typeof SECURITY_EVENT_TYPES)[number];

export const SECURITY_EVENT_OUTCOMES = ["success", "failure", "blocked"] as const;

export type TSecurityEventOutcome = (typeof SECURITY_EVENT_OUTCOMES)[number];

export const AUDIT_LOG_EXPORT_FORMATS = ["csv", "json"] as const;

export type TAuditLogExportFormat = (typeof AUDIT_LOG_EXPORT_FORMATS)[number];
