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
 * Express request typed from a Zod request schema.
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
 * Generic HTTP controller contract.
 *
 * The controller owns the handle method.
 * The adapter invokes it without requiring bind().
 */
export interface HttpController<TSchema extends ZodType<RequestValidationShape>> {
  handle: ValidatedRequestHandler<TSchema>;
}

/**
 * Adapts a typed controller to an Express RequestHandler.
 *
 * This is the framework boundary:
 *
 * Express Request
 *      ↓
 * ValidatedRequest<TSchema>
 *      ↓
 * Controller
 */
export const asHandler =
  <TSchema extends ZodType<RequestValidationShape>>(
    controller: HttpController<TSchema>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(controller.handle(req as ValidatedRequest<TSchema>, res)).catch(next);
  };

/**
 * Replaces a request property with its validated value.
 *
 * Express 5 exposes req.query through a getter, so it needs
 * to be redefined rather than assigned directly.
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
 * Validates body, params and query using one Zod schema.
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
