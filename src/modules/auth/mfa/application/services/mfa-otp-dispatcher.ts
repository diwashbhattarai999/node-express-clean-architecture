import { buildMfaOtpMessage } from "@/modules/auth/mfa/application/emails/mfa-otp.message";
import type { MfaFactor } from "@/modules/auth/mfa/application/ports/mfa.repository";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { logger } from "@/shared/logger/logger";

export type MfaOtpDispatcherOptions = {
  brandName: string;
};

export class MfaOtpDispatcher {
  public constructor(
    private readonly emailSender: IEmailSender,
    private readonly options: MfaOtpDispatcherOptions,
  ) {}

  public async send(
    factor: Pick<MfaFactor, "type" | "destination" | "userId">,
    code: string,
  ): Promise<void> {
    if (factor.type === "email") {
      if (!factor.destination) {
        return;
      }

      await this.emailSender.send(
        buildMfaOtpMessage({
          email: factor.destination,
          code,
          brandName: this.options.brandName,
        }),
      );
      return;
    }

    if (factor.type === "sms") {
      console.log("MFA SMS OTP:", code);
      logger.info(
        { userId: factor.userId },
        "MFA SMS OTP issued; SMS delivery is not configured yet",
      );
    }
  }
}
