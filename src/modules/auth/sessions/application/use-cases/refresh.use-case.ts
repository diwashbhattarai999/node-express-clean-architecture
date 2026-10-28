import { randomUUID } from "node:crypto";

import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenReusedError } from "@/modules/auth/shared/application/errors/token-reused.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type RefreshUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type RefreshResult = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type RefreshRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class RefreshUseCase {
  public constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly options: RefreshUseCaseOptions,
  ) {}

  public async execute(
    refreshToken: string,
    meta: RefreshRequestMeta = {},
  ): Promise<RefreshResult> {
    const trimmed = refreshToken.trim();
    if (trimmed.length === 0) {
      throw new TokenInvalidError("The refresh token is invalid.");
    }

    const sessionId = randomUUID();
    const newRefreshToken = generateRefreshToken();
    const now = Date.now();

    const result = await this.sessionRepository.rotateRefreshSession(hashToken(trimmed), {
      id: sessionId,
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });

    switch (result.outcome) {
      case "invalid":
        throw new TokenInvalidError("The refresh token is invalid.");
      case "expired":
        throw new TokenExpiredError("The refresh token has expired.");
      case "revoked":
        throw new TokenRevokedError("The refresh token has been revoked.");
      case "reused":
        throw new TokenReusedError();
      case "rotated": {
        const signed = await this.accessTokenSigner.sign({
          userId: result.user.id,
          sessionId: result.sessionId,
        });

        return {
          accessToken: signed.accessToken,
          tokenType: "Bearer",
          expiresIn: signed.expiresIn,
          refreshToken: newRefreshToken,
        };
      }
    }
  }
}
