import { type IRouter, type RequestHandler, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { asBearerAuthenticatedRequest } from "@/modules/auth/presentation/http/middleware/auth-context";
import { forgotPasswordSchema } from "@/modules/auth/presentation/http/validators/forgot-password.validator";
import { loginSchema } from "@/modules/auth/presentation/http/validators/login.validator";
import { logoutSchema } from "@/modules/auth/presentation/http/validators/logout.validator";
import { refreshSchema } from "@/modules/auth/presentation/http/validators/refresh.validator";
import { registerSchema } from "@/modules/auth/presentation/http/validators/register.validator";
import { resendEmailVerificationSchema } from "@/modules/auth/presentation/http/validators/resend-email-verification.validator";
import { resendPhoneVerificationSchema } from "@/modules/auth/presentation/http/validators/resend-phone-verification.validator";
import { resetPasswordSchema } from "@/modules/auth/presentation/http/validators/reset-password.validator";
import { verifyEmailSchema } from "@/modules/auth/presentation/http/validators/verify-email.validator";
import { verifyPhoneSchema } from "@/modules/auth/presentation/http/validators/verify-phone.validator";

export function createAuthRouter(authModule: AuthModule): IRouter {
  const router = Router();

  const getMeHandler: RequestHandler = (req, res, next) => {
    Promise.resolve(
      authModule.getMeController.handle(asBearerAuthenticatedRequest(req), res),
    ).catch(next);
  };

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));
  router.post("/login", validate(loginSchema), asHandler(authModule.loginController));
  router.post(
    "/refresh",
    validate(refreshSchema),
    authModule.requireRefreshAuth,
    asHandler(authModule.refreshController),
  );
  router.post(
    "/logout",
    validate(logoutSchema),
    authModule.requireRefreshOrBearerAuth,
    asHandler(authModule.logoutController),
  );
  router.get("/me", authModule.requireBearerAuth, getMeHandler);
  router.post(
    "/password/forgot",
    validate(forgotPasswordSchema),
    asHandler(authModule.forgotPasswordController),
  );
  router.post(
    "/password/reset",
    validate(resetPasswordSchema),
    asHandler(authModule.resetPasswordController),
  );
  router.post(
    "/email/verify",
    validate(verifyEmailSchema),
    asHandler(authModule.verifyEmailController),
  );
  router.post(
    "/email/verification/resend",
    validate(resendEmailVerificationSchema),
    asHandler(authModule.resendEmailVerificationController),
  );
  router.post(
    "/phone/verify",
    validate(verifyPhoneSchema),
    asHandler(authModule.verifyPhoneController),
  );
  router.post(
    "/phone/verification/resend",
    validate(resendPhoneVerificationSchema),
    asHandler(authModule.resendPhoneVerificationController),
  );

  return router;
}
