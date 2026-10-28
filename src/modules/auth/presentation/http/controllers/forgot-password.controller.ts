import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ForgotPasswordUseCase } from "@/modules/auth/application/use-cases/forgot-password.use-case";
import type { ForgotPasswordSchema } from "@/modules/auth/presentation/http/validators/forgot-password.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ForgotPasswordController {
  public constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {}

  public async handle(req: ValidatedRequest<ForgotPasswordSchema>, res: Response): Promise<void> {
    await this.forgotPasswordUseCase.execute(req.body);

    sendSuccess(
      res,
      HttpStatus.OK,
      "If an account exists for that email, a password reset link has been sent.",
      null,
    );
  }
}
