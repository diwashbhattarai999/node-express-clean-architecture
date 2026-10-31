import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RequestAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/request-account-deletion.use-case";
import type { RequestAccountDeletionSchema } from "@/modules/auth/identity/presentation/http/validators/request-account-deletion.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RequestAccountDeletionResponseData = {
  scheduledFor: string;
};

export class RequestAccountDeletionController {
  public constructor(
    private readonly requestAccountDeletionUseCase: RequestAccountDeletionUseCase,
  ) {}

  public async handle(
    req: ValidatedRequest<RequestAccountDeletionSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const reason = req.body.reason && req.body.reason.length > 0 ? req.body.reason : undefined;

    const scheduledFor = await this.requestAccountDeletionUseCase.execute({
      userId,
      sessionId,
      ...(req.body.password !== undefined ? { password: req.body.password } : {}),
      ...(reason !== undefined ? { reason } : {}),
    });

    sendSuccess<RequestAccountDeletionResponseData>(
      res,
      HttpStatus.OK,
      "Account deletion scheduled.",
      { scheduledFor: scheduledFor.toISOString() },
    );
  }
}
