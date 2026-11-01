import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AdminUserIdSchema } from "@/modules/auth/identity/presentation/http/validators/admin-user-id.validator";
import type { RevokeAdminUserSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-admin-user-sessions.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RevokeAdminUserSessionsResponseData = {
  revokedCount: number;
};

export class RevokeAdminUserSessionsController {
  public constructor(
    private readonly revokeAdminUserSessionsUseCase: RevokeAdminUserSessionsUseCase,
  ) {}

  public async handle(req: ValidatedRequest<AdminUserIdSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.revokeAdminUserSessionsUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess<RevokeAdminUserSessionsResponseData>(res, HttpStatus.OK, "Sessions revoked.", {
      revokedCount: result.revokedCount,
    });
  }
}
