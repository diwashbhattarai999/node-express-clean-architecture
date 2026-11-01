import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AssignRolePermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/assign-role-permissions.use-case";
import {
  type PermissionResponse,
  toPermissionResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/permission.response";
import type { AssignRolePermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/assign-role-permissions.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class AssignRolePermissionsController {
  public constructor(private readonly assignRolePermissionsUseCase: AssignRolePermissionsUseCase) {}

  public async handle(
    req: ValidatedRequest<AssignRolePermissionsSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const permissions = await this.assignRolePermissionsUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
      permissionIds: req.body.permissionIds,
    });

    sendSuccess<PermissionResponse[]>(
      res,
      HttpStatus.OK,
      "Role permissions updated.",
      toPermissionResponseList(permissions),
    );
  }
}
