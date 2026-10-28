import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ResendPhoneVerificationUseCase } from "@/modules/auth/verification/application/use-cases/resend-phone-verification.use-case";
import type { ResendPhoneVerificationSchema } from "@/modules/auth/verification/presentation/http/validators/resend-phone-verification.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ResendPhoneVerificationController {
  public constructor(
    private readonly resendPhoneVerificationUseCase: ResendPhoneVerificationUseCase,
  ) {}

  public async handle(
    req: ValidatedRequest<ResendPhoneVerificationSchema>,
    res: Response,
  ): Promise<void> {
    await this.resendPhoneVerificationUseCase.execute(req.body);

    sendSuccess(
      res,
      HttpStatus.OK,
      "If an account needs verification, a new code has been sent.",
      null,
    );
  }
}
