import type { EmailMessage, SendEmailResult } from "@/shared/email/email.message";

export interface IEmailSender {
  send(message: EmailMessage): Promise<SendEmailResult>;
}
