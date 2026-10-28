import type { RequestHandler } from "express";

import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { extractBearerToken } from "@/modules/auth/shared/presentation/http/extract-bearer-token";
import {
  assertCsrfForCookieRefresh,
  extractRefreshToken,
} from "@/modules/auth/shared/presentation/http/extract-refresh-token";
import { asyncMiddleware } from "@/modules/auth/shared/presentation/http/middleware/async-middleware";
import type { AuthContext } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { setAuthContext } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";

/**
 * AUTH_API logout mode: refresh cookie/body and/or bearer (+ CSRF if cookie).
 * Invalid bearer is ignored when a refresh token is also present.
 */
export const createRequireRefreshOrBearerAuth = (
  accessTokenSigner: IAccessTokenSigner,
): RequestHandler =>
  asyncMiddleware(async (req, _res, next) => {
    const extractedRefresh = extractRefreshToken(req);
    const accessToken = extractBearerToken(req);

    if (!extractedRefresh && !accessToken) {
      throw new UnauthorizedError("Refresh or access token is required.");
    }

    const auth: AuthContext = {};

    if (extractedRefresh) {
      assertCsrfForCookieRefresh(req, extractedRefresh.fromCookie);
      auth.refresh = extractedRefresh;
    }

    if (accessToken) {
      try {
        const claims = await accessTokenSigner.verify(accessToken);
        auth.bearer = {
          accessToken,
          userId: claims.userId,
          sessionId: claims.sessionId,
        };
      } catch (error) {
        if (!extractedRefresh) {
          throw error;
        }
      }
    }

    setAuthContext(req, auth);
    next();
  });
