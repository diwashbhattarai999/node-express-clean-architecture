import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { IdentityModule } from "@/modules/auth/identity/identity.module";
import { registerSchema } from "@/modules/auth/identity/presentation/http/validators/register.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createIdentityRouter(
  authModule: IdentityModule & Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));
  router.get("/me", authModule.requireBearerAuth, asRequestHandler(authModule.getMeController));

  return router;
}
