import type { RequestHandler } from "express";

import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { assertCsrfWhenRefreshCookie } from "@/modules/auth/shared/presentation/http/middleware/assert-csrf-when-refresh-cookie.middleware";
import {
  createOptionalBearerAuth,
  createRequireBearerAuth,
} from "@/modules/auth/shared/presentation/http/middleware/require-bearer-auth.middleware";
import { requireRefreshAuth } from "@/modules/auth/shared/presentation/http/middleware/require-refresh-auth.middleware";
import { createRequireRefreshOrBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/require-refresh-or-bearer-auth.middleware";

export type AuthHttpGuards = {
  requireRefreshAuth: RequestHandler;
  requireRefreshOrBearerAuth: RequestHandler;
  requireBearerAuth: RequestHandler;
  optionalBearerAuth: RequestHandler;
  assertCsrfWhenRefreshCookie: RequestHandler;
};

export const createAuthHttpGuards = (accessTokenSigner: IAccessTokenSigner): AuthHttpGuards => ({
  requireRefreshAuth,
  requireRefreshOrBearerAuth: createRequireRefreshOrBearerAuth(accessTokenSigner),
  requireBearerAuth: createRequireBearerAuth(accessTokenSigner),
  optionalBearerAuth: createOptionalBearerAuth(accessTokenSigner),
  assertCsrfWhenRefreshCookie,
});
