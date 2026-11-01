import { MFA_CHALLENGE_TTL_MS, MFA_OTP_TTL_MS } from "@/modules/auth/mfa/application/constants/mfa";
import type { BeginMfaChallengeDto } from "@/modules/auth/mfa/application/dto/begin-mfa-challenge.dto";
import { MfaFactorNotFoundError } from "@/modules/auth/mfa/application/errors/mfa-factor-not-found.error";
import type {
  IMfaRepository,
  MfaFactor,
} from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { generatePhoneOtp } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type BeginMfaChallengeResult = {
  challengeId: string;
  expiresAt: Date;
};

export class BeginMfaChallengeUseCase {
  public constructor(
    private readonly mfaRepository: IMfaRepository,
    private readonly otpDispatcher: MfaOtpDispatcher,
  ) {}

  public async execute(dto: BeginMfaChallengeDto): Promise<BeginMfaChallengeResult> {
    const pending = await this.mfaRepository.findPendingLoginByTokenHash(
      hashToken(dto.mfaToken.trim()),
    );

    if (!pending) {
      throw new TokenInvalidError("The MFA continuation token is invalid or has expired.");
    }

    const factors = await this.mfaRepository.listVerifiedFactors(pending.userId);
    const factor = this.resolveFactor(factors, dto.factorId);

    if (!factor) {
      throw new MfaFactorNotFoundError("No usable MFA factor is available.");
    }

    const expiresAt = new Date(
      Date.now() + (factor.type === "totp" ? MFA_CHALLENGE_TTL_MS : MFA_OTP_TTL_MS),
    );
    let challengeHash: string | null = null;

    if (factor.type !== "totp") {
      const code = generatePhoneOtp();
      challengeHash = hashToken(code);
      await this.otpDispatcher.send(factor, code);
    }

    const challenge = await this.mfaRepository.insertChallenge({
      userId: pending.userId,
      factorId: factor.id,
      ...(challengeHash !== null ? { challengeHash } : {}),
      expiresAt,
    });

    return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
  }

  private resolveFactor(factors: MfaFactor[], factorId: string | undefined): MfaFactor | undefined {
    if (factorId) {
      return factors.find((factor) => factor.id === factorId);
    }

    return factors.find((factor) => factor.type === "totp") ?? factors[0];
  }
}
