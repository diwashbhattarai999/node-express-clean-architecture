import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

export const REQUEST_ID_HEADER = "X-Request-ID";
const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Checks if the request ID is valid.
 *
 * @param value - The request ID to check.
 * @returns True if the request ID is valid, false otherwise.
 */
const isValidRequestId = (value: string): boolean => {
  return value.length > 0 && value.length <= MAX_REQUEST_ID_LENGTH;
};

/**
 * Middleware to set the request ID.
 *
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.get(REQUEST_ID_HEADER);

  const requestId =
    incomingRequestId && isValidRequestId(incomingRequestId) ? incomingRequestId : randomUUID();

  res.setHeader(REQUEST_ID_HEADER, requestId);

  req.requestId = requestId;

  next();
};
