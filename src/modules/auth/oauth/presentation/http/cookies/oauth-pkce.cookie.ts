import type { CookieOptions, Request, Response } from "express";

import {
  OAUTH_PKCE_COOKIE_NAME,
  OAUTH_PKCE_COOKIE_PATH,
} from "@/modules/auth/oauth/application/constants/oauth-pkce-cookie";

export type OAuthPkceCookieOptions = {
  maxAgeSeconds: number;
  secure: boolean;
  path?: string;
};

const cookieOptions = (options: OAuthPkceCookieOptions): CookieOptions => ({
  httpOnly: true,
  secure: options.secure,
  sameSite: "lax",
  path: options.path ?? OAUTH_PKCE_COOKIE_PATH,
  maxAge: options.maxAgeSeconds * 1000,
});

export const readOAuthPkceCookie = (req: Pick<Request, "cookies">): string | undefined => {
  const value = req.cookies?.[OAUTH_PKCE_COOKIE_NAME];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

export const setOAuthPkceCookie = (
  res: Response,
  codeVerifier: string,
  options: OAuthPkceCookieOptions,
): void => {
  res.cookie(OAUTH_PKCE_COOKIE_NAME, codeVerifier, cookieOptions(options));
};

export const clearOAuthPkceCookie = (res: Response, secure: boolean, path?: string): void => {
  res.clearCookie(OAUTH_PKCE_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: path ?? OAUTH_PKCE_COOKIE_PATH,
  });
};
