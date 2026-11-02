import { DUMMY_PASSWORD_HASH } from "@/modules/auth/credentials/application/constants/dummy-password-hash";
import type { LoginDto } from "@/modules/auth/credentials/application/dto/login.dto";
import { AuthForbiddenError } from "@/modules/auth/credentials/application/errors/auth-forbidden.error";
import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { resolveLoginIdentifier } from "@/modules/auth/credentials/application/utils/resolve-login-identifier";
import type { MfaSignInGuard } from "@/modules/auth/mfa/application/services/mfa-sign-in-guard";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import {
  type IssuedAuthSession,
  issueAuthSession,
} from "@/modules/auth/shared/application/services/issue-auth-session";
import { ErrorCode } from "@/shared/errors/error-code";

export type LoginUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type LoginResult = IssuedAuthSession;

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
    private readonly mfaSignInGuard: MfaSignInGuard,
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
        ErrorCode.ACCOUNT_NOT_VERIFIED,
        "Please verify your account before signing in.",
      );
    }

    if (candidate.status === "suspended") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_SUSPENDED, "This account is suspended.");
    }

    if (candidate.status === "disabled") {
      throw new AuthForbiddenError(ErrorCode.ACCOUNT_DISABLED, "This account is disabled.");
    }

    await this.mfaSignInGuard.assertNotRequired(candidate.userId);

    return issueAuthSession(
      {
        sessionRepository: this.sessionRepository,
        accessTokenSigner: this.accessTokenSigner,
        refreshTokenTtlSeconds: this.options.refreshTokenTtlSeconds,
      },
      {
        id: candidate.userId,
        status: candidate.status,
        displayName: candidate.displayName,
        avatarUrl: candidate.avatarUrl,
        email: candidate.email,
        username: candidate.username,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      },
      meta,
    );
  }
}
