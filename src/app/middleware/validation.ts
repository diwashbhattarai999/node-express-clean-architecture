import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType, z } from "zod";

import { ValidationError } from "@/shared/errors/validation-error";

type RequestValidationShape = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

type InferPart<T, K extends keyof RequestValidationShape, Fallback> = T extends {
  [P in K]: infer V;
}
  ? V
  : Fallback;

/**
 * Express request typed from a request validation schema.
 *
 * Schema shape:
 * `z.object({ body?: ..., params?: ..., query?: ... })`
 */
export type ValidatedRequest<TSchema extends ZodType<RequestValidationShape>> = Omit<
  Request,
  "body" | "params" | "query"
> & {
  params: InferPart<z.infer<TSchema>, "params", Request["params"]>;
  body: InferPart<z.infer<TSchema>, "body", Request["body"]>;
  query: InferPart<z.infer<TSchema>, "query", Request["query"]>;
};

export type ValidatedRequestHandler<TSchema extends ZodType<RequestValidationShape>> = (
  req: ValidatedRequest<TSchema>,
  res: Response,
) => Promise<void> | void;

/**
 * Adapts a validated controller handler to an Express `RequestHandler`.
 * Use after `validate(schema)` so `req` is typed from that schema.
 */
export const asHandler =
  <TSchema extends ZodType<RequestValidationShape>>(
    handler: ValidatedRequestHandler<TSchema>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as ValidatedRequest<TSchema>, res)).catch(next);
  };

/**
 * Validates `body`, `params`, and/or `query` from a single Zod request schema
 * and replaces those request properties with the parsed values.
 */
export const validate =
  <TSchema extends ZodType<RequestValidationShape>>(schema: TSchema): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(
        new ValidationError(
          result.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
        ),
      );

      return;
    }

    const data = result.data;

    if ("body" in data) {
      req.body = data.body;
    }

    if ("params" in data && data.params !== undefined) {
      req.params = data.params as Request["params"];
    }

    if ("query" in data && data.query !== undefined) {
      req.query = data.query as Request["query"];
    }

    next();
  };
