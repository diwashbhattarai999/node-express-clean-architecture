import type { RequestHandler } from "express";

import { asyncMiddleware } from "@/modules/auth/shared/presentation/http/middleware/async-middleware";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { STEP_UP_TOKEN_HEADER } from "@/modules/auth/step-up/application/constants/step-up";
import { StepUpRequiredError } from "@/modules/auth/step-up/application/errors/step-up-required.error";
import type { IStepUpTokenSigner } from "@/modules/auth/step-up/application/ports/step-up-token.signer";

/**
 * Requires a valid `X-Step-Up-Token` matching the current bearer user/session.
 * Must run after `requireBearerAuth`.
 */
export const createRequireStepUp = (stepUpTokenSigner: IStepUpTokenSigner): RequestHandler =>
  asyncMiddleware(async (req, _res, next) => {
    const bearer = getBearerAuth(req);
    const header = req.get(STEP_UP_TOKEN_HEADER)?.trim();

    if (!header) {
      throw new StepUpRequiredError();
    }

    const claims = await stepUpTokenSigner.verify(header);

    if (claims.userId !== bearer.userId || claims.sessionId !== bearer.sessionId) {
      throw new StepUpRequiredError("The step-up token does not match this session.");
    }

    next();
  });
