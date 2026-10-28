import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class IdentityAlreadyExistsError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.CONFLICT,
      message: "An account with this identity already exists.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "IdentityAlreadyExistsError";
  }
}
