import { describe, expect, it } from "vitest";

import { isAllowedOAuthRedirectUri } from "@/modules/auth/oauth/application/utils/is-allowed-oauth-redirect-uri";

describe("isAllowedOAuthRedirectUri", () => {
  const frontend = "http://localhost:5173";

  it("allows any path on the frontend origin", () => {
    expect(isAllowedOAuthRedirectUri("http://localhost:5173/auth/callback", [], frontend)).toBe(
      true,
    );
  });

  it("allows an exact extra URI including custom schemes", () => {
    expect(isAllowedOAuthRedirectUri("myapp://oauth", ["myapp://oauth"], frontend)).toBe(true);
  });

  it("rejects another origin", () => {
    expect(isAllowedOAuthRedirectUri("https://evil.example/cb", [], frontend)).toBe(false);
  });
});
