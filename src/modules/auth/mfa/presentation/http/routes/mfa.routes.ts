import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { MfaModule } from "@/modules/auth/mfa/mfa.module";
import { beginMfaChallengeSchema } from "@/modules/auth/mfa/presentation/http/validators/begin-mfa-challenge.validator";
import { verifyMfaChallengeSchema } from "@/modules/auth/mfa/presentation/http/validators/verify-mfa-challenge.validator";

export function createMfaRouter(
  authModule: Pick<MfaModule, "beginMfaChallengeController" | "verifyMfaChallengeController">,
): IRouter {
  const router = Router();

  router.post(
    "/mfa/challenge/verify",
    validate(verifyMfaChallengeSchema),
    asHandler(authModule.verifyMfaChallengeController),
  );
  router.post(
    "/mfa/challenge",
    validate(beginMfaChallengeSchema),
    asHandler(authModule.beginMfaChallengeController),
  );

  return router;
}
