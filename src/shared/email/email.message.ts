export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: EmailAddress;
  tags?: Record<string, string>;
  /** When omitted, adapters use the configured default from address. */
  from?: EmailAddress;
}

export interface SendEmailResult {
  id: string;
}
