import type { TLoginIdentityType } from "@/modules/auth/shared/application/types/auth.types";

const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export type ResolvedLoginIdentifier = {
  type: TLoginIdentityType;
  normalizedIdentifier: string;
};

/**
 * Maps a free-form login identifier to identity type + normalized value.
 */
export const resolveLoginIdentifier = (identifier: string): ResolvedLoginIdentifier => {
  const trimmed = identifier.trim();

  if (trimmed.includes("@")) {
    return {
      type: "email",
      normalizedIdentifier: trimmed.toLowerCase(),
    };
  }

  if (E164_PHONE_REGEX.test(trimmed)) {
    return {
      type: "phone",
      normalizedIdentifier: trimmed,
    };
  }

  return {
    type: "username",
    normalizedIdentifier: trimmed.toLowerCase(),
  };
};
