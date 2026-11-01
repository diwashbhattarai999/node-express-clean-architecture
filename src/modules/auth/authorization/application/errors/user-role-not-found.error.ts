import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class UserRoleNotFoundError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "This role is not assigned to the user.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "UserRoleNotFoundError";
  }
}
