import type { TErrorCode } from "@/shared/errors/error-code";

import type { THttpStatus } from "../http/http-status";

export interface AppErrorOptions {
  code: TErrorCode;
  message: string;
  statusCode: THttpStatus;
  cause?: unknown;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code: TErrorCode;
  public readonly statusCode: THttpStatus;
  public readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message, {
      cause: options.cause,
    });

    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;

    Error.captureStackTrace(this, AppError);
  }
}
