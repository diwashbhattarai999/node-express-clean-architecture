import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "pending_verification",
  "active",
  "suspended",
  "disabled",
]);

export const loginIdentityTypeEnum = pgEnum("login_identity_type", ["email", "phone", "username"]);

export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email_verification",
  "phone_verification",
  "password_reset",
  "magic_link",
]);

export const mfaFactorTypeEnum = pgEnum("mfa_factor_type", ["totp", "sms", "email", "webauthn"]);

export const securityEventOutcomeEnum = pgEnum("security_event_outcome", [
  "success",
  "failure",
  "blocked",
]);

export const securityEventTypeEnum = pgEnum("security_event_type", [
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
]);

export const sessionRevocationReasonEnum = pgEnum("session_revocation_reason", [
  "logout",
  "logout_all",
  "rotation_reuse",
  "admin",
  "password_reset",
  "expired",
]);

export type TUserStatus = (typeof userStatusEnum.enumValues)[number];
export type TLoginIdentityType = (typeof loginIdentityTypeEnum.enumValues)[number];
export type TAuthTokenType = (typeof authTokenTypeEnum.enumValues)[number];
export type TMfaFactorType = (typeof mfaFactorTypeEnum.enumValues)[number];
export type TSecurityEventOutcome = (typeof securityEventOutcomeEnum.enumValues)[number];
export type TSecurityEventType = (typeof securityEventTypeEnum.enumValues)[number];
export type TSessionRevocationReason = (typeof sessionRevocationReasonEnum.enumValues)[number];
