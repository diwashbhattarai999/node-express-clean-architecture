import { InvalidCredentialsError } from "@/modules/auth/credentials/application/errors/invalid-credentials.error";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { DisableMfaDto } from "@/modules/auth/mfa/application/dto/disable-mfa.dto";
import { InvalidMfaCodeError } from "@/modules/auth/mfa/application/errors/invalid-mfa-code.error";
import { MfaFactorNotFoundError } from "@/modules/auth/mfa/application/errors/mfa-factor-not-found.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import { consumeMatchingRecoveryCode } from "@/modules/auth/mfa/application/utils/match-recovery-code";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";

export class DisableMfaUseCase {
  public constructor(
    private readonly mfaRepository: IMfaRepository,
    private readonly credentialsRepository: Pick<ICredentialsRepository, "findPasswordHashForUser">,
    private readonly passwordHasher: IPasswordHasher,
    private readonly totpService: ITotpService,
    private readonly secretEncryptor: ISecretEncryptor,
  ) {}

  public async execute(userId: string, dto: DisableMfaDto): Promise<void> {
    const enabled = await this.mfaRepository.hasVerifiedFactor(userId);

    if (!enabled) {
      throw new MfaFactorNotFoundError("MFA is not enabled.");
    }

    if (dto.password) {
      await this.assertPassword(userId, dto.password);
    } else if (dto.code) {
      await this.assertCode(userId, dto.code);
    }

    await this.mfaRepository.disableFactorsForUser(userId);
    await this.mfaRepository.revokeUnusedRecoveryCodes(userId);
  }

  private async assertPassword(userId: string, password: string): Promise<void> {
    const passwordHash = await this.credentialsRepository.findPasswordHashForUser(userId);

    if (!passwordHash) {
      throw new InvalidCredentialsError("Password is incorrect.");
    }

    const matches = await this.passwordHasher.compare(password, passwordHash);

    if (!matches) {
      throw new InvalidCredentialsError("Password is incorrect.");
    }
  }

  private async assertCode(userId: string, code: string): Promise<void> {
    const usedRecovery = await consumeMatchingRecoveryCode(this.mfaRepository, userId, code);

    if (usedRecovery) {
      return;
    }

    const factors = await this.mfaRepository.listVerifiedFactors(userId);
    const totp = factors.find((factor) => factor.type === "totp" && factor.secretEncrypted);

    if (totp?.secretEncrypted) {
      const secret = this.secretEncryptor.decrypt(totp.secretEncrypted);

      if (this.totpService.verify(secret, code)) {
        return;
      }
    }

    throw new InvalidMfaCodeError();
  }
}
