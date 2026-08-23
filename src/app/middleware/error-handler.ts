import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "@/config/env";
import { Environment } from "@/shared/constants/environment";
import { AppError } from "@/shared/errors/app-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { ValidationError } from "@/shared/errors/validation-error";
import type { ApiErrorResponse } from "@/shared/http/api-response";
import { toFieldErrors } from "@/shared/http/field-error";
import { HttpStatus } from "@/shared/http/http-status";
import { logger } from "@/shared/logger/logger";

const toAppError = (error: unknown, req: Parameters<ErrorRequestHandler>[1]): AppError | null => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new ValidationError(
      toFieldErrors(error.issues, {
        body: req.body,
        params: req.params,
        query: req.query,
      }),
    );
  }

  return null;
};

/**
 * Handles errors in the request pipeline.
 *
 * @param error - The error to handle.
 * @param req - The request object.
 * @param res - The response object.
 * @param _next - The next function.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next): void => {
  const appError = toAppError(error, req);
  const isAppError = appError !== null;

  const statusCode = isAppError ? appError.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

  const code = isAppError ? appError.code : ErrorCode.INTERNAL_SERVER_ERROR;

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

  const response: ApiErrorResponse = {
    success: false,
    message: isAppError ? appError.message : message,
    code,
    requestId: req.requestId,
    ...(isAppError && appError.details !== undefined ? { details: appError.details } : {}),
  };

  res.status(statusCode).json(response);
};
