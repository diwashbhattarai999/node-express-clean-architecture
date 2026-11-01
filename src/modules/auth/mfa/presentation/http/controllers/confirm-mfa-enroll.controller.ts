import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ConfirmMfaEnrollUseCase } from "@/modules/auth/mfa/application/use-cases/confirm-mfa-enroll.use-case";
import type { ConfirmMfaEnrollSchema } from "@/modules/auth/mfa/presentation/http/validators/confirm-mfa-enroll.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ConfirmMfaEnrollResponseData = {
  recoveryCodes: string[];
};

export class ConfirmMfaEnrollController {
  public constructor(private readonly confirmMfaEnrollUseCase: ConfirmMfaEnrollUseCase) {}

  public async handle(req: ValidatedRequest<ConfirmMfaEnrollSchema>, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.confirmMfaEnrollUseCase.execute(userId, req.body);

    sendSuccess<ConfirmMfaEnrollResponseData>(
      res,
      HttpStatus.OK,
      "MFA enabled. Store these recovery codes; they will not be shown again.",
      { recoveryCodes: result.recoveryCodes },
    );
  }
}
