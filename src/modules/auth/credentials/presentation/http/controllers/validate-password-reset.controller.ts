import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ValidatePasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/validate-password-reset.use-case";
import type { ValidatePasswordResetSchema } from "@/modules/auth/credentials/presentation/http/validators/validate-password-reset.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ValidatePasswordResetResponseData =
  | { valid: true; expiresAt: string }
  | { valid: false };

export class ValidatePasswordResetController {
  public constructor(private readonly validatePasswordResetUseCase: ValidatePasswordResetUseCase) {}

  public async handle(
    req: ValidatedRequest<ValidatePasswordResetSchema>,
    res: Response,
  ): Promise<void> {
    const result = await this.validatePasswordResetUseCase.execute(req.body);

    sendSuccess<ValidatePasswordResetResponseData>(
      res,
      HttpStatus.OK,
      result.valid ? "Password reset token is valid." : "Password reset token is invalid.",
      result,
    );
  }
}
