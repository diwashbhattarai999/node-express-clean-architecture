import type { AddPhoneDto } from "@/modules/auth/identity/application/dto/add-phone.dto";
import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import type { AuthLoginIdentity } from "@/modules/auth/shared/application/types/auth.types";
import { generatePhoneOtp } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { PHONE_OTP_TTL_MS } from "@/modules/auth/verification/application/constants/phone-verification";
import { logger } from "@/shared/logger/logger";

export type AddPhoneInput = AddPhoneDto & {
  userId: string;
  sessionId: string;
};

export class AddPhoneUseCase {
  public constructor(private readonly identityRepository: IIdentityRepository) {}

  public async execute(input: AddPhoneInput): Promise<AuthLoginIdentity> {
    const principal = await this.identityRepository.findAuthenticatedPrincipal(
      input.userId,
      input.sessionId,
    );

    switch (principal.outcome) {
      case "invalid_session":
      case "user_not_found":
        throw new TokenInvalidError("The access token is invalid.");
      case "expired_session":
        throw new TokenExpiredError("The session has expired.");
      case "revoked_session":
        throw new TokenRevokedError("The session has been revoked.");
      case "ok":
        break;
    }

    const phone = input.phone.trim();
    const existing = await this.identityRepository.findIdentityByNormalized("phone", phone);

    if (existing) {
      throw new IdentityAlreadyExistsError();
    }

    const rawOtp = generatePhoneOtp();
    const identity = await this.identityRepository.addPhoneIdentity({
      userId: input.userId,
      identifier: phone,
      normalizedIdentifier: phone,
      tokenHash: hashToken(rawOtp),
      expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MS),
    });

    console.log("Phone add OTP created:", rawOtp);
    logger.info(
      { userId: input.userId, identityId: identity.id },
      "Phone add OTP created; SMS delivery is not configured yet",
    );

    return identity;
  }
}
