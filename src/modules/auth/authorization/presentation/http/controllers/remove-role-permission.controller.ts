import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RemoveRolePermissionUseCase } from "@/modules/auth/authorization/application/use-cases/remove-role-permission.use-case";
import type { RemoveRolePermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/remove-role-permission.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class RemoveRolePermissionController {
  public constructor(private readonly removeRolePermissionUseCase: RemoveRolePermissionUseCase) {}

  public async handle(
    req: ValidatedRequest<RemoveRolePermissionSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.removeRolePermissionUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
      permissionId: req.params.permissionId,
    });

    sendSuccess(res, HttpStatus.OK, "Role permission removed.", null);
  }
}
