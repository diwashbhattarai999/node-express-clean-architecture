import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class UsernameReservedError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message: "This username is reserved.",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });

    this.name = "UsernameReservedError";
  }
}
