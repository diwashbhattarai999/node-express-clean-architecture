import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class OAuthStateInvalidError extends AppError {
  public constructor(message = "OAuth state is invalid or has expired.") {
    super({
      code: ErrorCode.OAUTH_STATE_INVALID,
      message,
      statusCode: HttpStatus.BAD_REQUEST,
    });

    this.name = "OAuthStateInvalidError";
  }
}
