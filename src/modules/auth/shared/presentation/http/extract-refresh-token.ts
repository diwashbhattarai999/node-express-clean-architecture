import type { Request } from "express";

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/modules/auth/shared/application/constants/csrf";
import { REFRESH_COOKIE_NAME } from "@/modules/auth/shared/application/constants/refresh-cookie";
import { ForbiddenError } from "@/shared/errors/forbidden-error";

export type ExtractedRefreshToken = {
  refreshToken: string;
  fromCookie: boolean;
};

export const extractRefreshToken = (req: Request): ExtractedRefreshToken | null => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return { refreshToken: cookieToken, fromCookie: true };
  }

  const bodyToken = req.body?.refreshToken;
  if (typeof bodyToken === "string" && bodyToken.trim().length > 0) {
    return { refreshToken: bodyToken.trim(), fromCookie: false };
  }

  return null;
};

/** Double-submit CSRF check for cookie-based refresh clients (AUTH_API.md §1.5). */
export const assertCsrfForCookieRefresh = (req: Request, fromCookie: boolean): void => {
  if (!fromCookie) {
    return;
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
  const csrfHeader = req.get(CSRF_HEADER_NAME);

  if (
    typeof csrfCookie !== "string" ||
    csrfCookie.length === 0 ||
    typeof csrfHeader !== "string" ||
    csrfHeader.length === 0 ||
    csrfCookie !== csrfHeader
  ) {
    throw new ForbiddenError("CSRF token missing or invalid.");
  }
};
