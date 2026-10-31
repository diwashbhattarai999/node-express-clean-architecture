const normalizeUri = (value: string): string => value.trim().replace(/\/+$/, "");

const tryParseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const isAllowedOAuthRedirectUri = (
  redirectUri: string,
  allowedUris: readonly string[],
  frontendBaseUrl: string,
): boolean => {
  const normalized = normalizeUri(redirectUri);

  if (allowedUris.some((item) => normalizeUri(item) === normalized)) {
    return true;
  }

  const candidate = tryParseUrl(redirectUri);
  const frontend = tryParseUrl(frontendBaseUrl);

  if (!candidate || !frontend) {
    return false;
  }

  return candidate.protocol === frontend.protocol && candidate.origin === frontend.origin;
};
