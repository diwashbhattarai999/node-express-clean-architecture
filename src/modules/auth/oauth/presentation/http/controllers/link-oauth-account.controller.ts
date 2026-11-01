import type { Response } from "express";

import type { ValidatedRequest } from "@/app/middleware/validation";
import { OAUTH_PKCE_LINK_COOKIE_PATH } from "@/modules/auth/oauth/application/constants/oauth-pkce-cookie";
import type { LinkOAuthAccountUseCase } from "@/modules/auth/oauth/application/use-cases/link-oauth-account.use-case";
import {
  clearOAuthPkceCookie,
  readOAuthPkceCookie,
} from "@/modules/auth/oauth/presentation/http/cookies/oauth-pkce.cookie";
import {
  type OAuthAccountResponse,
  toOAuthAccountResponse,
} from "@/modules/auth/oauth/presentation/http/mappers/oauth-account.response";
import type { LinkOAuthAccountSchema } from "@/modules/auth/oauth/presentation/http/validators/link-oauth-account.validator";
import { getBearerAuth } from "@/modules/auth/shared/presentation/http/middleware/auth-context";
import { HttpStatus } from "@/shared/http/http-status";
import { sendSuccess } from "@/shared/http/send-response";

export type LinkOAuthAccountControllerOptions = {
  secureCookies: boolean;
};

export class LinkOAuthAccountController {
  public constructor(
    private readonly linkOAuthAccountUseCase: LinkOAuthAccountUseCase,
    private readonly options: LinkOAuthAccountControllerOptions,
  ) {}

  public async handle(req: ValidatedRequest<LinkOAuthAccountSchema>, res: Response): Promise<void> {
    const { userId, sessionId } = getBearerAuth(req);
    const codeVerifier = req.body.codeVerifier ?? readOAuthPkceCookie(req);

    try {
      const account = await this.linkOAuthAccountUseCase.execute({
        userId,
        sessionId,
        provider: req.params.provider,
        code: req.body.code,
        redirectUri: req.body.redirectUri,
        state: req.body.state,
        ...(codeVerifier !== undefined ? { codeVerifier } : {}),
      });

      clearOAuthPkceCookie(res, this.options.secureCookies, OAUTH_PKCE_LINK_COOKIE_PATH);

      sendSuccess<OAuthAccountResponse>(
        res,
        HttpStatus.OK,
        "OAuth account linked.",
        toOAuthAccountResponse(account),
      );
    } catch (error) {
      clearOAuthPkceCookie(res, this.options.secureCookies, OAUTH_PKCE_LINK_COOKIE_PATH);
      throw error;
    }
  }
}
