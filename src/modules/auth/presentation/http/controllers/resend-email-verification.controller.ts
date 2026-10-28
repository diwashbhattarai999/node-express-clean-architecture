import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ResendEmailVerificationUseCase } from "@/modules/auth/application/use-cases/resend-email-verification.use-case";
import type { ResendEmailVerificationSchema } from "@/modules/auth/presentation/http/validators/resend-email-verification.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ResendEmailVerificationController {
  public constructor(
    private readonly resendEmailVerificationUseCase: ResendEmailVerificationUseCase,
  ) {}

  public async handle(
    req: ValidatedRequest<ResendEmailVerificationSchema>,
    res: Response,
  ): Promise<void> {
    await this.resendEmailVerificationUseCase.execute(req.body);

    sendSuccess(
      res,
      HttpStatus.OK,
      "If an account needs verification, a new email has been sent.",
      null,
    );
  }
}
