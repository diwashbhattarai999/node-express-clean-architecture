import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { OAuthResponseMode } from "@/modules/auth/oauth/application/constants/oauth-providers";
import type { StartOAuthLinkAuthorizationUseCase } from "@/modules/auth/oauth/application/use-cases/start-oauth-link-authorization.use-case";
import { setOAuthPkceCookie } from "@/modules/auth/oauth/presentation/http/cookies/oauth-pkce.cookie";
import type { StartOAuthAuthorizationSchema } from "@/modules/auth/oauth/presentation/http/validators/start-oauth-authorization.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type StartOAuthLinkAuthorizationControllerOptions = {
  secureCookies: boolean;
  stateTtlSeconds: number;
};

export type StartOAuthLinkAuthorizationResponseData = {
  authorizationUrl: string;
};

export class StartOAuthLinkAuthorizationController {
  public constructor(
    private readonly startOAuthLinkAuthorizationUseCase: StartOAuthLinkAuthorizationUseCase,
    private readonly options: StartOAuthLinkAuthorizationControllerOptions,
  ) {}

  public async handle(
    req: ValidatedRequest<StartOAuthAuthorizationSchema>,
    res: Response,
  ): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);

    const result = await this.startOAuthLinkAuthorizationUseCase.execute({
      userId,
      sessionId,
      provider: req.params.provider,
      redirectUri: req.query.redirectUri,
      state: req.query.state,
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
      sendSuccess<StartOAuthLinkAuthorizationResponseData>(
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
