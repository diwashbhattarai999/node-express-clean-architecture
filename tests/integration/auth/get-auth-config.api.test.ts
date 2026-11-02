import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("Auth config API", () => {
  const app = createApp();

  it("returns public auth capabilities without auth", async () => {
    const response = await request(app).get("/api/v1/auth/config");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Auth config retrieved.",
      data: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigit: true,
          requireSpecial: true,
        },
        features: {
          registration: true,
          oauth: true,
          magicLink: true,
          mfa: true,
          passkeys: true,
          phoneAuth: true,
        },
      },
    });
    expect(response.body.data.providers).toEqual(
      expect.arrayContaining([
        { id: "password", name: "Password", type: "password", enabled: true },
        { id: "magic_link", name: "Magic link", type: "magic_link", enabled: true },
      ]),
    );
  });
});
