import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class UserEmailAlreadyExistsError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.USER_EMAIL_ALREADY_EXISTS,
      message: "A user with this email address already exists.",
      statusCode: HttpStatus.BAD_REQUEST,
    });
  }
}
