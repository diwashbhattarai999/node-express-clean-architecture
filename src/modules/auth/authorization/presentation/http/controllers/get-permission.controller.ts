import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { GetPermissionUseCase } from "@/modules/auth/authorization/application/use-cases/get-permission.use-case";
import {
  type PermissionResponse,
  toPermissionResponse,
} from "@/modules/auth/authorization/presentation/http/mappers/permission.response";
import type { GetPermissionSchema } from "@/modules/auth/authorization/presentation/http/validators/get-permission.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class GetPermissionController {
  public constructor(private readonly getPermissionUseCase: GetPermissionUseCase) {}

  public async handle(req: ValidatedRequest<GetPermissionSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const permission = await this.getPermissionUseCase.execute({
      userId,
      sessionId,
      permissionId: req.params.permissionId,
    });

    sendSuccess<PermissionResponse>(
      res,
      HttpStatus.OK,
      "Permission retrieved.",
      toPermissionResponse(permission),
    );
  }
}
