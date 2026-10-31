import { describe, expect, it } from "vitest";

import {
  appendOAuthClientState,
  appendOAuthRedirectQuery,
  buildOAuthCallbackUrl,
} from "@/modules/auth/oauth/application/utils/oauth-callback-url";

describe("oauth callback URL helpers", () => {
  it("builds the API callback URL without a trailing slash on the base", () => {
    expect(buildOAuthCallbackUrl("http://localhost:3000/", "google")).toBe(
      "http://localhost:3000/api/v1/auth/oauth/google/callback",
    );
  });

  it("appends client state to an https app return URL", () => {
    expect(appendOAuthClientState("http://localhost:5173/auth/callback", "csrf-1")).toBe(
      "http://localhost:5173/auth/callback?state=csrf-1",
    );
  });

  it("replaces an existing state query on the app return URL", () => {
    expect(
      appendOAuthClientState("http://localhost:5173/auth/callback?state=old", "csrf-1"),
    ).toBe("http://localhost:5173/auth/callback?state=csrf-1");
  });

  it("appends code and state for a native handoff", () => {
    expect(
      appendOAuthRedirectQuery("myapp://oauth", { code: "auth-code", state: "csrf-1" }),
    ).toBe("myapp://oauth?code=auth-code&state=csrf-1");
  });
});
