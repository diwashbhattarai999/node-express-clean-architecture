import express, { type Express } from "express";

import { createRoutes } from "./routes";

/**
 * Creates an Express application.
 *
 * @returns The Express application.
 */
export const createApp = (): Express => {
  const app = express();

  app.use(express.json());
  app.use(createRoutes());

  return app;
};
