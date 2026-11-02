import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { MFA_MAX_CHALLENGE_ATTEMPTS } from "@/modules/auth/mfa/application/constants/mfa";
import { InvalidMfaCodeError } from "@/modules/auth/mfa/application/errors/invalid-mfa-code.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { consumeMatchingRecoveryCode } from "@/modules/auth/mfa/application/utils/match-recovery-code";
import type { IPasskeyRepository } from "@/modules/auth/passkeys/application/ports/passkey.repository";
import type { IWebAuthnService } from "@/modules/auth/passkeys/application/ports/webauthn.service";
import { readWebAuthnClientChallenge } from "@/modules/auth/passkeys/application/utils/read-webauthn-challenge";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import type { VerifyStepUpDto } from "@/modules/auth/step-up/application/dto/verify-step-up.dto";
import type { IStepUpRepository } from "@/modules/auth/step-up/application/ports/step-up.repository";
import type { IStepUpTokenSigner } from "@/modules/auth/step-up/application/ports/step-up-token.signer";
import { ValidationError } from "@/shared/errors/validation-error";

export type VerifyStepUpResult = {
  stepUpToken: string;
  expiresIn: number;
};

export class VerifyStepUpUseCase {
  public constructor(
    private readonly stepUpRepository: IStepUpRepository,
    private readonly stepUpTokenSigner: IStepUpTokenSigner,
    private readonly credentialsRepository: Pick<ICredentialsRepository, "findPasswordHashForUser">,
    private readonly passwordHasher: IPasswordHasher,
    private readonly mfaRepository: IMfaRepository,
    private readonly totpService: ITotpService,
    private readonly secretEncryptor: ISecretEncryptor,
    private readonly passkeyRepository: IPasskeyRepository,
    private readonly webAuthnService: IWebAuthnService,
  ) {}

  public async execute(
    userId: string,
    sessionId: string,
    dto: VerifyStepUpDto,
  ): Promise<VerifyStepUpResult> {
    const challenge = await this.stepUpRepository.findChallengeById(dto.stepUpId.trim());

    if (!challenge || challenge.userId !== userId || challenge.sessionId !== sessionId) {
      throw new TokenInvalidError("The step-up challenge is invalid.");
    }

    if (challenge.verifiedAt) {
      throw new TokenInvalidError("The step-up challenge has already been used.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The step-up challenge has expired.");
    }

    if (challenge.method === "password") {
      await this.verifyPassword(userId, dto.password);
    } else if (challenge.method === "mfa") {
      await this.verifyMfa(challenge.mfaChallengeId, userId, dto.code);
    } else {
      await this.verifyPasskey(challenge.webauthnChallenge, userId, dto);
    }

    const marked = await this.stepUpRepository.markChallengeVerified(challenge.id, new Date());

    if (!marked) {
      throw new TokenInvalidError("The step-up challenge has already been used.");
    }

    return this.stepUpTokenSigner.sign({ userId, sessionId });
  }

  private async verifyPassword(userId: string, password: string | undefined): Promise<void> {
    if (!password) {
      throw new ValidationError([
        {
          type: "field",
          value: password,
          message: "Password is required.",
          path: "password",
          location: "body",
        },
      ]);
    }

    const passwordHash = await this.credentialsRepository.findPasswordHashForUser(userId);

    if (!passwordHash) {
      throw new InvalidCredentialsError("Password is incorrect.");
    }

    const matches = await this.passwordHasher.compare(password, passwordHash);

    if (!matches) {
      throw new InvalidCredentialsError("Password is incorrect.");
    }
  }

  private async verifyMfa(
    mfaChallengeId: string | null,
    userId: string,
    code: string | undefined,
  ): Promise<void> {
    if (!code) {
      throw new ValidationError([
        {
          type: "field",
          value: code,
          message: "Verification code is required.",
          path: "code",
          location: "body",
        },
      ]);
    }

    if (!mfaChallengeId) {
      throw new TokenInvalidError("The step-up challenge is invalid.");
    }

    const challenge = await this.mfaRepository.findChallengeById(mfaChallengeId);

    if (!challenge || challenge.userId !== userId || challenge.verifiedAt || !challenge.factorId) {
      throw new TokenInvalidError("The MFA step-up challenge is invalid.");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      throw new TokenExpiredError("The MFA step-up challenge has expired.");
    }

    if (challenge.attemptCount >= MFA_MAX_CHALLENGE_ATTEMPTS) {
      throw new TokenInvalidError("The MFA step-up challenge is no longer valid.");
    }

    const factor = await this.mfaRepository.findFactorForUser(userId, challenge.factorId);

    if (!factor?.isVerified || factor.disabledAt) {
      throw new TokenInvalidError("The MFA step-up challenge is invalid.");
    }

    const trimmed = code.trim();
    let accepted = false;

    if (await consumeMatchingRecoveryCode(this.mfaRepository, userId, trimmed)) {
      accepted = true;
    } else if (factor.type === "totp" && factor.secretEncrypted) {
      const secret = this.secretEncryptor.decrypt(factor.secretEncrypted);
      accepted = this.totpService.verify(secret, trimmed);
    } else if (challenge.challengeHash && challenge.challengeHash === hashToken(trimmed)) {
      accepted = true;
    }

    if (!accepted) {
      await this.mfaRepository.incrementChallengeAttempts(challenge.id);
      throw new InvalidMfaCodeError();
    }

    await this.mfaRepository.updateChallenge(challenge.id, { verifiedAt: new Date() });
  }

  private async verifyPasskey(
    expectedChallenge: string | null,
    userId: string,
    dto: VerifyStepUpDto,
  ): Promise<void> {
    const assertion = dto.assertion;

    if (!assertion) {
      throw new ValidationError([
        {
          type: "field",
          value: assertion,
          message: "Passkey assertion is required.",
          path: "assertion",
          location: "body",
        },
      ]);
    }

    if (!expectedChallenge) {
      throw new TokenInvalidError("The step-up challenge is invalid.");
    }

    const clientChallenge = readWebAuthnClientChallenge(assertion.response.clientDataJSON);

    if (!clientChallenge || clientChallenge !== expectedChallenge) {
      throw new TokenInvalidError("The passkey assertion is invalid.");
    }

    const passkey = await this.passkeyRepository.findPasskeyByCredentialId(assertion.id);

    if (!passkey || passkey.revokedAt || passkey.userId !== userId) {
      throw new InvalidCredentialsError();
    }

    const verified = await this.webAuthnService.verifyAuthentication({
      response: assertion,
      expectedChallenge,
      credential: {
        id: passkey.credentialId,
        publicKey: passkey.publicKey,
        signCount: passkey.signCount,
        transports: passkey.transports,
      },
    });

    if (!verified) {
      throw new InvalidCredentialsError();
    }

    await this.passkeyRepository.markPasskeyUsed(passkey.id, verified.newSignCount, new Date());
  }
}
