import type { RequestHandler } from "express";

import { NotFoundError } from "@/shared/errors/not-found-error";

export const notFoundMiddleware: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`);
};
