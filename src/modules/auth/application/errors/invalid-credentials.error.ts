import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class InvalidCredentialsError extends AppError {
  constructor(message = "Invalid credentials.") {
    super({
      code: ErrorCode.INVALID_CREDENTIALS,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });

    this.name = "InvalidCredentialsError";
  }
}
