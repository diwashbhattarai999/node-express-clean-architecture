import { describe, expect, it } from "vitest";

import { AesGcmSecretEncryptor } from "@/modules/auth/mfa/infrastructure/security/aes-gcm-secret.encryptor";

describe("AesGcmSecretEncryptor", () => {
  it("round-trips plaintext", () => {
    const encryptor = new AesGcmSecretEncryptor("test-auth-jwt-secret-at-least-32-chars");
    const payload = encryptor.encrypt("JBSWY3DPEHPK3PXP");

    expect(payload.startsWith("v1.")).toBe(true);
    expect(encryptor.decrypt(payload)).toBe("JBSWY3DPEHPK3PXP");
  });
});
