import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type { ConsumeMagicLinkUseCase } from "@/modules/auth/credentials/application/use-cases/consume-magic-link.use-case";
import type { ConsumeMagicLinkSchema } from "@/modules/auth/credentials/presentation/http/validators/consume-magic-link.validator";
import { setAuthSessionCookies } from "@/modules/auth/shared/presentation/http/cookies/refresh-token.cookie";
import {
  toUserPublicResponse,
  type UserPublicResponse,
} from "@/modules/auth/shared/presentation/http/mappers/user-public.response";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type ConsumeMagicLinkControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export type ConsumeMagicLinkResponseData = {
  user: UserPublicResponse;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export class ConsumeMagicLinkController {
  public constructor(
    private readonly consumeMagicLinkUseCase: ConsumeMagicLinkUseCase,
    private readonly options: ConsumeMagicLinkControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<ConsumeMagicLinkSchema>, res: Response): Promise<void> {
    const result = await this.consumeMagicLinkUseCase.execute(req.body, {
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    sendSuccess<ConsumeMagicLinkResponseData>(res, HttpStatus.OK, "Signed in.", {
      user: toUserPublicResponse(result.user),
      accessToken: result.accessToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      refreshToken: result.refreshToken,
    });
  }
}
