import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ReplaceUserRolesUseCase } from "@/modules/auth/authorization/application/use-cases/replace-user-roles.use-case";
import {
  type RoleResponse,
  toRoleResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { ReplaceUserRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/replace-user-roles.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ReplaceUserRolesController {
  public constructor(private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase) {}

  public async handle(req: ValidatedRequest<ReplaceUserRolesSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const roles = await this.replaceUserRolesUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
      roleIds: req.body.roleIds,
    });

    sendSuccess<RoleResponse[]>(
      res,
      HttpStatus.OK,
      "User roles updated.",
      toRoleResponseList(roles),
    );
  }
}
