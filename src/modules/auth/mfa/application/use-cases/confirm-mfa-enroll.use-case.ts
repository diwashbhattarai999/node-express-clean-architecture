import type { ConfirmMfaEnrollDto } from "@/modules/auth/mfa/application/dto/confirm-mfa-enroll.dto";
import { InvalidMfaCodeError } from "@/modules/auth/mfa/application/errors/invalid-mfa-code.error";
import { MfaFactorNotFoundError } from "@/modules/auth/mfa/application/errors/mfa-factor-not-found.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import {
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from "@/modules/auth/mfa/application/utils/recovery-codes";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ConflictError } from "@/shared/errors/conflict-error";

export type ConfirmMfaEnrollResult = {
  recoveryCodes: string[];
};

export class ConfirmMfaEnrollUseCase {
  public constructor(
    private readonly mfaRepository: IMfaRepository,
    private readonly totpService: ITotpService,
    private readonly secretEncryptor: ISecretEncryptor,
  ) {}

  public async execute(userId: string, dto: ConfirmMfaEnrollDto): Promise<ConfirmMfaEnrollResult> {
    const factor = await this.mfaRepository.findFactorForUser(userId, dto.factorId);

    if (!factor || factor.disabledAt) {
      throw new MfaFactorNotFoundError();
    }

    if (factor.isVerified) {
      throw new ConflictError("This MFA factor is already verified.");
    }

    if (factor.type === "totp") {
      this.assertTotp(factor.secretEncrypted, dto.code);
    } else {
      await this.assertOtpChallenge(factor.id, dto.code);
    }

    const verified = await this.mfaRepository.markFactorVerified(factor.id, new Date());

    if (!verified) {
      throw new ConflictError("This MFA factor is already verified.");
    }

    const alreadyEnabled = await this.mfaRepository.listVerifiedFactors(userId);
    const otherVerified = alreadyEnabled.filter((item) => item.id !== factor.id);

    if (otherVerified.length > 0) {
      return { recoveryCodes: [] };
    }

    const recoveryCodes = generateRecoveryCodes();
    await this.mfaRepository.replaceRecoveryCodes(
      userId,
      recoveryCodes.map((code) => hashToken(normalizeRecoveryCode(code))),
    );

    return { recoveryCodes };
  }

  private assertTotp(secretEncrypted: string | null, code: string): void {
    if (!secretEncrypted) {
      throw new InvalidMfaCodeError();
    }

    const secret = this.secretEncryptor.decrypt(secretEncrypted);

    if (!this.totpService.verify(secret, code)) {
      throw new InvalidMfaCodeError();
    }
  }

  private async assertOtpChallenge(factorId: string, code: string): Promise<void> {
    const challenge = await this.mfaRepository.findLatestChallengeForFactor(factorId);

    if (!challenge) {
      throw new TokenInvalidError("MFA enrollment challenge not found.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The MFA enrollment code has expired.");
    }

    if (!challenge.challengeHash || challenge.challengeHash !== hashToken(code.trim())) {
      throw new InvalidMfaCodeError();
    }

    await this.mfaRepository.updateChallenge(challenge.id, { verifiedAt: new Date() });
  }
}
