import type { z } from "zod";

export type RequestLocation = "body" | "params" | "query";

export interface FieldError {
  type: "field";
  value: unknown;
  message: string;
  path: string;
  location: RequestLocation;
}

export interface RequestPayload {
  body: unknown;
  params: unknown;
  query: unknown;
}

const isLocation = (value: PropertyKey | undefined): value is RequestLocation =>
  value === "body" || value === "params" || value === "query";

const fieldPath = (path: PropertyKey[], location: RequestLocation): string => {
  const start = path[0] === location ? 1 : 0;

  return path.slice(start).map(String).join(".");
};

const readValue = (source: unknown, path: string): unknown => {
  if (!path) {
    return source;
  }

  let current = source;

  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
};

const getIssueInput = (issue: z.core.$ZodIssue): unknown => {
  if ("input" in issue) {
    return issue.input;
  }

  return undefined;
};

const issueMessage = (issue: z.core.$ZodIssue, path: string, value: unknown): string => {
  const input = getIssueInput(issue);
  const isMissing =
    issue.code === "invalid_type" &&
    (value === undefined || value === null || input === undefined || input === null);

  if (isMissing) {
    if (!path) {
      return issue.message;
    }

    const name = `${path.charAt(0).toUpperCase()}${path.slice(1)}`;

    return `${name} is required`;
  }

  return issue.message;
};

/**
 * Maps Zod issues into frontend-friendly field errors.
 */
export const toFieldErrors = (
  issues: readonly z.core.$ZodIssue[],
  payload: RequestPayload,
): FieldError[] => {
  const errors: FieldError[] = [];

  for (const issue of issues) {
    const location = isLocation(issue.path[0]) ? issue.path[0] : "body";
    const source = payload[location];

    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        const path = [fieldPath(issue.path, location), key].filter(Boolean).join(".");

        errors.push({
          type: "field",
          value: readValue(source, path),
          message: issue.message,
          path,
          location,
        });
      }

      continue;
    }

    const path = fieldPath(issue.path, location);
    const value = getIssueInput(issue) ?? readValue(source, path);

    errors.push({
      type: "field",
      value,
      message: issueMessage(issue, path, value),
      path,
      location,
    });
  }

  return errors;
};
