import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("Body parser", () => {
  const app = createApp({
    configure: (app) => {
      app.post("/test/body", (req, res) => {
        res.status(200).json({
          body: req.body,
        });
      });
    },
  });

  it("parses JSON request bodies", async () => {
    const response = await request(app)
      .post("/test/body")
      .set("Content-Type", "application/json")
      .send({ name: "Ada", nested: { ok: true } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      body: {
        name: "Ada",
        nested: { ok: true },
      },
    });
  });

  it("parses URL-encoded request bodies", async () => {
    const response = await request(app)
      .post("/test/body")
      .type("form")
      .send({ email: "ada@example.com", role: "admin" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      body: {
        email: "ada@example.com",
        role: "admin",
      },
    });
  });

  it("returns an error for invalid JSON bodies", async () => {
    const response = await request(app)
      .post("/test/body")
      .set("Content-Type", "application/json")
      .set("X-Request-ID", "invalid-json-test")
      .send('{"name":');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toMatchObject({
      success: false,
      requestId: "invalid-json-test",
    });
  });

  it("leaves the body empty when no body is sent", async () => {
    const response = await request(app).post("/test/body");

    expect(response.status).toBe(200);
    expect(response.body.body ?? {}).toEqual({});
  });
});
