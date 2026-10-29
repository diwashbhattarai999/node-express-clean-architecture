import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { RevokeSessionUseCase } from "@/modules/auth/sessions/application/use-cases/revoke-session.use-case";
import type { RevokeSessionSchema } from "@/modules/auth/sessions/presentation/http/validators/revoke-session.validator";
import { clearAuthSessionCookies } from "@/modules/auth/shared/presentation/http/cookies/refresh-token.cookie";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RevokeSessionControllerOptions = {
  secureCookies: boolean;
};

export class RevokeSessionController {
  public constructor(
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly options: RevokeSessionControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<RevokeSessionSchema>, res: Response): Promise<void> {
    const { userId, sessionId: currentSessionId } = getBearerAuth(req);

    const result = await this.revokeSessionUseCase.execute({
      userId,
      sessionId: req.params.sessionId,
      currentSessionId,
    });

    if (result.wasCurrent) {
      clearAuthSessionCookies(res, this.options.secureCookies);
    }

    sendSuccess(res, HttpStatus.OK, "Session revoked.", null);
  }
}
