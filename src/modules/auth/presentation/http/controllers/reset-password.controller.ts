import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ResetPasswordUseCase } from "@/modules/auth/application/use-cases/reset-password.use-case";
import { clearAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import type { ResetPasswordSchema } from "@/modules/auth/presentation/http/validators/reset-password.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ResetPasswordControllerOptions = {
  secureCookies: boolean;
};

export class ResetPasswordController {
  public constructor(
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly options: ResetPasswordControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<ResetPasswordSchema>, res: Response): Promise<void> {
    await this.resetPasswordUseCase.execute(req.body);

    clearAuthSessionCookies(res, this.options.secureCookies);

    sendSuccess(res, HttpStatus.OK, "Password has been reset.", null);
  }
}
