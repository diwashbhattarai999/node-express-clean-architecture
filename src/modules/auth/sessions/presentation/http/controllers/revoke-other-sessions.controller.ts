import type { Request, Response } from "express";

import type { RevokeOtherSessionsUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-other-sessions.use-case";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RevokeOtherSessionsResponseData = {
  revokedCount: number;
};

export class RevokeOtherSessionsController {
  public constructor(private readonly revokeOtherSessionsUseCase: RevokeOtherSessionsUseCase) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.revokeOtherSessionsUseCase.execute({
      userId,
      currentSessionId: sessionId,
    });

    sendSuccess<RevokeOtherSessionsResponseData>(res, HttpStatus.OK, "Other sessions revoked.", {
      revokedCount: result.revokedCount,
    });
  }
}
