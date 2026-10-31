import type { Request, Response } from "express";

import type { CancelAccountDeletionUseCase } from "@/modules/auth/identity/application/use-cases/cancel-account-deletion.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class CancelAccountDeletionController {
  public constructor(private readonly cancelAccountDeletionUseCase: CancelAccountDeletionUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.cancelAccountDeletionUseCase.execute({
      userId,
      sessionId,
    });

    sendSuccess(res, HttpStatus.OK, "Account deletion cancelled.", null);
  }
}
