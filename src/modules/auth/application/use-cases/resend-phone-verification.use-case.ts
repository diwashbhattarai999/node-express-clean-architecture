import { PHONE_OTP_TTL_MS } from "@/modules/auth/application/constants/phone-verification";
import type { ResendPhoneVerificationDto } from "@/modules/auth/application/dto/resend-phone-verification.dto";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { generatePhoneOtp } from "@/modules/auth/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/application/utils/hash-token";
import { logger } from "@/shared/logger/logger";

/**
 * Always completes successfully for anti-enumeration.
 * Rotates the phone OTP when an unverified phone identity exists.
 * SMS delivery is not configured yet — OTP is stored hashed only.
 */
export class ResendPhoneVerificationUseCase {
  public constructor(private readonly authAccountRepository: IAuthAccountRepository) {}

  public async execute(dto: ResendPhoneVerificationDto): Promise<void> {
    const phone = dto.phone.trim();
    const identity = await this.authAccountRepository.findUnverifiedPhoneIdentity(phone);

    if (!identity) {
      return;
    }

    const rawOtp = generatePhoneOtp();

    await this.authAccountRepository.replacePhoneVerificationToken({
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
