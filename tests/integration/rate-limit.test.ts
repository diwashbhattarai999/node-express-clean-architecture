import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

describe("Rate limit", () => {
  let app: Express;

  beforeAll(async () => {
    process.env.RATE_LIMIT_MAX_REQUESTS = "2";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";

    vi.resetModules();

    const { createApp } = await import("@/app/create-app");
    app = createApp();
  });

  it("allows requests under the configured /api limit", async () => {
    const first = await request(app).get("/api/v1");
    const second = await request(app).get("/api/v1");

    expect(first.status).not.toBe(429);
    expect(second.status).not.toBe(429);
  });

  it("returns 429 when the /api rate limit is exceeded", async () => {
    const response = await request(app)
      .get("/api/v1")
      .set("X-Request-ID", "rate-limit-test");

    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBe("60");

    expect(response.body).toEqual({
      success: false,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
      requestId: "rate-limit-test",
    });
  });

  it("does not rate limit /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "ok",
      },
    });
  });
});
