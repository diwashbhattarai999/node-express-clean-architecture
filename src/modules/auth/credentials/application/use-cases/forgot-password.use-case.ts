import { PASSWORD_RESET_TTL_MS } from "@/modules/auth/credentials/application/constants/password-reset";
import type { ForgotPasswordDto } from "@/modules/auth/credentials/application/dto/forgot-password.dto";
import { buildPasswordResetMessage } from "@/modules/auth/credentials/application/emails/password-reset.message";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { generatePasswordResetToken } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type ForgotPasswordUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

/**
 * Always completes successfully for anti-enumeration.
 * Sends a reset email only when an active account with a verified email + password exists.
 */
export class ForgotPasswordUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: ForgotPasswordUseCaseOptions,
  ) {}

  public async execute(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const target = await this.credentialsRepository.findPasswordResetTarget(email);

    if (!target) {
      return;
    }

    const rawToken = generatePasswordResetToken();

    await this.credentialsRepository.replacePasswordResetToken({
      userId: target.userId,
      identityId: target.identityId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    try {
      await this.emailSender.send(
        buildPasswordResetMessage({
          email: target.email,
          token: rawToken,
          frontendBaseUrl: this.options.frontendBaseUrl,
          brandName: this.options.brandName,
        }),
      );
    } catch (error) {
      logger.warn(
        { err: error, userId: target.userId },
        "Failed to send password-reset email; token was rotated",
      );
    }
  }
}
