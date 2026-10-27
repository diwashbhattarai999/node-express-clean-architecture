import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state of the resource.") {
    super({
      code: ErrorCode.CONFLICT,
      message,
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "ConflictError";
  }
}
