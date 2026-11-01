import { MAGIC_LINK_TTL_MS } from "@/modules/auth/credentials/application/constants/magic-link";
import type { RequestMagicLinkDto } from "@/modules/auth/credentials/application/dto/request-magic-link.dto";
import { buildMagicLinkMessage } from "@/modules/auth/credentials/application/emails/magic-link.message";
import type { ICredentialsRepository } from "@/modules/auth/credentials/application/ports/credentials.repository";
import { generateMagicLinkToken } from "@/modules/auth/shared/application/utils/generate-verification-secrets";
import { hashToken } from "@/modules/auth/shared/application/utils/hash-token";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type RequestMagicLinkUseCaseOptions = {
  frontendBaseUrl: string;
  brandName: string;
};

/**
 * Always completes successfully for anti-enumeration.
 * Sends a magic-link email only when an active or pending account has that email.
 */
export class RequestMagicLinkUseCase {
  public constructor(
    private readonly credentialsRepository: ICredentialsRepository,
    private readonly emailSender: IEmailSender,
    private readonly options: RequestMagicLinkUseCaseOptions,
  ) {}

  public async execute(dto: RequestMagicLinkDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    const target = await this.credentialsRepository.findMagicLinkTarget(email);

    if (!target) {
      return;
    }

    const rawToken = generateMagicLinkToken();

    await this.credentialsRepository.replaceMagicLinkToken({
      userId: target.userId,
      identityId: target.identityId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    });

    try {
      await this.emailSender.send(
        buildMagicLinkMessage({
          email: target.email,
          token: rawToken,
          frontendBaseUrl: this.options.frontendBaseUrl,
          brandName: this.options.brandName,
        }),
      );
    } catch (error) {
      logger.warn(
        { err: error, userId: target.userId },
        "Failed to send magic-link email; token was rotated",
      );
    }
  }
}
