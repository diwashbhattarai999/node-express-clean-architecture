import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { configureHttpServer } from "@/app/http/configure-http-server";

describe("configureHttpServer", () => {
  it("sets request, headers, and keep-alive timeouts on the server", () => {
    const server = createServer();

    configureHttpServer(server, {
      requestTimeoutMs: 30_000,
      headersTimeoutMs: 70_000,
      keepAliveTimeoutMs: 65_000,
    });

    expect(server.requestTimeout).toBe(30_000);
    expect(server.headersTimeout).toBe(70_000);
    expect(server.keepAliveTimeout).toBe(65_000);

    server.close();
  });
});
