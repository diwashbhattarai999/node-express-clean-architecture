import { randomInt } from "node:crypto";

import { MFA_RECOVERY_CODE_COUNT } from "@/modules/auth/mfa/application/constants/mfa";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomGroup = (): string => {
  let group = "";

  for (let i = 0; i < 4; i += 1) {
    group += ALPHABET[randomInt(ALPHABET.length)];
  }

  return group;
};

export const generateRecoveryCodes = (count = MFA_RECOVERY_CODE_COUNT): string[] =>
  Array.from({ length: count }, () => `${randomGroup()}-${randomGroup()}`);

export const normalizeRecoveryCode = (code: string): string =>
  code.trim().toUpperCase().replace(/[\s-]/g, "");
