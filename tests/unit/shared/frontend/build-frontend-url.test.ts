import { describe, expect, it } from "vitest";

import { buildFrontendUrl, FrontendRoutes } from "@/shared/frontend";

describe("buildFrontendUrl", () => {
  it("joins FRONTEND_BASE_URL with a known route and query params", () => {
    expect(
      buildFrontendUrl({
        baseUrl: "https://app.example.com",
        path: FrontendRoutes.verifyEmail,
        query: { token: "abc123" },
      }),
    ).toBe("https://app.example.com/verify-email?token=abc123");
  });

  it("normalizes a trailing slash on the base URL", () => {
    expect(
      buildFrontendUrl({
        baseUrl: "https://app.example.com/",
        path: FrontendRoutes.verifyEmail,
      }),
    ).toBe("https://app.example.com/verify-email");
  });
});
