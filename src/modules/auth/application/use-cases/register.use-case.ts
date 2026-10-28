import { randomUUID } from "node:crypto";

import { EMAIL_VERIFICATION_TTL_MS } from "@/modules/auth/application/constants/email-verification";
import { PHONE_OTP_TTL_MS } from "@/modules/auth/application/constants/phone-verification";
import type { RegisterDto } from "@/modules/auth/application/dto/register.dto";
import { buildEmailVerificationMessage } from "@/modules/auth/application/emails/email-verification.message";
import { IdentityAlreadyExistsError } from "@/modules/auth/application/errors/identity-already-exists.error";
import type {
  AuthUser,
  IAuthAccountRepository,
} from "@/modules/auth/application/ports/auth-account.repository";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import {
  generateEmailVerificationToken,
  generatePhoneOtp,
} from "@/modules/auth/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/application/utils/hash-token";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type RegisterUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

export class RegisterUseCase {
  public constructor(
    private readonly authAccountRepository: IAuthAccountRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailSender: IEmailSender,
    private readonly options: RegisterUseCaseOptions,
  ) {}

  public async execute(dto: RegisterDto): Promise<AuthUser> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const displayName = dto.displayName?.trim() || null;

    if (email) {
      const existing = await this.authAccountRepository.findIdentityByNormalized("email", email);

      if (existing) {
        throw new IdentityAlreadyExistsError();
      }
    }

    if (phone) {
      const existing = await this.authAccountRepository.findIdentityByNormalized("phone", phone);

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

    const account = await this.authAccountRepository.register({
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
