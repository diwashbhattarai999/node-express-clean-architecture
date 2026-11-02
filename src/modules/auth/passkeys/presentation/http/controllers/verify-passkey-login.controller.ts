import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyPasskeyLoginUseCase } from "@/modules/auth/passkeys/application/use-cases/verify-passkey-login.use-case";
import type { VerifyPasskeyLoginSchema } from "@/modules/auth/passkeys/presentation/http/validators/verify-passkey-login.validator";
import { setAuthSessionCookies } from "@/modules/auth/shared/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type VerifyPasskeyLoginControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type VerifyPasskeyLoginResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class VerifyPasskeyLoginController {
  public constructor(
    private readonly verifyPasskeyLoginUseCase: VerifyPasskeyLoginUseCase,
    private readonly options: VerifyPasskeyLoginControllerOptions,
  ) {}

  public async handle(
    req: ValidatedRequest<VerifyPasskeyLoginSchema>,
    res: Response,
  ): Promise<void> {
    const result = await this.verifyPasskeyLoginUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<VerifyPasskeyLoginResponseData>(res, HttpStatus.OK, "Signed in.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
