import rateLimit from "express-rate-limit";

import { env } from "@/config/env";
import { RateLimitExceededError } from "@/shared/errors/rate-limit-error";
import { HttpStatus } from "@/shared/http/http-status";

const shouldSkipRateLimit = (path: string) => {
  return path.startsWith("/health") || path.startsWith("/ready") || path.startsWith("/uploads");
};

/**
 * Global rate limiter middleware.
 *
 * This is a global rate limiter middleware that limits the number of requests to the server.
 * It's used to prevent abuse and DDoS attacks.
 *
 * @see https://www.npmjs.com/package/express-rate-limit
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,

  skip: (req) => shouldSkipRateLimit(req.path),

  handler: (_req, res) => {
    res.setHeader("Retry-After", "60");

    throw new RateLimitExceededError();
  },
});
