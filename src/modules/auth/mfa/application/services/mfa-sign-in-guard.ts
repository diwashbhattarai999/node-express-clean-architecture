import { MFA_PENDING_LOGIN_TTL_MS } from "@/modules/auth/mfa/application/constants/mfa";
import { MfaRequiredError } from "@/modules/auth/mfa/application/errors/mfa-required.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import { generateRefreshToken } from "@/modules/auth/shared/application/utils/generate-refresh-token";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";

export class MfaSignInGuard {
  public constructor(private readonly mfaRepository: IMfaRepository) {}

  public async assertNotRequired(userId: string): Promise<void> {
    const required = await this.mfaRepository.hasVerifiedFactor(userId);

    if (!required) {
      return;
    }

    const mfaToken = generateRefreshToken();

    await this.mfaRepository.insertChallenge({
      userId,
      challengeHash: hashToken(mfaToken),
      expiresAt: new Date(Date.now() + MFA_PENDING_LOGIN_TTL_MS),
    });

    throw new MfaRequiredError(mfaToken);
  }
}
