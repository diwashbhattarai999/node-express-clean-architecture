import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import type { FieldError } from "@/shared/http/field-error";
import { HttpStatus } from "@/shared/http/http-status";

export class ValidationError extends AppError {
  constructor(details: FieldError[]) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Request validation failed.",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    });

    this.name = "ValidationError";
  }
}
