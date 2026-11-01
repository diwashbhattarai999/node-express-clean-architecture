import { randomUUID } from "node:crypto";

import type { ConsumeMagicLinkDto } from "@/modules/auth/credentials/application/dto/consume-magic-link.dto";
import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ErrorCode } from "@/shared/errors/error-code";

export type ConsumeMagicLinkUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type ConsumeMagicLinkResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type ConsumeMagicLinkRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class ConsumeMagicLinkUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
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

    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();
    const now = Date.now();

    const result = await this.credentialsRepository.consumeMagicLinkByTokenHash(hashToken(token), {
      id: sessionId,
      familyId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });

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

    const signed = await this.accessTokenSigner.sign({
      userId: result.user.id,
      sessionId: result.sessionId,
    });

    return {
      user: result.user,
      accessToken: signed.accessToken,
      tokenType: "Bearer",
      expiresIn: signed.expiresIn,
      refreshToken,
    };
  }
}
