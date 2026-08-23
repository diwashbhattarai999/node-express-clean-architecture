import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

import { ValidationError, type ValidationErrorDetail } from "@/shared/errors/validation-error";

type ValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

const toValidationDetails = (
  issues: Array<{
    path: PropertyKey[];
    message: string;
    code: string;
  }>,
  target: keyof ValidationSchemas,
): ValidationErrorDetail[] => {
  return issues.map((issue) => ({
    path: [target, ...issue.path],
    message: issue.message,
    code: issue.code,
  }));
};

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const details: ValidationErrorDetail[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);

      if (result.success) {
        req.body = result.data;
      } else {
        details.push(...toValidationDetails(result.error.issues, "body"));
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);

      if (result.success) {
        Object.assign(req.params, result.data);
      } else {
        details.push(...toValidationDetails(result.error.issues, "params"));
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);

      if (result.success) {
        Object.assign(req.query, result.data);
      } else {
        details.push(...toValidationDetails(result.error.issues, "query"));
      }
    }

    if (details.length > 0) {
      next(new ValidationError(details));
      return;
    }

    next();
  };
};
