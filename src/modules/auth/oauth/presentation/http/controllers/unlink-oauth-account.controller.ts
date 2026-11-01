import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { UnlinkOAuthAccountUseCase } from "@/modules/auth/oauth/application/use-cases/unlink-oauth-account.use-case";
import type { UnlinkOAuthAccountSchema } from "@/modules/auth/oauth/presentation/http/validators/unlink-oauth-account.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export class UnlinkOAuthAccountController {
  public constructor(private readonly unlinkOAuthAccountUseCase: UnlinkOAuthAccountUseCase) {}

  public async handle(
    req: ValidatedRequest<UnlinkOAuthAccountSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    await this.unlinkOAuthAccountUseCase.execute({
      userId,
      sessionId,
      provider: req.params.provider,
    });

    sendSuccess(res, HttpStatus.OK, "OAuth account unlinked.", null);
  }
}
