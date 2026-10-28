import type { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncMiddleware =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
