import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app/create-app";

describe("Cookie parser", () => {
  const app = createApp({
    configure: (app) => {
      app.get("/test/cookies", (req, res) => {
        res.status(200).json({
          cookies: req.cookies,
          signedCookies: req.signedCookies,
        });
      });

      app.post("/test/cookies/set", (req, res) => {
        res.cookie("theme", "dark");
        res.cookie("session", "abc123", { signed: true });
        res.status(200).json({ success: true });
      });
    },
  });

  it("parses unsigned cookies into req.cookies", async () => {
    const response = await request(app)
      .get("/test/cookies")
      .set("Cookie", "theme=dark; locale=en");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      cookies: {
        theme: "dark",
        locale: "en",
      },
      signedCookies: {},
    });
  });

  it("returns empty cookie objects when no cookies are sent", async () => {
    const response = await request(app).get("/test/cookies");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      cookies: {},
      signedCookies: {},
    });
  });

  it("parses signed cookies into req.signedCookies", async () => {
    const agent = request.agent(app);

    await agent.post("/test/cookies/set");

    const response = await agent.get("/test/cookies");

    expect(response.status).toBe(200);
    expect(response.body.cookies).toMatchObject({
      theme: "dark",
    });
    expect(response.body.signedCookies).toMatchObject({
      session: "abc123",
    });
  });
});
