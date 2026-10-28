import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { createAuthModule } from "@/modules/auth/auth.module";
import { registerSchema } from "@/modules/auth/presentation/http/validators/register.validator";
import { resendEmailVerificationSchema } from "@/modules/auth/presentation/http/validators/resend-email-verification.validator";
import { resendPhoneVerificationSchema } from "@/modules/auth/presentation/http/validators/resend-phone-verification.validator";
import { verifyEmailSchema } from "@/modules/auth/presentation/http/validators/verify-email.validator";
import { verifyPhoneSchema } from "@/modules/auth/presentation/http/validators/verify-phone.validator";

export function createAuthRouter(authModule: ReturnType<typeof createAuthModule>): IRouter {
  const router = Router();

  router.post("/register", validate(registerSchema), asHandler(authModule.registerController));
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
