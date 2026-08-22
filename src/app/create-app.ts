import express, { type Express } from "express";

import { corsMiddleware } from "./middleware/cors";
import { securityMiddleware } from "./middleware/security";
import { createRoutes } from "./routes";

/**
 * Creates an Express application.
 *
 * @returns The Express application.
 */
export const createApp = (): Express => {
  const app = express();

  /**
   * Security middleware.
   *
   * This is a security middleware that sets the security headers.
   */
  app.use(securityMiddleware);

  /**
   * CORS middleware.
   *
   * This is a CORS middleware that sets the CORS headers.
   */
  app.use(corsMiddleware);

  /**
   * Body Parser middleware.
   *
   * This is a body parser middleware that parses the request body.
   */
  app.use(express.json());

  /**
   * Routes middleware.
   *
   * This is a routes middleware that creates the routes.
   */
  app.use(createRoutes());

  return app;
};
