import { describe, expect, it } from "vitest";

import { ConflictError } from "@/shared/errors/conflict-error";
import { ErrorCode } from "@/shared/errors/error-code";
import { ForbiddenError } from "@/shared/errors/forbidden-error";
import { UnauthorizedError } from "@/shared/errors/unauthorized-error";
import { HttpStatus } from "@/shared/http/http-status";

describe("UnauthorizedError", () => {
  it("uses 401 and UNAUTHORIZED with the default message", () => {
    const error = new UnauthorizedError();

    expect(error).toMatchObject({
      name: "UnauthorizedError",
      code: ErrorCode.UNAUTHORIZED,
      statusCode: HttpStatus.UNAUTHORIZED,
      message: "Authentication required.",
    });
  });

  it("accepts a custom message", () => {
    const error = new UnauthorizedError("Invalid or expired token.");

    expect(error.message).toBe("Invalid or expired token.");
  });
});

describe("ForbiddenError", () => {
  it("uses 403 and FORBIDDEN with the default message", () => {
    const error = new ForbiddenError();

    expect(error).toMatchObject({
      name: "ForbiddenError",
      code: ErrorCode.FORBIDDEN,
      statusCode: HttpStatus.FORBIDDEN,
      message: "You do not have permission to perform this action.",
    });
  });

  it("accepts a custom message", () => {
    const error = new ForbiddenError("Admin role required.");

    expect(error.message).toBe("Admin role required.");
  });
});

describe("ConflictError", () => {
  it("uses 409 and CONFLICT with the default message", () => {
    const error = new ConflictError();

    expect(error).toMatchObject({
      name: "ConflictError",
      code: ErrorCode.CONFLICT,
      statusCode: HttpStatus.CONFLICT,
      message: "The request conflicts with the current state of the resource.",
    });
  });

  it("accepts a custom message", () => {
    const error = new ConflictError("Resource already exists.");

    expect(error.message).toBe("Resource already exists.");
  });
});
