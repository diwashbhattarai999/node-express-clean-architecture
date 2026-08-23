import express, { type Express } from "express";

import { env } from "@/config/env";

import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { httpLoggerMiddleware } from "./middleware/logger";
import { notFoundMiddleware } from "./middleware/not-found";
import { globalRateLimiter } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { securityMiddleware } from "./middleware/security";
import { apiRouter } from "./routes";
import { healthRouter } from "./routes/health.routes";

export type CreateAppOptions = {
  /**
   * Registers additional routes/middleware before the not-found and error handlers.
   * Useful for tests that need controlled failure paths.
   */
  configure?: (app: Express) => void;
};

/**
 * Creates an Express application.
 *
 * @param options - Optional application configuration.
 * @returns The Express application.
 */
export const createApp = (options: CreateAppOptions = {}): Express => {
  const app = express();

  /**
   * Trust proxy middleware.
   *
   * This is a trust proxy middleware that sets the trust proxy.
   * It's needed if the app is behind a proxy.
   * For example, if the app is behind a load balancer or a CDN.
   */
  app.set("trust proxy", env.TRUST_PROXY);

  /**
   * Request ID middleware.
   *
   * This is a request ID middleware that sets the request ID.
   */
  app.use(requestIdMiddleware);

  /**
   * HTTP Logger middleware.
   *
   * This is a HTTP logger middleware that logs the HTTP requests.
   */
  app.use(httpLoggerMiddleware);

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
   * Global rate limiter middleware.
   *
   * This is a global rate limiter middleware that limits the number of requests to the server.
   */
  app.use(globalRateLimiter);

  /**
   * Routes middleware.
   *
   * This is a routes middleware that creates the routes.
   */
  app.use("/api", apiRouter);
  app.use("/", healthRouter);

  /**
   * Configure middleware.
   *
   * This is a configure middleware that registers additional routes/middleware
   * before the not-found and error handlers.
   */
  options.configure?.(app);

  /**
   * Not found middleware.
   *
   * This is a not found middleware that handles not found errors.
   */
  app.use(notFoundMiddleware);

  /**
   * Error handler middleware.
   *
   * This is a error handler middleware that handles errors in the request pipeline.
   */
  app.use(errorHandler);

  return app;
};
