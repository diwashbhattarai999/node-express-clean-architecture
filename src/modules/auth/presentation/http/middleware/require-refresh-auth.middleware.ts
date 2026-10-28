import type { RequestHandler } from "express";

import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import {
  assertCsrfForCookieRefresh,
  extractRefreshToken,
} from "@/modules/auth/presentation/http/extract-refresh-token";
import { asyncMiddleware } from "@/modules/auth/presentation/http/middleware/async-middleware";
import { setAuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";

/**
 * Middleware to require refresh authentication.
 *
 * @param req - The request object.
 * @param _res - The response object.
 * @param next - The next function.
 * @returns The next function.
 * @throws {TokenInvalidError} If the refresh token is invalid.
 */
export const requireRefreshAuth: RequestHandler = asyncMiddleware((req, _res, next) => {
  const extracted = extractRefreshToken(req);
  if (!extracted) {
    throw new TokenInvalidError("The refresh token is invalid.");
  }

  assertCsrfForCookieRefresh(req, extracted.fromCookie);
  setAuthContext(req, { refresh: extracted });
  next();
});
