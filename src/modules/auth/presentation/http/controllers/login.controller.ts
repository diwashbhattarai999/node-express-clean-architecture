import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { LoginUseCase } from "@/modules/auth/application/use-cases/login.use-case";
import { setRefreshTokenCookie } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/presentation/http/mappers/user-public.response";
import type { LoginSchema } from "@/modules/auth/presentation/http/validators/login.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type LoginControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type LoginResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class LoginController {
  public constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly options: LoginControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<LoginSchema>, res: Response): Promise<void> {
    const result = await this.loginUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setRefreshTokenCookie(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<LoginResponseData>(res, HttpStatus.OK, "Signed in.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
