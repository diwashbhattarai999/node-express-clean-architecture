import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });

    this.name = "ForbiddenError";
  }
}
