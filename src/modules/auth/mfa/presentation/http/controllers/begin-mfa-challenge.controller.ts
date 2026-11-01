import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { BeginMfaChallengeUseCase } from "@/modules/auth/mfa/application/use-cases/begin-mfa-challenge.use-case";
import type { BeginMfaChallengeSchema } from "@/modules/auth/mfa/presentation/http/validators/begin-mfa-challenge.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type BeginMfaChallengeResponseData = {
  challengeId: string;
  expiresAt: string;
};

export class BeginMfaChallengeController {
  public constructor(private readonly beginMfaChallengeUseCase: BeginMfaChallengeUseCase) {}

  public async handle(
    req: ValidatedRequest<BeginMfaChallengeSchema>,
    res: Response,
  ): Promise<void> {
    const result = await this.beginMfaChallengeUseCase.execute(req.body);

    sendSuccess<BeginMfaChallengeResponseData>(res, HttpStatus.OK, "MFA challenge started.", {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
    });
  }
}
