import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class AccountDeletionNotFoundError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.NOT_FOUND,
      message: "No pending account deletion request.",
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "AccountDeletionNotFoundError";
  }
}
