import type { Request, Response } from "express";

import type { ListOwnRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-roles.use-case";
import {
  type RoleResponse,
  toRoleResponseList,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class ListOwnRolesController {
  public constructor(private readonly listOwnRolesUseCase: ListOwnRolesUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.listOwnRolesUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess<RoleResponse[]>(
      res,
      HttpStatus.OK,
      "Roles retrieved.",
      toRoleResponseList(result.roles),
    );
  }
}
