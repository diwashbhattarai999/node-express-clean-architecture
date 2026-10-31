import { describe, expect, it } from "vitest";

import {
  toOAuthAccountResponse,
  toOAuthAccountResponseList,
} from "@/modules/auth/oauth/presentation/http/mappers/oauth-account.response";

describe("oauth-account.response", () => {
  const account = {
    id: "ext-1",
    provider: "google",
    providerEmail: "ada@example.com",
    linkedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
  };

  it("maps dates to ISO strings", () => {
    expect(toOAuthAccountResponse(account)).toEqual({
      id: "ext-1",
      provider: "google",
      providerEmail: "ada@example.com",
      linkedAt: "2026-01-01T00:00:00.000Z",
      lastUsedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("maps a null lastUsedAt and providerEmail", () => {
    expect(
      toOAuthAccountResponse({
        ...account,
        providerEmail: null,
        lastUsedAt: null,
      }),
    ).toMatchObject({
      providerEmail: null,
      lastUsedAt: null,
    });
  });

  it("maps a list", () => {
    expect(toOAuthAccountResponseList([account])).toHaveLength(1);
  });
});
