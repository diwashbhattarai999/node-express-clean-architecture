export const RoleKey = {
  MEMBER: "member",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export type TRoleKey = (typeof RoleKey)[keyof typeof RoleKey];

export const ROLE_KEYS = Object.values(RoleKey);

export const ROLE_KEY_MIN_LENGTH = 2;
export const ROLE_KEY_MAX_LENGTH = 64;
export const ROLE_NAME_MAX_LENGTH = 100;
export const ROLE_DESCRIPTION_MAX_LENGTH = 255;

/** Starts with a letter; letters, digits, `.`, `_`, `-` afterward. Stored lowercase. */
export const ROLE_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

export const normalizeRoleKey = (key: string): string => key.trim().toLowerCase();
