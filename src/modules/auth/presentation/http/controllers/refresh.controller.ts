import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { RefreshUseCase } from "@/modules/auth/application/use-cases/refresh.use-case";
import { setAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import { getAuthContext } from "@/modules/auth/presentation/http/middleware/auth-context";
import type { RefreshSchema } from "@/modules/auth/presentation/http/validators/refresh.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type RefreshControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type RefreshResponseData = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class RefreshController {
  public constructor(
    private readonly refreshUseCase: RefreshUseCase,
    private readonly options: RefreshControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<RefreshSchema>, res: Response): Promise<void> {
    const refreshToken = getAuthContext(req)?.refresh?.refreshToken;
    if (!refreshToken) {
      throw new TokenInvalidError("The refresh token is invalid.");
    }

    const result = await this.refreshUseCase.execute(refreshToken, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<RefreshResponseData>(res, HttpStatus.OK, "Token refreshed.", {
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
