import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { CheckPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/check-permission.use-case";
import type { CheckPermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/check-permission.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type CheckPermissionResponseData = {
  allowed: boolean;
};

export class CheckPermissionController {
  public constructor(private readonly checkPermissionUseCase: CheckPermissionUseCase) {}

  public async handle(req: ValidatedRequest<CheckPermissionSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.checkPermissionUseCase.execute({
      userId,
      sessionId,
      permission: req.body.permission,
      ...(req.body.resourceId !== undefined ? { resourceId: req.body.resourceId } : {}),
    });

    sendSuccess<CheckPermissionResponseData>(res, HttpStatus.OK, "Permission checked.", {
      allowed: result.allowed,
    });
  }
}
