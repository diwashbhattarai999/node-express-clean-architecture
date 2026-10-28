import type { RequestHandler } from "express";

import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import { extractBearerToken } from "@/modules/auth/presentation/http/extract-bearer-token";
import { asyncMiddleware } from "@/modules/auth/presentation/http/middleware/async-middleware";
import { setAuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";

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
