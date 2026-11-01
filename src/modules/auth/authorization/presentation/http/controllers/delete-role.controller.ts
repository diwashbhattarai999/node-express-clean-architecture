import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DeleteRoleUseCase } from "@/modules/auth/authorization/application/use-cases/delete-role.use-case";
import type { DeleteRoleSchema } from "@/modules/auth/authorization/presentation/http/validators/delete-role.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class DeleteRoleController {
  public constructor(private readonly deleteRoleUseCase: DeleteRoleUseCase) {}

  public async handle(req: ValidatedRequest<DeleteRoleSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.deleteRoleUseCase.execute({
      userId,
      sessionId,
      roleId: req.params.roleId,
    });

    sendSuccess(res, HttpStatus.OK, "Role deleted.", null);
  }
}
