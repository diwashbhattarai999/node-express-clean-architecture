import { AppError } from "@/shared/errors/app-error";
import { HttpStatus } from "@/shared/http/http-status";

import { ErrorCode } from "./error-code";

export class RateLimitExceededError extends AppError {
  public constructor(message = "Too many requests. Please try again later.") {
    super({
      message,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
