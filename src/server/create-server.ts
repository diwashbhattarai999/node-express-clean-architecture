import { createServer, type Server } from "node:http";

import type { Express } from "express";

export const createHttpServer = (app: Express): Server => {
  return createServer(app);
};
