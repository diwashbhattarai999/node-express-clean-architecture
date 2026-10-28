import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyEmailUseCase } from "@/modules/auth/application/use-cases/verify-email.use-case";
import { setAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/presentation/http/mappers/user-public.response";
import type { VerifyEmailSchema } from "@/modules/auth/presentation/http/validators/verify-email.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type VerifyEmailControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type VerifyEmailResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class VerifyEmailController {
  public constructor(
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly options: VerifyEmailControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<VerifyEmailSchema>, res: Response): Promise<void> {
    const result = await this.verifyEmailUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<VerifyEmailResponseData>(res, HttpStatus.OK, "Email verified.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
