import { describe, expect, it } from "vitest";

import { resolveLoginIdentifier } from "@/modules/auth/credentials/application/utils/resolve-login-identifier";

describe("resolveLoginIdentifier", () => {
  it("resolves emails", () => {
    expect(resolveLoginIdentifier("Ada@Example.com")).toEqual({
      type: "email",
      normalizedIdentifier: "ada@example.com",
    });
  });

  it("resolves E.164 phones", () => {
    expect(resolveLoginIdentifier("+9779812345678")).toEqual({
      type: "phone",
      normalizedIdentifier: "+9779812345678",
    });
  });

  it("resolves usernames", () => {
    expect(resolveLoginIdentifier("Ada_Lovelace")).toEqual({
      type: "username",
      normalizedIdentifier: "ada_lovelace",
    });
  });
});
