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

export type AuthWebAuthnOptions = {
  rpID: string;
  rpName: string;
  origin: string | string[];
};

export type AuthStepUpOptions = {
  tokenTtlSeconds: number;
};
