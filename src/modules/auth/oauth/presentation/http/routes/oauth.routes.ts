import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { OAuthModule } from "@/modules/auth/oauth/oauth.module";
import { exchangeOAuthCodeSchema } from "@/modules/auth/oauth/presentation/http/validators/exchange-oauth-code.validator";
import { handleOAuthCallbackSchema } from "@/modules/auth/oauth/presentation/http/validators/handle-oauth-callback.validator";
import { startOAuthAuthorizationSchema } from "@/modules/auth/oauth/presentation/http/validators/start-oauth-authorization.validator";

export function createOAuthRouter(authModule: OAuthModule): IRouter {
  const router = Router();

  router.get(
    "/oauth/:provider/authorize",
    validate(startOAuthAuthorizationSchema),
    asHandler(authModule.startOAuthAuthorizationController),
  );

  router.get(
    "/oauth/:provider/callback",
    validate(handleOAuthCallbackSchema),
    asHandler(authModule.handleOAuthCallbackController),
  );

  router.post(
    "/oauth/:provider/exchange",
    validate(exchangeOAuthCodeSchema),
    asHandler(authModule.exchangeOAuthCodeController),
  );

  return router;
}
