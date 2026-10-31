import type { RequestHandler } from "express";

import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { extractBearerToken } from "@/modules/auth/shared/presentation/http/extract-bearer-token";
import { asyncMiddleware } from "@/modules/auth/shared/presentation/http/middleware/async-middleware";
import { setAuthContext } from "@/modules/auth/shared/presentation/http/middleware/auth-context";

/**
 * AUTH_API `bearer` mode: valid access JWT required.
 * Wire via createAuthModule; reuse on /auth/me and protected routes.
 */
export const createRequireBearerAuth = (accessTokenSigner: IAccessTokenSigner): RequestHandler =>
  asyncMiddleware(async (req, _res, next) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      throw new TokenInvalidError("Access token is required.");
    }

    const claims = await accessTokenSigner.verify(accessToken);
    setAuthContext(req, {
      bearer: {
        accessToken,
        userId: claims.userId,
        sessionId: claims.sessionId,
      },
    });
    next();
  });

/** AUTH_API `bearer or public with token`: attach bearer when present; invalid bearer still fails. */
export const createOptionalBearerAuth = (accessTokenSigner: IAccessTokenSigner): RequestHandler =>
  asyncMiddleware(async (req, _res, next) => {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      next();
      return;
    }

    const claims = await accessTokenSigner.verify(accessToken);
    setAuthContext(req, {
      bearer: {
        accessToken,
        userId: claims.userId,
        sessionId: claims.sessionId,
      },
    });
    next();
  });
