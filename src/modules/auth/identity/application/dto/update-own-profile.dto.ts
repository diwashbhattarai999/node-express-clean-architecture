export type UpdateOwnProfileDto = {
  displayName?: string | null;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  locale?: string | null;
  timezone?: string | null;
  bio?: string | null;
};

const PROFILE_FIELD_KEYS = [
  "displayName",
  "avatarUrl",
  "firstName",
  "lastName",
  "locale",
  "timezone",
  "bio",
] as const;

export const pickDefinedProfileFields = (input: {
  displayName?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  locale?: string | null | undefined;
  timezone?: string | null | undefined;
  bio?: string | null | undefined;
}): UpdateOwnProfileDto => {
  const patch: UpdateOwnProfileDto = {};

  for (const key of PROFILE_FIELD_KEYS) {
    const value = input[key];
    if (value !== undefined) {
      patch[key] = value;
    }
  }

  return patch;
};
