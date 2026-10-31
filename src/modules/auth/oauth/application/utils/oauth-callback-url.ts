export const buildOAuthCallbackUrl = (apiBaseUrl: string, provider: string): string =>
  `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/auth/oauth/${provider}/callback`;

export const appendOAuthRedirectQuery = (
  redirectUri: string,
  params: Record<string, string>,
): string => {
  try {
    const url = new URL(redirectUri);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  } catch {
    const search = new URLSearchParams(params).toString();
    const separator = redirectUri.includes("?") ? "&" : "?";

    return `${redirectUri}${separator}${search}`;
  }
};

export const appendOAuthClientState = (redirectUri: string, clientState: string): string =>
  appendOAuthRedirectQuery(redirectUri, { state: clientState });
