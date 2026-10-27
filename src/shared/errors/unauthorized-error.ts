import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });

    this.name = "UnauthorizedError";
  }
}
