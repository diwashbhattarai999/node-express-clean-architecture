import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("Auth list providers API", () => {
  const app = createApp();

  it("returns the public provider catalog without auth", async () => {
    const response = await request(app).get("/api/v1/auth/providers");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Auth providers retrieved.");
    expect(response.body.data).toEqual([
      { id: "password", name: "Password", type: "password", enabled: true },
      { id: "google", name: "Google", type: "oauth", enabled: true },
      { id: "github", name: "GitHub", type: "oauth", enabled: false },
      { id: "apple", name: "Apple", type: "oauth", enabled: false },
      { id: "microsoft", name: "Microsoft", type: "oauth", enabled: false },
      { id: "oidc", name: "OIDC", type: "oidc", enabled: false },
      { id: "magic_link", name: "Magic link", type: "magic_link", enabled: false },
    ]);
  });
});
