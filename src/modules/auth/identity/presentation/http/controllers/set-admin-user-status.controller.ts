import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type {
  AdminUserStatusAction,
  SetAdminUserStatusUseCase,
} from "@/modules/auth/identity/application/use-cases/set-admin-user-status.use-case";
import type { AdminUserIdSchema } from "@/modules/auth/identity/presentation/http/validators/admin-user-id.validator";
import type { SetAdminUserStatusSchema } from "@/modules/auth/identity/presentation/http/validators/set-admin-user-status.validator";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

const STATUS_MESSAGES: Record<AdminUserStatusAction, string> = {
  suspend: "User suspended.",
  reactivate: "User reactivated.",
  disable: "User disabled.",
  enable: "User enabled.",
};

export class SetAdminUserStatusController {
  public constructor(
    private readonly setAdminUserStatusUseCase: SetAdminUserStatusUseCase,
    private readonly action: AdminUserStatusAction,
  ) {}

  public async handle(
    req: ValidatedRequest<SetAdminUserStatusSchema | AdminUserIdSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const user = await this.setAdminUserStatusUseCase.execute({
      userId,
      sessionId,
      targetUserId: req.params.userId,
      action: this.action,
    });

    sendSuccess<UserPublicResponse>(
      res,
      HttpStatus.OK,
      STATUS_MESSAGES[this.action],
      toUserPublicResponse(user),
    );
  }
}
