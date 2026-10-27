import { describe, expect, it } from "vitest";

import { NoopEmailSender } from "@/infrastructure/email/noop-email.sender";
import { EmailSendError } from "@/shared/email/errors/email-send.error";

describe("NoopEmailSender", () => {
  it("returns a noop id without sending", async () => {
    const sender = new NoopEmailSender();

    const result = await sender.send({
      to: { email: "user@example.com" },
      subject: "Hello",
      text: "World",
    });

    expect(result.id).toMatch(/^noop_/);
  });

  it("rejects messages without html or text", async () => {
    const sender = new NoopEmailSender();

    await expect(
      sender.send({
        to: { email: "user@example.com" },
        subject: "Hello",
      }),
    ).rejects.toBeInstanceOf(EmailSendError);
  });
});
