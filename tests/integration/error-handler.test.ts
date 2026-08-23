import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";
import { NotFoundError } from "@/shared/errors/not-found-error";

describe("Error handling", () => {
  it("returns a consistent 404 response for unknown routes", async () => {
    const app = createApp();

    const response = await request(app)
      .get("/does-not-exist")
      .set("X-Request-ID", "test-request-id");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "Route GET /does-not-exist not found.",
      requestId: "test-request-id",
    });
  });

  it("returns a generic 500 response for unexpected errors", async () => {
    const app = createApp({
      configure: (app) => {
        app.get("/test-error", () => {
          throw new Error("Sensitive internal error");
        });
      },
    });

    const response = await request(app)
      .get("/test-error")
      .set("X-Request-ID", "test-request-id");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      requestId: "test-request-id",
    });
  });

  it("returns the correct status and code for application errors", async () => {
    const app = createApp({
      configure: (app) => {
        app.get("/test-not-found", () => {
          throw new NotFoundError("User not found.");
        });
      },
    });

    const response = await request(app)
      .get("/test-not-found")
      .set("X-Request-ID", "test-request-id");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      code: "NOT_FOUND",
      message: "User not found.",
      requestId: "test-request-id",
    });
  });
});
