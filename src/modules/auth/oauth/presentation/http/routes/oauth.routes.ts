import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { startOAuthAuthorizationSchema } from "@/modules/auth/oauth/presentation/http/validators/start-oauth-authorization.validator";

export function createOAuthRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.get(
    "/oauth/:provider/authorize",
    validate(startOAuthAuthorizationSchema),
    asHandler(authModule.startOAuthAuthorizationController),
  );

  return router;
}
