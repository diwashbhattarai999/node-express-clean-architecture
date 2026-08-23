import type { Response } from "express";

import type { ApiSuccessResponse, ApiSuccessResponseWithMeta } from "@/shared/http/api-response";
import { HttpStatus, type THttpStatus } from "@/shared/http/http-status";

/**
 * Sends a success response to the client.
 *
 * @param res - The response object.
 * @param data - The data to send in the response.
 * @param message - The message to send in the response.
 * @param statusCode - The status code to send in the response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Request processed successfully.",
  statusCode: THttpStatus = HttpStatus.OK,
): void => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
};

/**
 * Sends a success response with meta to the client.
 *
 * @param res - The response object.
 * @param data - The data to send in the response.
 * @param meta - The meta to send in the response.
 * @param message - The message to send in the response.
 * @param statusCode - The status code to send in the response.
 */
export const sendSuccessWithMeta = <T, M>(
  res: Response,
  data: T,
  meta: M,
  message: string = "Request processed successfully.",
  statusCode: THttpStatus = HttpStatus.OK,
): void => {
  const response: ApiSuccessResponseWithMeta<T, M> = {
    success: true,
    message,
    data,
    meta,
  };

  res.status(statusCode).json(response);
};
