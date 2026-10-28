import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuthModule } from "@/modules/auth/auth.module";
import { resendEmailVerificationSchema } from "@/modules/auth/verification/presentation/http/validators/resend-email-verification.validator";
import { resendPhoneVerificationSchema } from "@/modules/auth/verification/presentation/http/validators/resend-phone-verification.validator";
import { verifyEmailSchema } from "@/modules/auth/verification/presentation/http/validators/verify-email.validator";
import { verifyPhoneSchema } from "@/modules/auth/verification/presentation/http/validators/verify-phone.validator";

export function createVerificationRouter(authModule: AuthModule): IRouter {
  const router = Router();

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
