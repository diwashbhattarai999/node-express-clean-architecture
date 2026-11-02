import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { VerifyStepUpUseCase } from "@/modules/auth/step-up/application/use-cases/verify-step-up.use-case";
import type { VerifyStepUpSchema } from "@/modules/auth/step-up/presentation/http/validators/verify-step-up.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type VerifyStepUpResponseData = {
  stepUpToken: string;
  expiresIn: number;
};

export class VerifyStepUpController {
  public constructor(private readonly verifyStepUpUseCase: VerifyStepUpUseCase) {}

  public async handle(req: ValidatedRequest<VerifyStepUpSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const result = await this.verifyStepUpUseCase.execute(userId, sessionId, {
      stepUpId: req.body.stepUpId,
      password: req.body.password,
      code: req.body.code,
      assertion: req.body.assertion,
    });

    sendSuccess<VerifyStepUpResponseData>(res, HttpStatus.OK, "Step-up verified.", {
      stepUpToken: result.stepUpToken,
      expiresIn: result.expiresIn,
    });
  }
}
