import { Resend } from "resend";

import { EmailProvider } from "@/config/email-provider";
import type { TEnv } from "@/config/env-schema";
import { NoopEmailSender } from "@/infrastructure/email/noop-email.sender";
import { ResendEmailSender } from "@/infrastructure/email/resend/resend-email.sender";
import type { IEmailSender } from "@/shared/email/email-sender.port";

export const createEmailSender = (env: TEnv): IEmailSender => {
  if (env.EMAIL_PROVIDER === EmailProvider.NOOP) {
    return new NoopEmailSender();
  }

  if (env.EMAIL_PROVIDER === EmailProvider.RESEND) {
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      throw new Error("RESEND_API_KEY and EMAIL_FROM are required when EMAIL_PROVIDER is resend.");
    }

    return new ResendEmailSender({
      client: new Resend(env.RESEND_API_KEY),
      defaultFrom: {
        email: env.EMAIL_FROM,
        ...(env.EMAIL_FROM_NAME ? { name: env.EMAIL_FROM_NAME } : {}),
      },
    });
  }

  throw new Error(`Invalid email provider: ${env.EMAIL_PROVIDER}`);
};
