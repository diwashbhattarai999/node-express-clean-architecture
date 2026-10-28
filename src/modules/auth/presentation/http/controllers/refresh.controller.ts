import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { RefreshUseCase } from "@/modules/auth/application/use-cases/refresh.use-case";
import { setAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import {
  assertCsrfForCookieRefresh,
  extractRefreshToken,
} from "@/modules/auth/presentation/http/extract-refresh-token";
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
    const extracted = extractRefreshToken(req);
    if (!extracted) {
      throw new TokenInvalidError("The refresh token is invalid.");
    }

    assertCsrfForCookieRefresh(req, extracted.fromCookie);

    const result = await this.refreshUseCase.execute(extracted.refreshToken, {
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
