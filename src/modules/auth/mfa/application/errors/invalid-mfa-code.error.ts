import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class InvalidMfaCodeError extends AppError {
  public constructor(message = "Invalid verification code.") {
    super({
      code: ErrorCode.INVALID_CREDENTIALS,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });

    this.name = "InvalidMfaCodeError";
  }
}
