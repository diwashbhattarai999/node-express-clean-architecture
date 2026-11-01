import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RemoveUserRoleUseCase } from "@/modules/auth/authorization/application/use-cases/remove-user-role.use-case";
import type { RemoveUserRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/remove-user-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RemoveUserRoleController {
  public constructor(private readonly removeUserRoleUseCase: RemoveUserRoleUseCase) {}

  public async handle(req: ValidatedRequest<RemoveUserRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.removeUserRoleUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
      roleId: req.params.roleId,
    });

    sendSuccess(res, HttpStatus.OK, "User role removed.", null);
  }
}
