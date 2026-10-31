import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { addEmailSchema } from "@/modules/auth/identity/presentation/http/validators/add-email.validator";
import { changeUsernameSchema } from "@/modules/auth/identity/presentation/http/validators/change-username.validator";
import { updateOwnProfileSchema } from "@/modules/auth/identity/presentation/http/validators/update-own-profile.validator";

/**
 * HTTP mount for `/api/v1/users`.
 * Self-service `/me` routes are implemented in auth/identity for now
 * (login identities); mount them here so v1 only wires module roots.
 */
export function createUsersRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.get(
    "/me/identities",
    authModule.requireBearerAuth,
    asRequestHandler(authModule.listOwnIdentitiesController),
  );

  router.post(
    "/me/emails",
    validate(addEmailSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.addEmailController),
  );

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

  router.patch(
    "/me",
    validate(updateOwnProfileSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.updateOwnProfileController),
  );

  return router;
}
