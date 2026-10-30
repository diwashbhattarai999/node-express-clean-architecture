/** Allowed display length after trim (normalized form is lowercased). */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Starts with a letter; letters, digits, `.`, `_`, `-` afterward. */
export const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

/** Case-insensitive reserved handles (matched against normalized username). */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "auth",
  "help",
  "me",
  "null",
  "root",
  "support",
  "system",
  "undefined",
  "user",
  "users",
]);

export const normalizeUsername = (username: string): string => username.trim().toLowerCase();

export const isReservedUsername = (normalizedUsername: string): boolean =>
  RESERVED_USERNAMES.has(normalizedUsername);
