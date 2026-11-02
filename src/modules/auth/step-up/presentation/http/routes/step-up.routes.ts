import { type IRouter, Router } from "express";

import { asHandler, validate } from "@/app/middleware/validation";
import type { AuthHttpGuards } from "@/modules/auth/shared/presentation/http/auth-http-guards";
import { beginStepUpSchema } from "@/modules/auth/step-up/presentation/http/validators/begin-step-up.validator";
import { verifyStepUpSchema } from "@/modules/auth/step-up/presentation/http/validators/verify-step-up.validator";
import type { StepUpModule } from "@/modules/auth/step-up/step-up.module";

export function createStepUpRouter(
  authModule: Pick<StepUpModule, "beginStepUpController" | "verifyStepUpController"> &
    Pick<AuthHttpGuards, "requireBearerAuth">,
): IRouter {
  const router = Router();

  router.post(
    "/step-up/verify",
    validate(verifyStepUpSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.verifyStepUpController),
  );
  router.post(
    "/step-up/challenge",
    validate(beginStepUpSchema),
    authModule.requireBearerAuth,
    asHandler(authModule.beginStepUpController),
  );

  return router;
}
