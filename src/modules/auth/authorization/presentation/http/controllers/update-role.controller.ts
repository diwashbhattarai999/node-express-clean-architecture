import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { UpdateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/update-role.use-case";
import {
  type RoleResponse,
  toRoleResponse,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { UpdateRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/update-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class UpdateRoleController {
  public constructor(private readonly updateRoleUseCase: UpdateRoleUseCase) {}

  public async handle(req: ValidatedRequest<UpdateRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const { name, description } = req.body;

    const role = await this.updateRoleUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    });

    sendSuccess<RoleResponse>(res, HttpStatus.OK, "Role updated.", toRoleResponse(role));
  }
}
