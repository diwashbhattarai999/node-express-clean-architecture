import { type IRouter, Router } from "express";

import { asRequestHandler } from "@/app/middleware/validation";
import type { AuthorizationModule } from "@/modules/auth/authorization/authorization.module";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createAuthorizationRouter(
  authModule: AuthorizationModule & Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.get(
    "/me/roles",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listOwnRolesController),
  );

  return router;
}
