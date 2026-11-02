import type { ConsumeMagicLinkDto } from "@/modules/auth/credentials/application/dto/consume-magic-link.dto";
import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { MfaSignInGuard } from "@/modules/auth/mfa/application/services/mfa-sign-in-guard";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import {
  type IssuedAuthSession,
  issueAuthSession,
} from "@/modules/auth/shared/application/services/issue-auth-session";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ErrorCode } from "@/shared/errors/error-code";

export type ConsumeMagicLinkUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type ConsumeMagicLinkResult = IssuedAuthSession;

export type ConsumeMagicLinkRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class ConsumeMagicLinkUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly mfaSignInGuard: MfaSignInGuard,
    private readonly options: ConsumeMagicLinkUseCaseOptions,
  ) {}

  public async execute(
    dto: ConsumeMagicLinkDto,
    meta: ConsumeMagicLinkRequestMeta = {},
  ): Promise<ConsumeMagicLinkResult> {
    const token = dto.token.trim();

    if (!token) {
      throw new TokenInvalidError();
    }

    const result = await this.credentialsRepository.consumeMagicLinkByTokenHash(hashToken(token));

    switch (result.outcome) {
      case "invalid":
        throw new TokenInvalidError();
      case "expired":
        throw new TokenExpiredError();
      case "suspended":
        throw new AuthForbiddenError(ErrorCode.ACCOUNT_SUSPENDED, "This account is suspended.");
      case "disabled":
        throw new AuthForbiddenError(ErrorCode.ACCOUNT_DISABLED, "This account is disabled.");
      case "consumed":
        break;
    }

    await this.mfaSignInGuard.assertNotRequired(result.user.id);

    return issueAuthSession(
      {
        sessionRepository: this.sessionRepository,
        accessTokenSigner: this.accessTokenSigner,
        refreshTokenTtlSeconds: this.options.refreshTokenTtlSeconds,
      },
      result.user,
      meta,
    );
  }
}
