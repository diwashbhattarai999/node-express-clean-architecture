import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class EmailSendError extends AppError {
  public constructor(message = "Failed to send email.", cause?: unknown) {
    super({
      code: ErrorCode.EMAIL_SEND_FAILED,
      message,
      statusCode: HttpStatus.BAD_GATEWAY,
      cause,
    });

    this.name = "EmailSendError";
  }
}
