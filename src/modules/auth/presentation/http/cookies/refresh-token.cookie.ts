import type { CookieOptions, Response } from "express";

import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "@/modules/auth/application/constants/refresh-cookie";

export type RefreshCookieOptions = {
  maxAgeSeconds: number;
  secure: boolean;
};

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string,
  options: RefreshCookieOptions,
): void => {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: options.maxAgeSeconds * 1000,
  };

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
};

export const clearRefreshTokenCookie = (res: Response, secure: boolean): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  });
};
