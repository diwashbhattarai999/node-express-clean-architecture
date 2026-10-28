import { type IRouter, Router } from "express";

import { asHandler, asRequestHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { registerSchema } from "@/modules/auth/identity/presentation/http/validators/register.validator";

export function createIdentityRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));
  router.get("/me", authModule.requireBearerAuth, asRequestHandler(authModule.getMeController));

  return router;
}
