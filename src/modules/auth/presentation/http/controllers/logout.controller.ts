import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { LogoutUseCase } from "@/modules/auth/application/use-cases/logout.use-case";
import { clearAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import { getAuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";
import type { LogoutSchema } from "@/modules/auth/presentation/http/validators/logout.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type LogoutControllerOptions = {
  secureCookies: boolean;
};

export class LogoutController {
  public constructor(
    private readonly logoutUseCase: LogoutUseCase,
    private readonly options: LogoutControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<LogoutSchema>, res: Response): Promise<void> {
    const auth = getAuthContext(req);

    await this.logoutUseCase.execute({
      refreshToken: auth?.refresh?.refreshToken ?? null,
      sessionId: auth?.bearer?.sessionId ?? null,
    });

    clearAuthSessionCookies(res, this.options.secureCookies);

    sendSuccess(res, HttpStatus.OK, "Signed out.", null);
  }
}
