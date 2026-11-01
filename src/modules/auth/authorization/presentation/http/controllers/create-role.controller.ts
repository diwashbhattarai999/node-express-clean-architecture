import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { CreateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/create-role.use-case";
import {
  type RoleResponse,
  toRoleResponse,
} from "@/modules/auth/authorization/presentation/http/mappers/role.response";
import type { CreateRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/create-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class CreateRoleController {
  public constructor(private readonly createRoleUseCase: CreateRoleUseCase) {}

  public async handle(req: ValidatedRequest<CreateRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const { key, name, description } = req.body;

    const role = await this.createRoleUseCase.execute({
      userId,
      sessionId,
      key,
      name,
      description,
    });

    sendSuccess<RoleResponse>(res, HttpStatus.CREATED, "Role created.", toRoleResponse(role));
  }
}
