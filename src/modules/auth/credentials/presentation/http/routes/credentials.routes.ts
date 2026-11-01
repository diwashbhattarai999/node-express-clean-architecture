import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { CredentialsModule } from "@/modules/auth/credentials/credentials.module";
import { changePasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/change-password.validator";
import { consumeMagicLinkSchema } from "@/modules/auth/credentials/presentation/http/validators/consume-magic-link.validator";
import { forgotPasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/forgot-password.validator";
import { loginSchema } from "@/modules/auth/credentials/presentation/http/validators/login.validator";
import { requestMagicLinkSchema } from "@/modules/auth/credentials/presentation/http/validators/request-magic-link.validator";
import { resetPasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/reset-password.validator";
import { validatePasswordResetSchema } from "@/modules/auth/credentials/presentation/http/validators/validate-password-reset.validator";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";

export function createCredentialsRouter(
  authModule: CredentialsModule & Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.post("/login", validate(loginSchema), asHandler(authModule.loginController));
  router.post(
    "/magic-link/request",
    validate(requestMagicLinkSchema),
    asHandler(authModule.requestMagicLinkController),
  );
  router.post(
    "/magic-link/consume",
    validate(consumeMagicLinkSchema),
    asHandler(authModule.consumeMagicLinkController),
  );
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
