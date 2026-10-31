import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class LastAuthMethodError extends AppError {
  public constructor() {
    super({
      code: ErrorCode.LAST_AUTH_METHOD,
      message: "Cannot remove the last sign-in method on this account.",
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "LastAuthMethodError";
  }
}
