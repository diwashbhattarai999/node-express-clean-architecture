import type { Server } from "node:http";

export type THttpServerTimeouts = {
  requestTimeoutMs: number;
  headersTimeoutMs: number;
  keepAliveTimeoutMs: number;
};

export const configureHttpServer = (server: Server, timeouts: THttpServerTimeouts): Server => {
  server.requestTimeout = timeouts.requestTimeoutMs;
  server.headersTimeout = timeouts.headersTimeoutMs;
  server.keepAliveTimeout = timeouts.keepAliveTimeoutMs;

  return server;
};
