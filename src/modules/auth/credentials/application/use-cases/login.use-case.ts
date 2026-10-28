import { randomUUID } from "node:crypto";

import { DUMMY_PASSWORD_HASH } from "@/modules/auth/credentials/application/constants/dummy-password-hash";
import type { LoginDto } from "@/modules/auth/credentials/application/dto/login.dto";
import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { resolveLoginIdentifier } from "@/modules/auth/credentials/application/utils/resolve-login-identifier";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ErrorCode } from "@/shared/errors/error-code";

export type LoginUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type LoginResult = {
  user: AuthUser;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
};

export type LoginRequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class LoginUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly options: LoginUseCaseOptions,
  ) {}

  public async execute(dto: LoginDto, meta: LoginRequestMeta = {}): Promise<LoginResult> {
    const resolved = resolveLoginIdentifier(dto.identifier);
    const candidate = await this.credentialsRepository.findPasswordLoginCandidate(
      resolved.type,
      resolved.normalizedIdentifier,
    );

    const passwordMatches = await this.passwordHasher.compare(
      dto.password,
      candidate?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!candidate || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (candidate.status === "pending_verification") {
      throw new AuthForbiddenError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        "Please verify your account before signing in.",
      );
    }

    if (candidate.status === "suspended") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_SUSPENDED, "This account is suspended.");
    }

    if (candidate.status === "disabled") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_DISABLED, "This account is disabled.");
    }

    const sessionId = randomUUID();
    const familyId = randomUUID();
    const refreshToken = generateRefreshToken();
    const now = Date.now();

    await this.sessionRepository.createSession(candidate.userId, {
      id: sessionId,
      familyId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(now + this.options.refreshTokenTtlSeconds * 1000),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    });

    const signed = await this.accessTokenSigner.sign({
      userId: candidate.userId,
      sessionId,
    });

    return {
      user: {
        id: candidate.userId,
        status: candidate.status,
        displayName: candidate.displayName,
        avatarUrl: candidate.avatarUrl,
        email: candidate.email,
        username: candidate.username,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      },
      accessToken: signed.accessToken,
      tokenType: "Bearer",
      expiresIn: signed.expiresIn,
      refreshToken,
    };
  }
}
