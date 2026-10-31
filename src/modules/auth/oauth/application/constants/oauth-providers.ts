export const OAuthProviderName = {
  GOOGLE: "google",
  GITHUB: "github",
  APPLE: "apple",
  MICROSOFT: "microsoft",
  OIDC: "oidc",
} as const;

export type TOauthProviderName = (typeof OAuthProviderName)[keyof typeof OAuthProviderName];

export const OAUTH_PROVIDER_NAMES = Object.values(OAuthProviderName);

export const isOAuthProviderName = (value: string): value is TOauthProviderName =>
  OAUTH_PROVIDER_NAMES.includes(value as TOauthProviderName);

export const OAuthIntent = {
  LOGIN: "login",
  LINK: "link",
} as const;

export type TOauthIntent = (typeof OAuthIntent)[keyof typeof OAuthIntent];

export const OAuthResponseMode = {
  REDIRECT: "redirect",
  JSON: "json",
} as const;

export type TOauthResponseMode = (typeof OAuthResponseMode)[keyof typeof OAuthResponseMode];

export const OAUTH_CODE_CHALLENGE_METHOD = "S256" as const;

export const OAUTH_AUTHORIZATION_STATE_TTL_SECONDS_DEFAULT = 600;
