import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetRoleUseCase } from "@/modules/auth/authorization/application/use-cases/get-role.use-case";
import {
  type PermissionResponse,
  toPermissionResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/permission.response";
import {
  type RoleResponse,
  toRoleResponse,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { GetRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/get-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type GetRoleResponseData = {
  role: RoleResponse;
  permissions: PermissionResponse[];
};

export class GetRoleController {
  public constructor(private readonly getRoleUseCase: GetRoleUseCase) {}

  public async handle(req: ValidatedRequest<GetRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.getRoleUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
    });

    sendSuccess<GetRoleResponseData>(res, HttpStatus.OK, "Role retrieved.", {
      role: toRoleResponse(result.role),
      permissions: toPermissionResponseList(result.permissions),
    });
  }
}
