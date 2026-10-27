import { describe, expect, it } from "vitest";

import { EmailProvider } from "@/config/email-provider";
import type { TEnv } from "@/config/env-schema";
import { createEmailSender } from "@/infrastructure/email/create-email-sender";
import { NoopEmailSender } from "@/infrastructure/email/noop-email.sender";
import { ResendEmailSender } from "@/infrastructure/email/resend/resend-email.sender";

const baseEnv = {
  EMAIL_PROVIDER: EmailProvider.NOOP,
  EMAIL_FROM: undefined,
  EMAIL_FROM_NAME: undefined,
  RESEND_API_KEY: undefined,
} as TEnv;

describe("createEmailSender", () => {
  it("creates a noop sender when EMAIL_PROVIDER is noop", () => {
    const sender = createEmailSender({
      ...baseEnv,
      EMAIL_PROVIDER: EmailProvider.NOOP,
    });

    expect(sender).toBeInstanceOf(NoopEmailSender);
  });

  it("creates a Resend sender when EMAIL_PROVIDER is resend", () => {
    const sender = createEmailSender({
      ...baseEnv,
      EMAIL_PROVIDER: EmailProvider.RESEND,
      EMAIL_FROM: "noreply@example.com",
      EMAIL_FROM_NAME: "Starter",
      RESEND_API_KEY: "re_test_key",
    });

    expect(sender).toBeInstanceOf(ResendEmailSender);
  });

  it("throws when resend is selected without credentials", () => {
    expect(() =>
      createEmailSender({
        ...baseEnv,
        EMAIL_PROVIDER: EmailProvider.RESEND,
      }),
    ).toThrow(/RESEND_API_KEY and EMAIL_FROM are required/);
  });
});
