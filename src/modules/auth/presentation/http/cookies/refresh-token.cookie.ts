import type { CookieOptions, Response } from "express";

import { CSRF_COOKIE_NAME } from "@/modules/auth/application/constants/csrf";
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "@/modules/auth/application/constants/refresh-cookie";
import { generateCsrfToken } from "@/modules/auth/application/utils/generate-csrf-token";

export type AuthSessionCookieOptions = {
  maxAgeSeconds: number;
  secure: boolean;
};

const baseCookieOptions = (options: AuthSessionCookieOptions): CookieOptions => ({
  secure: options.secure,
  sameSite: "lax",
  path: REFRESH_COOKIE_PATH,
  maxAge: options.maxAgeSeconds * 1000,
});

export const setAuthSessionCookies = (
  res: Response,
  refreshToken: string,
  options: AuthSessionCookieOptions,
): void => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...baseCookieOptions(options),
    httpOnly: true,
  });

  res.cookie(CSRF_COOKIE_NAME, generateCsrfToken(), {
    ...baseCookieOptions(options),
    httpOnly: false,
  });
};

export const setRefreshTokenCookie = setAuthSessionCookies;

export const clearAuthSessionCookies = (res: Response, secure: boolean): void => {
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  };

  res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
  res.clearCookie(CSRF_COOKIE_NAME, { ...clearOptions, httpOnly: false });
};

export const clearRefreshTokenCookie = clearAuthSessionCookies;
