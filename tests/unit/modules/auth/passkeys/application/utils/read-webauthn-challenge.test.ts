import { describe, expect, it } from "vitest";

import { readWebAuthnClientChallenge } from "@/modules/auth/passkeys/application/utils/read-webauthn-challenge";

describe("readWebAuthnClientChallenge", () => {
  it("reads the challenge from clientDataJSON", () => {
    const clientDataJSON = Buffer.from(
      JSON.stringify({ type: "webauthn.get", challenge: "abc123", origin: "http://localhost:5173" }),
    ).toString("base64url");

    expect(readWebAuthnClientChallenge(clientDataJSON)).toBe("abc123");
  });

  it("returns null for invalid payloads", () => {
    expect(readWebAuthnClientChallenge("not-base64")).toBeNull();
  });
});
