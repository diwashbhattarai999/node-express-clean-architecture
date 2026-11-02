export const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export const PASSKEY_CHALLENGE_TYPES = ["register", "login"] as const;

export type TPasskeyChallengeType = (typeof PASSKEY_CHALLENGE_TYPES)[number];

export const DEFAULT_PASSKEY_NAME = "Passkey";
