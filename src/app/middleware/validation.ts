import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType, z } from "zod";

import { ValidationError } from "@/shared/errors/validation-error";
import { toFieldErrors } from "@/shared/http/field-error";

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
 * Express 5 defines `req.query` as a getter-only property, so assignment fails.
 * Redefine the property with the validated value when needed.
 */
const setRequestProperty = <TKey extends "body" | "params" | "query">(
  req: Request,
  key: TKey,
  value: Request[TKey],
): void => {
  if (key === "query") {
    Object.defineProperty(req, "query", {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    return;
  }

  req[key] = value;
};

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
    const payload = {
      body: req.body as unknown,
      params: req.params as unknown,
      query: req.query as unknown,
    };

    const result = schema.safeParse(payload);

    if (!result.success) {
      next(new ValidationError(toFieldErrors(result.error.issues, payload)));

      return;
    }

    const data = result.data;

    if ("body" in data) {
      setRequestProperty(req, "body", data.body as Request["body"]);
    }

    if ("params" in data && data.params !== undefined) {
      setRequestProperty(req, "params", data.params as Request["params"]);
    }

    if ("query" in data && data.query !== undefined) {
      setRequestProperty(req, "query", data.query as Request["query"]);
    }

    next();
  };
