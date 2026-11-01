import { describe, expect, it } from "vitest";

import { buildMagicLinkMessage } from "@/modules/auth/credentials/application/emails/magic-link.message";

describe("buildMagicLinkMessage", () => {
  it("builds subject, text, and html with the frontend magic-link URL", () => {
    const message = buildMagicLinkMessage({
      email: "ada@example.com",
      token: "magic-token",
      frontendBaseUrl: "http://localhost:5173",
      brandName: "Acme",
    });

    expect(message.to).toEqual({ email: "ada@example.com" });
    expect(message.subject).toBe("Sign in to your account");
    expect(message.text).toContain("http://localhost:5173/magic-link?token=magic-token");
    expect(message.html).toContain("http://localhost:5173/magic-link?token=magic-token");
    expect(message.html).toContain("Acme");
    expect(message.tags).toEqual({ purpose: "magic_link" });
  });

  it("escapes HTML-sensitive characters in the brand name", () => {
    const message = buildMagicLinkMessage({
      email: "ada@example.com",
      token: "magic-token",
      frontendBaseUrl: "http://localhost:5173",
      brandName: "Brand <script>",
    });

    expect(message.html).toContain("Brand &lt;script&gt;");
    expect(message.html).not.toContain("<script>");
  });
});
