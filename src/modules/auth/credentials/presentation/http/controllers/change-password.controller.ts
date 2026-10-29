import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ChangePasswordUseCase } from "@/modules/auth/credentials/application/use-cases/change-password.use-case";
import type { ChangePasswordSchema } from "@/modules/auth/credentials/presentation/http/validators/change-password.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ChangePasswordController {
  public constructor(private readonly changePasswordUseCase: ChangePasswordUseCase) {}

  public async handle(req: ValidatedRequest<ChangePasswordSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.changePasswordUseCase.execute({
      userId,
      currentSessionId: sessionId,
      currentPassword: req.body.currentPassword,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    sendSuccess(res, HttpStatus.OK, "Password has been changed.", null);
  }
}
