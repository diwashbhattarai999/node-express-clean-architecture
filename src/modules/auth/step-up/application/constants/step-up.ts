export const STEP_UP_METHODS = ["password", "mfa", "passkey"] as const;

export type TStepUpMethod = (typeof STEP_UP_METHODS)[number];

export const STEP_UP_CHALLENGE_TTL_MS = 5 * 60 * 1000;

export const STEP_UP_TOKEN_PURPOSE = "step_up";

export const STEP_UP_TOKEN_HEADER = "x-step-up-token";
