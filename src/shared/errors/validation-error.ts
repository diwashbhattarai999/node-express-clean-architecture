import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export interface ValidationErrorDetail {
  path: PropertyKey[];
  message: string;
  code: string;
}

export class ValidationError extends AppError {
  constructor(details: ValidationErrorDetail[]) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Request validation failed.",
      statusCode: HttpStatus.BAD_REQUEST,
      details,
    });

    this.name = "ValidationError";
  }
}
