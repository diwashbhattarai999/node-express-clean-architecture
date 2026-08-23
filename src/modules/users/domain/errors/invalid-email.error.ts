import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class InvalidEmailError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.INVALID_EMAIL,
      message: "The provided email address is invalid.",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
