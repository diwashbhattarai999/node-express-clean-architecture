import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { changeUsernameSchema } from "@/modules/auth/identity/presentation/http/validators/change-username.validator";

/**
 * HTTP mount for `/api/v1/users`.
 * Self-service `/me` routes are implemented in auth/identity for now
 * (login identities); mount them here so v1 only wires module roots.
 */
export function createUsersRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.get(
    "/me",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.getOwnProfileController),
  );

  router.patch(
    "/me/username",
    validate(changeUsernameSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.changeUsernameController),
  );

  return router;
}
