export const MFA_ENROLL_TYPES = ["totp", "sms", "email"] as const;

export type TMfaEnrollType = (typeof MFA_ENROLL_TYPES)[number];

export const MFA_PENDING_LOGIN_TTL_MS = 10 * 60 * 1000;
export const MFA_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const MFA_OTP_TTL_MS = 10 * 60 * 1000;
export const MFA_MAX_CHALLENGE_ATTEMPTS = 5;
export const MFA_RECOVERY_CODE_COUNT = 10;
export const MFA_TOTP_PERIOD_SECONDS = 30;
export const MFA_TOTP_DIGITS = 6;
export const MFA_TOTP_WINDOW = 1;
export const MFA_TOTP_SECRET_BYTES = 20;
