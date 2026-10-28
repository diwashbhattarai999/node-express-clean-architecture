import { generateEmailVerificationToken } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import { EMAIL_VERIFICATION_TTL_MS } from "@/modules/auth/verification/application/constants/email-verification";
import type { ResendEmailVerificationDto } from "@/modules/auth/verification/application/dto/resend-email-verification.dto";
import { buildEmailVerificationMessage } from "@/modules/auth/verification/application/emails/email-verification.message";
import type { IVerificationRepository } from "@/modules/auth/verification/application/ports/verification.repository";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type ResendEmailVerificationUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

/**
 * Always completes successfully for anti-enumeration.
 * Sends a new verification email only when an unverified email identity exists.
 */
export class ResendEmailVerificationUseCase {
  public constructor(
    private readonly verificationRepository: IVerificationRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: ResendEmailVerificationUseCaseOptions,
  ) {}

  public async execute(dto: ResendEmailVerificationDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const identity = await this.verificationRepository.findUnverifiedEmailIdentity(email);

    if (!identity) {
      return;
    }

    const rawToken = generateEmailVerificationToken();

    await this.verificationRepository.replaceEmailVerificationToken({
      userId: identity.userId,
      identityId: identity.identityId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    });

    try {
      await this.emailSender.send(
        buildEmailVerificationMessage({
          email: identity.email,
          token: rawToken,
          frontendBaseUrl: this.options.frontendBaseUrl,
          brandName: this.options.brandName,
        }),
      );
    } catch (error) {
      logger.warn(
        { err: error, userId: identity.userId },
        "Failed to send email verification resend; token was rotated",
      );
    }
  }
}
