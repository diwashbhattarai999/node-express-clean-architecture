import { MFA_MAX_CHALLENGE_ATTEMPTS } from "@/modules/auth/mfa/application/constants/mfa";
import type { VerifyMfaChallengeDto } from "@/modules/auth/mfa/application/dto/verify-mfa-challenge.dto";
import { InvalidMfaCodeError } from "@/modules/auth/mfa/application/errors/invalid-mfa-code.error";
import type {
  IMfaRepository,
  MfaChallenge,
  MfaFactor,
} from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { consumeMatchingRecoveryCode } from "@/modules/auth/mfa/application/utils/match-recovery-code";
import type { ISessionRepository } from "@/modules/auth/sessions/application/ports/session.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IAccessTokenSigner } from "@/modules/auth/shared/application/ports/access-token.signer";
import {
  type IssuedAuthSession,
  issueAuthSession,
} from "@/modules/auth/shared/application/services/issue-auth-session";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type VerifyMfaChallengeUseCaseOptions = {
  refreshTokenTtlSeconds: number;
};

export type VerifyMfaChallengeResult = IssuedAuthSession;

export type VerifyMfaChallengeMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class VerifyMfaChallengeUseCase {
  public constructor(
    private readonly mfaRepository: IMfaRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly accessTokenSigner: IAccessTokenSigner,
    private readonly totpService: ITotpService,
    private readonly secretEncryptor: ISecretEncryptor,
    private readonly options: VerifyMfaChallengeUseCaseOptions,
  ) {}

  public async execute(
    dto: VerifyMfaChallengeDto,
    meta: VerifyMfaChallengeMeta = {},
  ): Promise<VerifyMfaChallengeResult> {
    const challenge = await this.mfaRepository.findChallengeById(dto.challengeId.trim());

    if (!challenge || challenge.verifiedAt || !challenge.factorId) {
      throw new TokenInvalidError("The MFA challenge is invalid.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The MFA challenge has expired.");
    }

    if (challenge.attemptCount >= MFA_MAX_CHALLENGE_ATTEMPTS) {
      throw new TokenInvalidError("The MFA challenge is no longer valid.");
    }

    const factor = await this.mfaRepository.findFactorForUser(challenge.userId, challenge.factorId);

    if (!factor?.isVerified || factor?.disabledAt) {
      throw new TokenInvalidError("The MFA challenge is invalid.");
    }

    const accepted = await this.verifyCode(challenge, factor, dto.code.trim());

    if (!accepted) {
      await this.mfaRepository.incrementChallengeAttempts(challenge.id);
      throw new InvalidMfaCodeError();
    }

    const now = new Date();
    await this.mfaRepository.updateChallenge(challenge.id, { verifiedAt: now });
    await this.mfaRepository.updateFactor(factor.id, { lastUsedAt: now });
    await this.mfaRepository.consumePendingLoginsForUser(challenge.userId);

    const user = await this.mfaRepository.findAuthUserById(challenge.userId);

    if (!user) {
      throw new TokenInvalidError("The MFA challenge is invalid.");
    }

    return issueAuthSession(
      {
        sessionRepository: this.sessionRepository,
        accessTokenSigner: this.accessTokenSigner,
        refreshTokenTtlSeconds: this.options.refreshTokenTtlSeconds,
      },
      user,
      meta,
    );
  }

  private async verifyCode(
    challenge: MfaChallenge,
    factor: MfaFactor,
    code: string,
  ): Promise<boolean> {
    if (await consumeMatchingRecoveryCode(this.mfaRepository, challenge.userId, code)) {
      return true;
    }

    if (factor.type === "totp" && factor.secretEncrypted) {
      const secret = this.secretEncryptor.decrypt(factor.secretEncrypted);
      return this.totpService.verify(secret, code);
    }

    if (challenge.challengeHash && challenge.challengeHash === hashToken(code)) {
      return true;
    }

    return false;
  }
}
