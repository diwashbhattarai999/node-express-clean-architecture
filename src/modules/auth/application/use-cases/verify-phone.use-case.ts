import { randomUUID } from "node:crypto";

import { PHONE_OTP_MAX_ATTEMPTS } from "@/modules/auth/application/constants/phone-verification";
import type { VerifyPhoneDto } from "@/modules/auth/application/dto/verify-phone.dto";
import { TokenExpiredError } from "@/modules/auth/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/application/ports/access-token.signer";
import type {
  AuthUser,
  IAuthAccountRepository,
} from "@/modules/auth/application/ports/auth-account.repository";
import { generateRefreshToken } from "@/modules/auth/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/application/utils/hash-token";
import { RateLimitExceededError } from "@/shared/errors/rate-limit-error";

export type VerifyPhoneUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type VerifyPhoneResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type VerifyPhoneRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class VerifyPhoneUseCase {
  public constructor(
    private readonly authAccountRepository: IAuthAccountRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly options: VerifyPhoneUseCaseOptions,
  ) {}

  public async execute(
    dto: VerifyPhoneDto,
    meta: VerifyPhoneRequestMeta = {},
  ): Promise<VerifyPhoneResult> {
    const phone = dto.phone.trim();
    const code = dto.code.trim();

    if (!phone || !code) {
      throw new TokenInvalidError();
    }

    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();
    const now = Date.now();

    const result = await this.authAccountRepository.verifyPhoneByCodeHash(
      phone,
      hashToken(code),
      {
        id: sessionId,
        familyId,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
      PHONE_OTP_MAX_ATTEMPTS,
    );

    if (result.outcome === "too_many_attempts") {
      throw new RateLimitExceededError("Too many verification attempts. Request a new code.");
    }

    if (result.outcome === "expired") {
      throw new TokenExpiredError("The verification code has expired.");
    }

    if (result.outcome === "invalid") {
      throw new TokenInvalidError("The verification code is invalid.");
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
