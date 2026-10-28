import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";

import { JoseAccessTokenSigner } from "@/modules/auth/infrastructure/security/jose-access-token.signer";

describe("JoseAccessTokenSigner", () => {
  it("signs an access token with required claims", async () => {
    const signer = new JoseAccessTokenSigner({
      secret: "test-auth-jwt-secret-at-least-32-chars",
      issuer: "api",
      audience: "api",
      expiresInSeconds: 600,
    });

    const signed = await signer.sign({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(signed.expiresIn).toBe(600);
    const payload = decodeJwt(signed.accessToken);
    expect(payload.sub).toBe("user-1");
    expect(payload.sid).toBe("session-1");
    expect(payload.iss).toBe("api");
    expect(payload.aud).toBe("api");
    expect(payload.jti).toEqual(expect.any(String));
  });
});
