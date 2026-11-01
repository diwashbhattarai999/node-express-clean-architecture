import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthorizationModule } from "@/modules/auth/authorization/authorization.module";
import { checkPermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/check-permission.validator";
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

  router.get(
    "/me/permissions",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listOwnPermissionsController),
  );

  router.post(
    "/check",
    validate(checkPermissionSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.checkPermissionController),
  );

  return router;
}
