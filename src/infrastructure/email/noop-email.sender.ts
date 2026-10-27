import { randomUUID } from "node:crypto";

import type { EmailMessage, SendEmailResult } from "@/shared/email/email.message";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { EmailSendError } from "@/shared/email/errors/email-send.error";
import { logger } from "@/shared/logger/logger";

export class NoopEmailSender implements IEmailSender {
  public async send(message: EmailMessage): Promise<SendEmailResult> {
    if (!message.html && !message.text) {
      throw new EmailSendError("Email message must include html and/or text content.");
    }

    const id = `noop_${randomUUID()}`;

    logger.debug(
      {
        id,
        to: message.to,
        subject: message.subject,
      },
      "Noop email sender: message not delivered",
    );

    return { id };
  }
}
