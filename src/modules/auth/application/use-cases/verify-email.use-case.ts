import { randomUUID } from "node:crypto";

import type { VerifyEmailDto } from "@/modules/auth/application/dto/verify-email.dto";
import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type {
  AuthUser,
  IAuthAccountRepository,
} from "@/modules/auth/application/ports/auth-account.repository";
import { generateRefreshToken } from "@/modules/auth/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/application/utils/hash-token";

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
    private readonly authAccountRepository: IAuthAccountRepository,
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

    const result = await this.authAccountRepository.verifyEmailByTokenHash(hashToken(token), {
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
