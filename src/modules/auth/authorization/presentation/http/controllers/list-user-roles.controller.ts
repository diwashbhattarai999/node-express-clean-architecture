import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListUserRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-user-roles.use-case";
import {
  type RoleResponse,
  toRoleResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { ListUserRolesSchema } from "@/modules/auth/authorization/presentation/http/validators/list-user-roles.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListUserRolesController {
  public constructor(private readonly listUserRolesUseCase: ListUserRolesUseCase) {}

  public async handle(req: ValidatedRequest<ListUserRolesSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const roles = await this.listUserRolesUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess<RoleResponse[]>(
      res,
      HttpStatus.OK,
      "User roles retrieved.",
      toRoleResponseList(roles),
    );
  }
}
