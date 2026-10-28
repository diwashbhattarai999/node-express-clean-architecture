import { randomUUID } from "node:crypto";

import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import type { VerifyEmailDto } from "@/modules/auth/verification/application/dto/verify-email.dto";
import type { IVerificationRepository } from "@/modules/auth/verification/application/ports/verification.repository";

export type VerifyEmailUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type VerifyEmailResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type VerifyEmailRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class VerifyEmailUseCase {
  public constructor(
    private readonly verificationRepository: IVerificationRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly options: VerifyEmailUseCaseOptions,
  ) {}

  public async execute(
    dto: VerifyEmailDto,
    meta: VerifyEmailRequestMeta = {},
  ): Promise<VerifyEmailResult> {
    const token = dto.token.trim();

    if (!token) {
      throw new TokenInvalidError();
    }

    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();
    const now = Date.now();

    const result = await this.verificationRepository.verifyEmailByTokenHash(hashToken(token), {
      id: sessionId,
      familyId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });

    if (result.outcome === "invalid") {
      throw new TokenInvalidError();
    }

    if (result.outcome === "expired") {
      throw new TokenExpiredError();
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
