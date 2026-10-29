import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { changePasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/change-password.validator";
import { forgotPasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/forgot-password.validator";
import { loginSchema } from "@/modules/auth/credentials/presentation/http/validators/login.validator";
import { resetPasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/reset-password.validator";
import { validatePasswordResetSchema } from "@/modules/auth/credentials/presentation/http/validators/validate-password-reset.validator";

export function createCredentialsRouter(authModule: AuthModule): IRouter {
  const router = Router();

  router.post("/login", validate(loginSchema), asHandler(authModule.loginController));
  router.post(
    "/password/forgot",
    validate(forgotPasswordSchema),
    asHandler(authModule.forgotPasswordController),
  );
  router.post(
    "/password/reset/validate",
    validate(validatePasswordResetSchema),
    asHandler(authModule.validatePasswordResetController),
  );
  router.post(
    "/password/reset",
    validate(resetPasswordSchema),
    asHandler(authModule.resetPasswordController),
  );
  router.post(
    "/password/change",
    validate(changePasswordSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.changePasswordController),
  );

  return router;
}
