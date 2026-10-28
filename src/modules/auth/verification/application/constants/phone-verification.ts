/** OTP lifetime for phone verification (AUTH.md). */
export const PHONE_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Max failed verify attempts before the OTP is locked out. */
export const PHONE_OTP_MAX_ATTEMPTS = 5; // 5 failed attempts
