import type { ErrorRequestHandler } from "express";

import { env } from "@/config/env";
import { Environment } from "@/shared/constants/environment";
import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { HttpStatus } from "@/shared/http/http-status";
import { logger } from "@/shared/logger/logger";

/**
 * Handles errors in the request pipeline.
 *
 * @param error - The error to handle.
 * @param req - The request object.
 * @param res - The response object.
 * @param _next - The next function.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next): void => {
  const isAppError = error instanceof AppError;

  const statusCode = isAppError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

  const code = isAppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR;

  const message =
    isAppError || env.NODE_ENV === Environment.LOCAL
      ? error instanceof Error
        ? error.message
        : String(error)
      : "An unexpected error occurred.";

  logger.error(
    {
      err: error,
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      code,
    },
    "Request failed",
  );

  res.status(statusCode).json({
    success: false,
    message,
    code,
    requestId: req.requestId,
    ...(isAppError && error.details !== undefined ? { details: error.details } : {}),
  });
};
