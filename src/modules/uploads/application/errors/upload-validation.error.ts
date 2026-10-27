import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import type { FieldError } from "@/shared/http/field-error";
import { HttpStatus } from "@/shared/http/http-status";

export class UploadValidationError extends AppError {
  public constructor(details: FieldError[], message = "Upload validation failed.") {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    });

    this.name = "UploadValidationError";
  }
}
