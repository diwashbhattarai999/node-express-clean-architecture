import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import type { BeginStepUpUseCase } from "@/modules/auth/step-up/application/use-cases/begin-step-up.use-case";
import type { BeginStepUpSchema } from "@/modules/auth/step-up/presentation/http/validators/begin-step-up.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type BeginStepUpResponseData = {
  stepUpId: string;
  method: "password" | "mfa" | "passkey";
  expiresAt: string;
  challengeId?: string;
  options?: Record<string, unknown>;
};

export class BeginStepUpController {
  public constructor(private readonly beginStepUpUseCase: BeginStepUpUseCase) {}

  public async handle(req: ValidatedRequest<BeginStepUpSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const result = await this.beginStepUpUseCase.execute(userId, sessionId, req.body);

    sendSuccess<BeginStepUpResponseData>(res, HttpStatus.OK, "Step-up challenge created.", {
      stepUpId: result.stepUpId,
      method: result.method,
      expiresAt: result.expiresAt.toISOString(),
      ...(result.challengeId !== undefined ? { challengeId: result.challengeId } : {}),
      ...(result.options !== undefined ? { options: result.options } : {}),
    });
  }
}
