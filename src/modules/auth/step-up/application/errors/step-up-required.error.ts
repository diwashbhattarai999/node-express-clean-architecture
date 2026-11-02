import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";

export class StepUpRequiredError extends AppError {
  public constructor(message = "Step-up authentication is required for this action.") {
    super({
      code: ErrorCode.STEP_UP_REQUIRED,
      message,
      statusCode: HttpStatus.FORBIDDEN,
    });

    this.name = "StepUpRequiredError";
  }
}
