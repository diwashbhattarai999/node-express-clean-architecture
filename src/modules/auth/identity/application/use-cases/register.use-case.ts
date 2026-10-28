import { randomUUID } from "node:crypto";

import type { RegisterDto } from "@/modules/auth/identity/application/dto/register.dto";
import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IPasswordHasher } from "@/modules/auth/shared/application/ports/password-hasher.port";
import type { AuthUser } from "@/modules/auth/shared/application/types/auth.types";
import {
  generateEmailVerificationToken,
  generatePhoneOtp,
} from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { EMAIL_VERIFICATION_TTL_MS } from "@/modules/auth/verification/application/constants/email-verification";
import { PHONE_OTP_TTL_MS } from "@/modules/auth/verification/application/constants/phone-verification";
import { buildEmailVerificationMessage } from "@/modules/auth/verification/application/emails/email-verification.message";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type RegisterUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

export class RegisterUseCase {
  public constructor(
    private readonly identityRepository: IIdentityRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailSender: IEmailSender,
    private readonly options: RegisterUseCaseOptions,
  ) {}

  public async execute(dto: RegisterDto): Promise<AuthUser> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const displayName = dto.displayName?.trim() || null;

    if (email) {
      const existing = await this.identityRepository.findIdentityByNormalized("email", email);

      if (existing) {
        throw new IdentityAlreadyExistsError();
      }
    }

    if (phone) {
      const existing = await this.identityRepository.findIdentityByNormalized("phone", phone);

      if (existing) {
        throw new IdentityAlreadyExistsError();
      }
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const userId = randomUUID();
    const now = Date.now();

    let rawEmailToken: string | undefined;
    let rawPhoneOtp: string | undefined;

    const verificationToken = email
      ? (() => {
          rawEmailToken = generateEmailVerificationToken();

          return {
            purpose: "email_verification" as const,
            tokenHash: hashToken(rawEmailToken),
            expiresAt: new Date(now + EMAIL_VERIFICATION_TTL_MS),
          };
        })()
      : (() => {
          rawPhoneOtp = generatePhoneOtp();

          return {
            purpose: "phone_verification" as const,
            tokenHash: hashToken(rawPhoneOtp),
            expiresAt: new Date(now + PHONE_OTP_TTL_MS),
          };
        })();

    const account = await this.identityRepository.register({
      id: userId,
      displayName,
      passwordHash,
      ...(email
        ? {
            email: {
              identifier: email,
              normalizedIdentifier: email,
            },
          }
        : {}),
      ...(phone
        ? {
            phone: {
              identifier: phone,
              normalizedIdentifier: phone,
            },
          }
        : {}),
      verificationToken,
    });

    if (email && rawEmailToken) {
      try {
        await this.emailSender.send(
          buildEmailVerificationMessage({
            email,
            token: rawEmailToken,
            frontendBaseUrl: this.options.frontendBaseUrl,
            brandName: this.options.brandName,
          }),
        );
      } catch (error) {
        logger.warn(
          { err: error, userId: account.id },
          "Failed to send registration verification email; account was created",
        );
      }
    }

    if (phone && rawPhoneOtp) {
      // Log the otp until SMS delivery is configured
      console.log("Phone registration OTP created:", rawPhoneOtp);
      logger.info(
        { userId: account.id },
        "Phone registration OTP created; SMS delivery is not configured yet",
      );
    }

    return account;
  }
}
