import compression from "compression";
import express, { type Express } from "express";

import { type ApplicationModules, createApplicationModules } from "@/app/composition";
import { env } from "@/config/env";

import { cookieMiddleware } from "./middleware/cookies";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";
import { httpLoggerMiddleware } from "./middleware/logger";
import { notFoundMiddleware } from "./middleware/not-found";
import { globalRateLimiter } from "./middleware/rate-limit";
import { requestIdMiddleware } from "./middleware/request-id";
import { securityMiddleware } from "./middleware/security";
import { createApiRouter } from "./routes";
import { rootRouter } from "./routes/root.routes";

export type CreateAppOptions = {
  /**
   * Registers additional routes/middleware before the not-found and error handlers.
   * Useful for tests that need controlled failure paths.
   */
  configure?: (app: Express) => void;
  /** Override composition (tests). Defaults to createApplicationModules(). */
  modules?: ApplicationModules;
};

/**
 * Creates an Express application with global middleware and versioned API routes.
 */
export const createApp = (options: CreateAppOptions = {}): Express => {
  const app = express();
  const modules = options.modules ?? createApplicationModules();

  app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);
  app.use(securityMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb", parameterLimit: 10000 }));
  app.use(globalRateLimiter);
  app.use(cookieMiddleware);
  app.use(compression({ threshold: 1024 }));

  app.use("/api", createApiRouter(modules));
  app.use("/", rootRouter);

  options.configure?.(app);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
};
