import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ExchangeOAuthCodeUseCase } from "@/modules/auth/oauth/application/use-cases/exchange-oauth-code.use-case";
import type { ExchangeOAuthCodeSchema } from "@/modules/auth/oauth/presentation/http/validators/exchange-oauth-code.validator";
import { setAuthSessionCookies } from "@/modules/auth/shared/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ExchangeOAuthCodeControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type ExchangeOAuthCodeResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class ExchangeOAuthCodeController {
  public constructor(
    private readonly exchangeOAuthCodeUseCase: ExchangeOAuthCodeUseCase,
    private readonly options: ExchangeOAuthCodeControllerOptions,
  ) {}

  public async handle(
    req: ValidatedRequest<ExchangeOAuthCodeSchema>,
    res: Response,
  ): Promise<void> {
    const result = await this.exchangeOAuthCodeUseCase.execute(
      {
        provider: req.params.provider,
        code: req.body.code,
        codeVerifier: req.body.codeVerifier,
        redirectUri: req.body.redirectUri,
        state: req.body.state,
      },
      {
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      },
    );

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<ExchangeOAuthCodeResponseData>(res, HttpStatus.OK, "Signed in.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
