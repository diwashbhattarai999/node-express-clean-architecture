import type { RequestHandler } from "express";

import { REFRESH_COOKIE_NAME } from "@/modules/auth/application/constants/refresh-cookie";
import { assertCsrfForCookieRefresh } from "@/modules/auth/presentation/http/extract-refresh-token";
import { asyncMiddleware } from "@/modules/auth/presentation/http/middleware/async-middleware";

export const assertCsrfWhenRefreshCookie: RequestHandler = asyncMiddleware((req, _res, next) => {
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const fromCookie = typeof cookieToken === "string" && cookieToken.length > 0;
  assertCsrfForCookieRefresh(req, fromCookie);
  next();
});
