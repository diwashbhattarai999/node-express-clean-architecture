import rateLimit from "express-rate-limit";

import { env } from "@/config/env";
import { RateLimitExceededError } from "@/shared/errors/rate-limit-error";
import { HttpStatus } from "@/shared/http/http-status";

/** Skip probes only. Feature routes (including uploads) stay rate-limited. */
const shouldSkipRateLimit = (path: string) => {
  return path.startsWith("/health") || path.startsWith("/ready");
};

/**
 * Global rate limiter.
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
