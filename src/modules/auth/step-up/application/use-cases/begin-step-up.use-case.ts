import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { MFA_CHALLENGE_TTL_MS, MFA_OTP_TTL_MS } from "@/modules/auth/mfa/application/constants/mfa";
import type {
  IMfaRepository,
  MfaFactor,
} from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { generatePhoneOtp } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { STEP_UP_CHALLENGE_TTL_MS } from "@/modules/auth/step-up/application/constants/step-up";
import type { BeginStepUpDto } from "@/modules/auth/step-up/application/dto/begin-step-up.dto";
import { StepUpMethodUnavailableError } from "@/modules/auth/step-up/application/errors/step-up-method-unavailable.error";
import type { IStepUpRepository } from "@/modules/auth/step-up/application/ports/step-up.repository";

export type BeginStepUpResult = {
  stepUpId: string;
  method: "password" | "mfa" | "passkey";
  expiresAt: Date;
  challengeId?: string | undefined;
  options?: Record<string, unknown> | undefined;
};

export class BeginStepUpUseCase {
  public constructor(
    private readonly stepUpRepository: IStepUpRepository,
    private readonly credentialsRepository: Pick<ICredentialsRepository, "findPasswordHashForUser">,
    private readonly mfaRepository: IMfaRepository,
    private readonly passkeyRepository: Pick<IPasskeyRepository, "listPasskeysForUser">,
    private readonly webAuthnService: IWebAuthnService,
    private readonly otpDispatcher: MfaOtpDispatcher,
  ) {}

  public async execute(
    userId: string,
    sessionId: string,
    dto: BeginStepUpDto,
  ): Promise<BeginStepUpResult> {
    await this.stepUpRepository.consumeOpenChallenges(userId, sessionId);

    if (dto.method === "password") {
      return this.beginPassword(userId, sessionId);
    }

    if (dto.method === "mfa") {
      return this.beginMfa(userId, sessionId, dto.factorId);
    }

    return this.beginPasskey(userId, sessionId);
  }

  private async beginPassword(userId: string, sessionId: string): Promise<BeginStepUpResult> {
    const passwordHash = await this.credentialsRepository.findPasswordHashForUser(userId);

    if (!passwordHash) {
      throw new StepUpMethodUnavailableError("Password authentication is not available.");
    }

    const expiresAt = new Date(Date.now() + STEP_UP_CHALLENGE_TTL_MS);
    const challenge = await this.stepUpRepository.insertChallenge({
      userId,
      sessionId,
      method: "password",
      expiresAt,
    });

    return { stepUpId: challenge.id, method: "password", expiresAt: challenge.expiresAt };
  }

  private async beginMfa(
    userId: string,
    sessionId: string,
    factorId: string | undefined,
  ): Promise<BeginStepUpResult> {
    const factors = await this.mfaRepository.listVerifiedFactors(userId);
    const factor = this.resolveFactor(factors, factorId);

    if (!factor) {
      throw new StepUpMethodUnavailableError("No usable MFA factor is available.");
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

    const mfaChallenge = await this.mfaRepository.insertChallenge({
      userId,
      factorId: factor.id,
      ...(challengeHash !== null ? { challengeHash } : {}),
      expiresAt,
    });

    const challenge = await this.stepUpRepository.insertChallenge({
      userId,
      sessionId,
      method: "mfa",
      mfaChallengeId: mfaChallenge.id,
      expiresAt,
    });

    return {
      stepUpId: challenge.id,
      method: "mfa",
      expiresAt: challenge.expiresAt,
      challengeId: mfaChallenge.id,
    };
  }

  private async beginPasskey(userId: string, sessionId: string): Promise<BeginStepUpResult> {
    const passkeys = await this.passkeyRepository.listPasskeysForUser(userId);

    if (passkeys.length === 0) {
      throw new StepUpMethodUnavailableError("No passkeys are registered.");
    }

    const generated = await this.webAuthnService.generateAuthenticationOptions({
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports,
      })),
    });

    const expiresAt = new Date(Date.now() + STEP_UP_CHALLENGE_TTL_MS);
    const challenge = await this.stepUpRepository.insertChallenge({
      userId,
      sessionId,
      method: "passkey",
      webauthnChallenge: generated.challenge,
      expiresAt,
    });

    return {
      stepUpId: challenge.id,
      method: "passkey",
      expiresAt: challenge.expiresAt,
      options: generated.options,
    };
  }

  private resolveFactor(factors: MfaFactor[], factorId: string | undefined): MfaFactor | undefined {
    if (factorId) {
      return factors.find((factor) => factor.id === factorId);
    }

    return factors.find((factor) => factor.type === "totp") ?? factors[0];
  }
}
