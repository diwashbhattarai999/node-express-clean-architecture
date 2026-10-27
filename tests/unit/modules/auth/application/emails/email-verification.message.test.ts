import { describe, expect, it } from "vitest";

import { buildEmailVerificationMessage } from "@/modules/auth/application/emails/email-verification.message";

describe("buildEmailVerificationMessage", () => {
  it("builds subject, text, and html with the token and verify URL", () => {
    const message = buildEmailVerificationMessage({
      email: "ada@example.com",
      token: "verify-token",
      appBaseUrl: "http://localhost:3000",
    });

    expect(message.to).toEqual({ email: "ada@example.com" });
    expect(message.subject).toBe("Verify your email address");
    expect(message.text).toContain("verify-token");
    expect(message.text).toContain("http://localhost:3000/api/v1/auth/email/verify");
    expect(message.html).toContain("verify-token");
    expect(message.tags).toEqual({ purpose: "email_verification" });
  });
});
