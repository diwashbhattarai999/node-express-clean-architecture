import type { CreateEmailOptions, CreateEmailResponse } from "resend";

import type { EmailAddress, EmailMessage, SendEmailResult } from "@/shared/email/email.message";
import type { IEmailSender } from "@/shared/email/email-sender.port";
import { EmailSendError } from "@/shared/email/errors/email-send.error";

export interface ResendEmailsApi {
  send: (payload: CreateEmailOptions) => Promise<CreateEmailResponse>;
}

export interface ResendEmailSenderOptions {
  client: { emails: ResendEmailsApi };
  defaultFrom: EmailAddress;
}

const formatAddress = (address: EmailAddress): string => {
  if (!address.name) {
    return address.email;
  }

  return `${address.name} <${address.email}>`;
};

const toAddressList = (to: EmailAddress | EmailAddress[]): string | string[] => {
  if (Array.isArray(to)) {
    return to.map(formatAddress);
  }

  return formatAddress(to);
};

export class ResendEmailSender implements IEmailSender {
  private readonly client: { emails: ResendEmailsApi };
  private readonly defaultFrom: EmailAddress;

  public constructor(options: ResendEmailSenderOptions) {
    this.client = options.client;
    this.defaultFrom = options.defaultFrom;
  }

  public async send(message: EmailMessage): Promise<SendEmailResult> {
    if (!message.html && !message.text) {
      throw new EmailSendError("Email message must include html and/or text content.");
    }

    const from = message.from ?? this.defaultFrom;

    const payload = {
      from: formatAddress(from),
      to: toAddressList(message.to),
      subject: message.subject,
      ...(message.html ? { html: message.html } : {}),
      ...(message.text ? { text: message.text } : {}),
      ...(message.replyTo ? { replyTo: formatAddress(message.replyTo) } : {}),
      ...(message.tags
        ? {
            tags: Object.entries(message.tags).map(([name, value]) => ({
              name,
              value,
            })),
          }
        : {}),
    } as CreateEmailOptions;

    let response: CreateEmailResponse;

    try {
      response = await this.client.emails.send(payload);
    } catch (error) {
      throw new EmailSendError("Failed to send email via Resend.", error);
    }

    if (response.error) {
      throw new EmailSendError(response.error.message || "Failed to send email via Resend.");
    }

    if (!response.data?.id) {
      throw new EmailSendError("Resend did not return an email id.");
    }

    return { id: response.data.id };
  }
}
