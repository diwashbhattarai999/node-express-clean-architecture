import type { CookieOptions, Response } from "express";

import {
  OAUTH_PKCE_COOKIE_NAME,
  OAUTH_PKCE_COOKIE_PATH,
} from "@/modules/auth/oauth/application/constants/oauth-pkce-cookie";

export type OAuthPkceCookieOptions = {
  maxAgeSeconds: number;
  secure: boolean;
};

const cookieOptions = (options: OAuthPkceCookieOptions): CookieOptions => ({
  httpOnly: true,
  secure: options.secure,
  sameSite: "lax",
  path: OAUTH_PKCE_COOKIE_PATH,
  maxAge: options.maxAgeSeconds * 1000,
});

export const setOAuthPkceCookie = (
  res: Response,
  codeVerifier: string,
  options: OAuthPkceCookieOptions,
): void => {
  res.cookie(OAUTH_PKCE_COOKIE_NAME, codeVerifier, cookieOptions(options));
};

export const clearOAuthPkceCookie = (res: Response, secure: boolean): void => {
  res.clearCookie(OAUTH_PKCE_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: OAUTH_PKCE_COOKIE_PATH,
  });
};
