import { generatePhoneOtp } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { PHONE_OTP_TTL_MS } from "@/modules/auth/verification/application/constants/phone-verification";
import type { ResendPhoneVerificationDto } from "@/modules/auth/verification/application/dto/resend-phone-verification.dto";
import type { IVerificationRepository } from "@/modules/auth/verification/application/ports/verification.repository";
import { logger } from "@/shared/logger/logger";

/**
 * Always completes successfully for anti-enumeration.
 * Rotates the phone OTP when an unverified phone identity exists.
 * SMS delivery is not configured yet — OTP is stored hashed only.
 */
export class ResendPhoneVerificationUseCase {
  public constructor(private readonly verificationRepository: IVerificationRepository) {}

  public async execute(dto: ResendPhoneVerificationDto): Promise<void> {
    const phone = dto.phone.trim();
    const identity = await this.verificationRepository.findUnverifiedPhoneIdentity(phone);

    if (!identity) {
      return;
    }

    const rawOtp = generatePhoneOtp();

    await this.verificationRepository.replacePhoneVerificationToken({
      userId: identity.userId,
      identityId: identity.identityId,
      tokenHash: hashToken(rawOtp),
      expiresAt: new Date(Date.now() + PHONE_OTP_TTL_MS),
    });

    // Log the otp until SMS delivery is configured
    console.log("Phone verification OTP rotated:", rawOtp);
    logger.info(
      { userId: identity.userId },
      "Phone verification OTP rotated; SMS delivery is not configured yet",
    );
  }
}
