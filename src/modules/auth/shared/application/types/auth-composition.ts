export type AuthEmailOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

export type AuthSessionOptions = {
  refreshTokenTtlSeconds: number;
};

export type AuthCookieOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};
