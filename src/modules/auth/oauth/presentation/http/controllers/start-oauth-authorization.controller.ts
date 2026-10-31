import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { OAuthResponseMode } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { StartOAuthAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-authorization.use-case";
import { setOAuthPkceCookie } from "@/modules/auth/oauth/presentation/http/cookies/oauth-pkce.cookie";
import type { StartOAuthAuthorizationSchema } from "@/modules/auth/oauth/presentation/http/validators/start-oauth-authorization.validator";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type StartOAuthAuthorizationControllerOptions = {
  secureCookies: boolean;
  stateTtlSeconds: number;
};

export type StartOAuthAuthorizationResponseData = {
  authorizationUrl: string;
};

export class StartOAuthAuthorizationController {
  public constructor(
    private readonly startOAuthAuthorizationUseCase: StartOAuthAuthorizationUseCase,
    private readonly options: StartOAuthAuthorizationControllerOptions,
  ) {}

  public async handle(
    req: ValidatedRequest<StartOAuthAuthorizationSchema>,
    res: Response,
  ): Promise<void> {
    const result = await this.startOAuthAuthorizationUseCase.execute({
      provider: req.params.provider,
      redirectUri: req.query.redirectUri,
      state: req.query.state,
      intent: req.query.intent,
      responseMode:
        req.query.response === OAuthResponseMode.JSON
          ? OAuthResponseMode.JSON
          : OAuthResponseMode.REDIRECT,
      ...(req.query.codeChallenge !== undefined ? { codeChallenge: req.query.codeChallenge } : {}),
      ...(req.query.codeChallengeMethod !== undefined
        ? { codeChallengeMethod: req.query.codeChallengeMethod }
        : {}),
    });

    if (result.generatedCodeVerifier !== undefined) {
      setOAuthPkceCookie(res, result.generatedCodeVerifier, {
        secure: this.options.secureCookies,
        maxAgeSeconds: this.options.stateTtlSeconds,
      });
    }

    if (result.responseMode === OAuthResponseMode.JSON) {
      sendSuccess<StartOAuthAuthorizationResponseData>(
        res,
        HttpStatus.OK,
        "OAuth authorization URL created.",
        { authorizationUrl: result.authorizationUrl },
      );
      return;
    }

    res.redirect(HttpStatus.FOUND, result.authorizationUrl);
  }
}
