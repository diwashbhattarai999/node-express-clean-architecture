import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";

import { HttpStatus } from "../http/http-status";

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super({
      code: ErrorCode.NOT_FOUND,
      message,
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "NotFoundError";
  }
}
