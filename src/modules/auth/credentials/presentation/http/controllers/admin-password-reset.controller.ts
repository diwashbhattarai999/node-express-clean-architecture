import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AdminPasswordResetUseCase } from "@/modules/auth/credentials/application/use-cases/admin-password-reset.use-case";
import type { AdminUserIdSchema } from "@/modules/auth/identity/presentation/http/validators/admin-user-id.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class AdminPasswordResetController {
  public constructor(private readonly adminPasswordResetUseCase: AdminPasswordResetUseCase) {}

  public async handle(req: ValidatedRequest<AdminUserIdSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.adminPasswordResetUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess(res, HttpStatus.OK, "Password reset email sent.", null);
  }
}
