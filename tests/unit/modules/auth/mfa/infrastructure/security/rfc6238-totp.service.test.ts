import { describe, expect, it } from "vitest";

import { Rfc6238TotpService } from "@/modules/auth/mfa/infrastructure/security/rfc6238-totp.service";

describe("Rfc6238TotpService", () => {
  const totp = new Rfc6238TotpService();

  it("verifies a code generated for the current window", () => {
    const { secret } = totp.generateSecret();
    const url = totp.buildOtpauthUrl({
      secret,
      accountName: "ada@example.com",
      issuer: "Acme",
    });

    expect(url).toContain("otpauth://totp/Acme:ada%40example.com");
    expect(url).toContain(`secret=${secret}`);

    const at = new Date("2026-01-01T00:00:00.000Z");
    expect(totp.verify(secret, totp.generate(secret, at), at)).toBe(true);
    expect(totp.verify(secret, "000000", at)).toBe(false);
  });

  it("accepts RFC 6238 SHA-1 6-digit vectors", () => {
    // Secret "12345678901234567890" as ASCII, base32 encoded
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    const at = new Date(1_111_111_109 * 1000);

    expect(totp.generate(secret, at)).toBe("081804");
    expect(totp.verify(secret, "081804", at)).toBe(true);
  });
});
