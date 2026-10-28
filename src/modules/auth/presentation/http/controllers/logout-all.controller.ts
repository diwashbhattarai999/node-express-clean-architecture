import type { Request, Response } from "express";

import type { LogoutAllUseCase } from "@/modules/auth/application/use-cases/logout-all.use-case";
import { clearAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import { getBearerAuth } from "@/modules/auth/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type LogoutAllControllerOptions = {
  secureCookies: boolean;
};

export type LogoutAllResponseData = {
  revokedCount: number;
};

export class LogoutAllController {
  public constructor(
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly options: LogoutAllControllerOptions,
  ) {}

  public async handle(req: Request, res: Response): Promise<void> {
    const { userId } = getBearerAuth(req);
    const result = await this.logoutAllUseCase.execute(userId);

    clearAuthSessionCookies(res, this.options.secureCookies);

    sendSuccess<LogoutAllResponseData>(res, HttpStatus.OK, "Signed out of all sessions.", {
      revokedCount: result.revokedCount,
    });
  }
}
