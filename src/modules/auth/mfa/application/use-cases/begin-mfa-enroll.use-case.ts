import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { MFA_OTP_TTL_MS } from "@/modules/auth/mfa/application/constants/mfa";
import type { BeginMfaEnrollDto } from "@/modules/auth/mfa/application/dto/begin-mfa-enroll.dto";
import { MfaFactorNotFoundError } from "@/modules/auth/mfa/application/errors/mfa-factor-not-found.error";
import type { IMfaRepository } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { ISecretEncryptor } from "@/modules/auth/mfa/application/ports/secret-encryptor.port";
import type { ITotpService } from "@/modules/auth/mfa/application/ports/totp.service";
import type { MfaOtpDispatcher } from "@/modules/auth/mfa/application/services/mfa-otp-dispatcher";
import {
  maskEmailDestination,
  maskPhoneDestination,
} from "@/modules/auth/mfa/application/utils/mask-destination";
import { generatePhoneOtp } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { ConflictError } from "@/shared/errors/conflict-error";
import { ValidationError } from "@/shared/errors/validation-error";

export type BeginMfaEnrollOptions = {
  brandName: string;
};

export type BeginMfaEnrollResult = {
  factorId: string;
  secret?: string;
  otpauthUrl?: string;
};

export class BeginMfaEnrollUseCase {
  public constructor(
    private readonly mfaRepository: IMfaRepository,
    private readonly identityRepository: Pick<IIdentityRepository, "listIdentitiesForUser">,
    private readonly totpService: ITotpService,
    private readonly secretEncryptor: ISecretEncryptor,
    private readonly otpDispatcher: MfaOtpDispatcher,
    private readonly options: BeginMfaEnrollOptions,
  ) {}

  public async execute(userId: string, dto: BeginMfaEnrollDto): Promise<BeginMfaEnrollResult> {
    const existingVerified = await this.mfaRepository.findFactorByType(userId, dto.type, true);

    if (existingVerified) {
      throw new ConflictError("An MFA factor of this type is already enabled.");
    }

    if (dto.type === "totp") {
      return this.enrollTotp(userId);
    }

    return this.enrollOtpFactor(userId, dto);
  }

  private async enrollTotp(userId: string): Promise<BeginMfaEnrollResult> {
    const { secret } = this.totpService.generateSecret();
    const user = await this.mfaRepository.findAuthUserById(userId);
    const accountName = user?.email ?? user?.username ?? userId;
    const otpauthUrl = this.totpService.buildOtpauthUrl({
      secret,
      accountName,
      issuer: this.options.brandName,
    });

    const pending = await this.mfaRepository.findFactorByType(userId, "totp", false);
    const secretEncrypted = this.secretEncryptor.encrypt(secret);
    const factor = pending
      ? await this.mfaRepository.updateFactor(pending.id, {
          secretEncrypted,
          label: "Authenticator app",
        })
      : await this.mfaRepository.insertFactor({
          userId,
          type: "totp",
          label: "Authenticator app",
          secretEncrypted,
          destination: null,
        });

    if (!factor) {
      throw new MfaFactorNotFoundError();
    }

    return { factorId: factor.id, secret, otpauthUrl };
  }

  private async enrollOtpFactor(
    userId: string,
    dto: BeginMfaEnrollDto,
  ): Promise<BeginMfaEnrollResult> {
    const destination = await this.resolveDestination(userId, dto);
    const label =
      dto.type === "email" ? maskEmailDestination(destination) : maskPhoneDestination(destination);
    const pending = await this.mfaRepository.findFactorByType(userId, dto.type, false);
    const factor = pending
      ? await this.mfaRepository.updateFactor(pending.id, { destination, label })
      : await this.mfaRepository.insertFactor({
          userId,
          type: dto.type,
          label,
          secretEncrypted: null,
          destination,
        });

    if (!factor) {
      throw new MfaFactorNotFoundError();
    }

    const code = generatePhoneOtp();
    await this.mfaRepository.insertChallenge({
      userId,
      factorId: factor.id,
      challengeHash: hashToken(code),
      expiresAt: new Date(Date.now() + MFA_OTP_TTL_MS),
    });
    await this.otpDispatcher.send(factor, code);

    return { factorId: factor.id };
  }

  private async resolveDestination(userId: string, dto: BeginMfaEnrollDto): Promise<string> {
    const provided = dto.destination?.trim();

    if (provided) {
      return provided;
    }

    const identities = await this.identityRepository.listIdentitiesForUser(userId);
    const type = dto.type === "email" ? "email" : "phone";
    const match =
      identities.find(
        (identity) => identity.type === type && identity.isPrimary && identity.verifiedAt,
      ) ?? identities.find((identity) => identity.type === type && identity.verifiedAt);

    if (!match) {
      throw new ValidationError([
        {
          type: "field",
          value: dto.destination,
          message:
            dto.type === "email"
              ? "An email destination is required to enroll email MFA."
              : "A phone destination is required to enroll SMS MFA.",
          path: "destination",
          location: "body",
        },
      ]);
    }

    return match.identifier;
  }
}
