import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { createAuthModule } from "@/modules/auth/auth.module";
import { registerSchema } from "@/modules/auth/presentation/http/validators/register.validator";

export function createAuthRouter(authModule: ReturnType<typeof createAuthModule>): IRouter {
  const router = Router();

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));

  return router;
}
