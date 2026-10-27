import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus, type THttpStatus } from "@/shared/http/http-status";

export interface ExternalServiceErrorOptions {
  message?: string;
  cause?: unknown;
  statusCode?: THttpStatus;
  externalStatus?: number;
  timedOut?: boolean;
}

export class ExternalServiceError extends AppError {
  public readonly externalStatus?: number;
  public readonly timedOut: boolean;

  public constructor(options: ExternalServiceErrorOptions = {}) {
    const timedOut = options.timedOut === true;
    const code = timedOut ? ErrorCode.EXTERNAL_SERVICE_TIMEOUT : ErrorCode.EXTERNAL_SERVICE_ERROR;
    const message =
      options.message ??
      (timedOut ? "External service request timed out." : "External service request failed.");

    super({
      code,
      message,
      statusCode: options.statusCode ?? HttpStatus.BAD_GATEWAY,
      cause: options.cause,
    });

    this.name = "ExternalServiceError";
    this.timedOut = timedOut;

    if (options.externalStatus !== undefined) {
      this.externalStatus = options.externalStatus;
    }
  }
}
