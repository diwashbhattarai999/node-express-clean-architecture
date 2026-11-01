import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import type {
  HandleOAuthCallbackResult,
  HandleOAuthCallbackUseCase,
} from "@/modules/auth/oauth/application/use-cases/handle-oauth-callback.use-case";
import { appendOAuthRedirectQuery } from "@/modules/auth/oauth/application/utils/oauth-callback-url";
import {
  clearOAuthPkceCookie,
  readOAuthPkceCookie,
} from "@/modules/auth/oauth/presentation/http/cookies/oauth-pkce.cookie";
import type { HandleOAuthCallbackSchema } from "@/modules/auth/oauth/presentation/http/validators/handle-oauth-callback.validator";
import { setAuthSessionCookies } from "@/modules/auth/shared/presentation/http/cookies/refresh-token.cookie";
import { HttpStatus } from "@/shared/http/http-status";

export type HandleOAuthCallbackControllerOptions = {
  refreshTokenTtlSeconds: number;
  secureCookies: boolean;
};

export class HandleOAuthCallbackController {
  public constructor(
    private readonly handleOAuthCallbackUseCase: HandleOAuthCallbackUseCase,
    private readonly options: HandleOAuthCallbackControllerOptions,
  ) {}

  public async handle(
    req: ValidatedRequest<HandleOAuthCallbackSchema>,
    res: Response,
  ): Promise<void> {
    const codeVerifier = readOAuthPkceCookie(req);

    let result: HandleOAuthCallbackResult;

    try {
      result = await this.handleOAuthCallbackUseCase.execute(
        {
          provider: req.params.provider,
          ...(req.query.code !== undefined ? { code: req.query.code } : {}),
          ...(req.query.state !== undefined ? { state: req.query.state } : {}),
          ...(req.query.error !== undefined ? { error: req.query.error } : {}),
          ...(req.query.error_description !== undefined
            ? { errorDescription: req.query.error_description }
            : {}),
          ...(codeVerifier !== undefined ? { codeVerifier } : {}),
        },
        {
          ipAddress: req.ip ?? null,
          userAgent: req.get("user-agent") ?? null,
        },
      );
    } catch (error) {
      clearOAuthPkceCookie(res, this.options.secureCookies);
      throw error;
    }

    clearOAuthPkceCookie(res, this.options.secureCookies);

    if (result.outcome === "handoff") {
      res.redirect(
        HttpStatus.FOUND,
        appendOAuthRedirectQuery(result.redirectUri, {
          code: result.code,
          state: result.clientState,
        }),
      );
      return;
    }

    setAuthSessionCookies(res, result.refreshToken, {
      maxAgeSeconds: this.options.refreshTokenTtlSeconds,
      secure: this.options.secureCookies,
    });

    res.redirect(
      HttpStatus.FOUND,
      appendOAuthRedirectQuery(result.redirectUri, {
        state: result.clientState,
      }),
    );
  }
}
