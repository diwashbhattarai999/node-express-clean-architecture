import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("Health", () => {
  const app = createApp();

  it("returns a success payload for GET /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      success: true,
      message: "Service is healthy.",
      data: {
        status: "ok",
      },
    });
  });

  it("rejects unsupported methods on /health", async () => {
    const response = await request(app).post("/health");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });

  it("returns a success payload for GET /ready", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      success: true,
      message: "Service is ready.",
      data: {
        status: "ok",
        checks: {},
      },
    });
  });

  it("rejects unsupported methods on /ready", async () => {
    const response = await request(app).post("/ready");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });
});
