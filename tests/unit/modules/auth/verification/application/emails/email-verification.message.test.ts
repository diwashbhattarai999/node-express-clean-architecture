import { describe, expect, it } from "vitest";

import { buildEmailVerificationMessage } from "@/modules/auth/verification/application/emails/email-verification.message";

describe("buildEmailVerificationMessage", () => {
  it("builds subject, text, and html with the frontend verify URL", () => {
    const message = buildEmailVerificationMessage({
      email: "ada@example.com",
      token: "verify-token",
      frontendBaseUrl: "http://localhost:5173",
      brandName: "Acme",
    });

    expect(message.to).toEqual({ email: "ada@example.com" });
    expect(message.subject).toBe("Verify your email address");
    expect(message.text).toContain("http://localhost:5173/verify-email?token=verify-token");
    expect(message.text).not.toContain("ALTERNATIVE VERIFICATION CODE");
    expect(message.html).toContain("http://localhost:5173/verify-email?token=verify-token");
    expect(message.html).toContain("Acme");
    expect(message.html).not.toContain("Prefer to verify manually?");
    expect(message.tags).toEqual({ purpose: "email_verification" });
  });

  it("escapes HTML-sensitive characters in the brand name", () => {
    const message = buildEmailVerificationMessage({
      email: "ada@example.com",
      token: "verify-token",
      frontendBaseUrl: "http://localhost:5173",
      brandName: `Brand <script>`,
    });

    expect(message.html).toContain("Brand &lt;script&gt;");
    expect(message.html).not.toContain("<script>");
  });
});
