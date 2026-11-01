import { MfaFactorNotFoundError } from "@/modules/auth/mfa/application/errors/mfa-factor-not-found.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import {
  generateRecoveryCodes,
  normalizeRecoveryCode,
} from "@/modules/auth/mfa/application/utils/recovery-codes";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export type RegenerateMfaRecoveryCodesResult = {
  recoveryCodes: string[];
};

export class RegenerateMfaRecoveryCodesUseCase {
  public constructor(private readonly mfaRepository: IMfaRepository) {}

  public async execute(userId: string): Promise<RegenerateMfaRecoveryCodesResult> {
    const enabled = await this.mfaRepository.hasVerifiedFactor(userId);

    if (!enabled) {
      throw new MfaFactorNotFoundError("MFA is not enabled.");
    }

    const recoveryCodes = generateRecoveryCodes();
    await this.mfaRepository.replaceRecoveryCodes(
      userId,
      recoveryCodes.map((code) => hashToken(normalizeRecoveryCode(code))),
    );

    return { recoveryCodes };
  }
}
