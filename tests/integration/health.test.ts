import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "@/app/create-app";
import { checkDatabaseHealth } from "@/infrastructure/database/drizzle/health-check";

vi.mock("@/infrastructure/database/health-check", () => ({
  checkDatabaseHealth: vi.fn(),
}));

const mockedCheckDatabaseHealth = vi.mocked(checkDatabaseHealth);

describe("Health", () => {
  const app = createApp();

  beforeEach(() => {
    mockedCheckDatabaseHealth.mockReset();
    mockedCheckDatabaseHealth.mockResolvedValue(true);
  });

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

  it("returns a success payload for GET /ready when the database is healthy", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);

    expect(response.body).toEqual({
      success: true,
      message: "Service is ready.",
      data: {
        status: "ok",
        checks: {
          database: "ok",
        },
      },
    });
    expect(mockedCheckDatabaseHealth).toHaveBeenCalledOnce();
  });

  it("returns 503 for GET /ready when the database is unavailable", async () => {
    mockedCheckDatabaseHealth.mockResolvedValue(false);

    const response = await request(app).get("/ready");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: true,
      message: "Service is not ready.",
      data: {
        status: "unavailable",
        checks: {
          database: "unavailable",
        },
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
