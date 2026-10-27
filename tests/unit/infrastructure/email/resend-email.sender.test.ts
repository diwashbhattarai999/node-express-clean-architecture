import { describe, expect, it, vi } from "vitest";

import { ResendEmailSender } from "@/infrastructure/email/resend/resend-email.sender";
import { EmailSendError } from "@/shared/email/errors/email-send.error";

describe("ResendEmailSender", () => {
  it("sends through the Resend client and returns the id", async () => {
    const send = vi.fn().mockResolvedValue({
      data: { id: "re_123" },
      error: null,
    });

    const sender = new ResendEmailSender({
      client: { emails: { send } },
      defaultFrom: { email: "noreply@example.com", name: "Starter" },
    });

    const result = await sender.send({
      to: { email: "user@example.com", name: "User" },
      subject: "Welcome",
      html: "<p>Hello</p>",
      text: "Hello",
      tags: { purpose: "welcome" },
    });

    expect(result).toEqual({ id: "re_123" });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Starter <noreply@example.com>",
        to: "User <user@example.com>",
        subject: "Welcome",
        html: "<p>Hello</p>",
        text: "Hello",
        tags: [{ name: "purpose", value: "welcome" }],
      }),
    );
  });

  it("throws EmailSendError when Resend returns an error payload", async () => {
    const send = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    const sender = new ResendEmailSender({
      client: { emails: { send } },
      defaultFrom: { email: "noreply@example.com" },
    });

    await expect(
      sender.send({
        to: { email: "user@example.com" },
        subject: "Welcome",
        text: "Hello",
      }),
    ).rejects.toMatchObject({
      name: "EmailSendError",
      message: "Invalid API key",
    });
  });

  it("throws EmailSendError when the Resend client throws", async () => {
    const send = vi.fn().mockRejectedValue(new Error("network down"));

    const sender = new ResendEmailSender({
      client: { emails: { send } },
      defaultFrom: { email: "noreply@example.com" },
    });

    await expect(
      sender.send({
        to: { email: "user@example.com" },
        subject: "Welcome",
        text: "Hello",
      }),
    ).rejects.toBeInstanceOf(EmailSendError);
  });
});
