import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { DeleteAdminUserUseCase } from "@/modules/auth/identity/application/use-cases/delete-admin-user.use-case";
import type { DeleteAdminUserSchema } from "@/modules/auth/identity/presentation/http/validators/delete-admin-user.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class DeleteAdminUserController {
  public constructor(private readonly deleteAdminUserUseCase: DeleteAdminUserUseCase) {}

  public async handle(req: ValidatedRequest<DeleteAdminUserSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.deleteAdminUserUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess(res, HttpStatus.OK, "User deleted.", null);
  }
}
