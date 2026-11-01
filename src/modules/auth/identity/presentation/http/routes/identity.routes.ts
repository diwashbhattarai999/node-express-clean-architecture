import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { IdentityModule } from "@/modules/auth/identity/identity.module";
import { checkIdentifierSchema } from "@/modules/auth/identity/presentation/http/validators/check-identifier.validator";
import { registerSchema } from "@/modules/auth/identity/presentation/http/validators/register.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createIdentityRouter(
  authModule: IdentityModule & Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));
  router.post(
    "/identifiers/check",
    validate(checkIdentifierSchema),
    asHandler(authModule.checkIdentifierController),
  );
  router.get("/me", authModule.requireBearerAuth, asRequestHandler(authModule.getMeController));

  return router;
}
