import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { VerifyPhoneUseCase } from "@/modules/auth/application/use-cases/verify-phone.use-case";
import { setAuthSessionCookies } from "@/modules/auth/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/presentation/http/mappers/user-public.response";
import type { VerifyPhoneSchema } from "@/modules/auth/presentation/http/validators/verify-phone.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type VerifyPhoneControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type VerifyPhoneResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class VerifyPhoneController {
  public constructor(
    private readonly verifyPhoneUseCase: VerifyPhoneUseCase,
    private readonly options: VerifyPhoneControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<VerifyPhoneSchema>, res: Response): Promise<void> {
    const result = await this.verifyPhoneUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<VerifyPhoneResponseData>(res, HttpStatus.OK, "Phone verified.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
