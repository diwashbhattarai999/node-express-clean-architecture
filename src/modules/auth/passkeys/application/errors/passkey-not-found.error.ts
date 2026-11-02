import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class PasskeyNotFoundError extends AppError {
  public constructor(message = "Passkey not found.") {
    super({
      code: ErrorCode.NOT_FOUND,
      message,
      statusCode: HttpStatus.NOT_FOUND,
    });

    this.name = "PasskeyNotFoundError";
  }
}
