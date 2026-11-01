import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ListUserPermissionsUseCase } from "@/modules/auth/authorization/application/use-cases/list-user-permissions.use-case";
import type { ListUserPermissionsSchema } from "@/modules/auth/authorization/presentation/http/validators/list-user-permissions.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ListUserPermissionsResponseData = {
  permissions: string[];
};

export class ListUserPermissionsController {
  public constructor(private readonly listUserPermissionsUseCase: ListUserPermissionsUseCase) {}

  public async handle(
    req: ValidatedRequest<ListUserPermissionsSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.listUserPermissionsUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
    });

    sendSuccess<ListUserPermissionsResponseData>(res, HttpStatus.OK, "Permissions retrieved.", {
      permissions: result.permissions,
    });
  }
}
