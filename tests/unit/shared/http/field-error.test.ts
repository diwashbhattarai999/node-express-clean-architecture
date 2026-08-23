import { describe, expect, it } from "vitest";
import { z } from "zod";

import { toFieldErrors } from "@/shared/http/field-error";

describe("toFieldErrors", () => {
  it("maps missing body fields into frontend-friendly field errors", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
        email: z.email("Email must be valid."),
      }),
    });

    const payload = { body: {}, params: {}, query: {} };
    const result = schema.safeParse(payload);

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(toFieldErrors(result.error.issues, payload)).toEqual([
      {
        type: "field",
        value: undefined,
        message: "Name is required",
        path: "name",
        location: "body",
      },
      {
        type: "field",
        value: undefined,
        message: "Email is required",
        path: "email",
        location: "body",
      },
    ]);
  });

  it("maps nested fields to a dotted path and includes the invalid value", () => {
    const schema = z.object({
      body: z.object({
        address: z.object({
          city: z.string(),
        }),
      }),
    });

    const payload = {
      body: {
        address: {
          city: 123,
        },
      },
      params: {},
      query: {},
    };
    const result = schema.safeParse(payload);

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(toFieldErrors(result.error.issues, payload)).toEqual([
      {
        type: "field",
        value: 123,
        message: expect.any(String),
        path: "address.city",
        location: "body",
      },
    ]);
  });

  it("maps unrecognized keys to field errors", () => {
    const schema = z.object({
      body: z
        .object({
          name: z.string(),
        })
        .strict(),
    });

    const payload = {
      body: {
        name: "John",
        extra: true,
      },
      params: {},
      query: {},
    };
    const result = schema.safeParse(payload);

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(toFieldErrors(result.error.issues, payload)).toEqual([
      {
        type: "field",
        value: true,
        message: expect.stringContaining("extra"),
        path: "extra",
        location: "body",
      },
    ]);
  });

  it("maps form-level refine errors with an empty path", () => {
    const schema = z.object({
      body: z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords do not match.",
        }),
    });

    const payload = {
      body: {
        password: "password123",
        confirmPassword: "different",
      },
      params: {},
      query: {},
    };
    const result = schema.safeParse(payload);

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(toFieldErrors(result.error.issues, payload)).toEqual([
      {
        type: "field",
        value: payload.body,
        message: "Passwords do not match.",
        path: "",
        location: "body",
      },
    ]);
  });
});
