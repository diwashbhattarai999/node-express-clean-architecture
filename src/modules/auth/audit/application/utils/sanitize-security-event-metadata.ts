const SENSITIVE_METADATA_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "tokenhash",
  "accesstoken",
  "refreshtoken",
  "secret",
  "authorization",
  "cookie",
  "rawtoken",
  "code",
  "otp",
  "hash",
]);

export const sanitizeSecurityEventMetadata = (
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined => {
  if (!metadata) {
    return undefined;
  }

  const sanitized = sanitizeValue(metadata);

  if (
    sanitized === undefined ||
    (typeof sanitized === "object" &&
      sanitized !== null &&
      !Array.isArray(sanitized) &&
      Object.keys(sanitized).length === 0)
  ) {
    return undefined;
  }

  return sanitized as Record<string, unknown>;
};

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_METADATA_KEYS.has(key.toLowerCase())) {
        continue;
      }

      result[key] = sanitizeValue(nested);
    }

    return result;
  }

  return value;
};
