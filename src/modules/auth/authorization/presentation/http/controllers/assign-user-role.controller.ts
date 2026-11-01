import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { AssignUserRoleUseCase } from "@/modules/auth/authorization/application/use-cases/assign-user-role.use-case";
import {
  type RoleResponse,
  toRoleResponse,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { AssignUserRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/assign-user-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class AssignUserRoleController {
  public constructor(private readonly assignUserRoleUseCase: AssignUserRoleUseCase) {}

  public async handle(req: ValidatedRequest<AssignUserRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const role = await this.assignUserRoleUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
      roleId: req.body.roleId,
    });

    sendSuccess<RoleResponse>(res, HttpStatus.CREATED, "Role assigned.", toRoleResponse(role));
  }
}
