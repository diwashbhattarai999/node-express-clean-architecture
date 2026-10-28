import { PASSWORD_RESET_TTL_MS } from "@/modules/auth/application/constants/password-reset";
import type { ForgotPasswordDto } from "@/modules/auth/application/dto/forgot-password.dto";
import { buildPasswordResetMessage } from "@/modules/auth/application/emails/password-reset.message";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import { generatePasswordResetToken } from "@/modules/auth/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/application/utils/hash-token";
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
    private readonly authAccountRepository: IAuthAccountRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: ForgotPasswordUseCaseOptions,
  ) {}

  public async execute(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const target = await this.authAccountRepository.findPasswordResetTarget(email);

    if (!target) {
      return;
    }

    const rawToken = generatePasswordResetToken();

    await this.authAccountRepository.replacePasswordResetToken({
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
