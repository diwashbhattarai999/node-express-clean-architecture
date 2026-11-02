import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class StepUpMethodUnavailableError extends AppError {
  public constructor(message = "The requested step-up method is not available.") {
    super({
      code: ErrorCode.CONFLICT,
      message,
      statusCode: HttpStatus.CONFLICT,
    });

    this.name = "StepUpMethodUnavailableError";
  }
}
