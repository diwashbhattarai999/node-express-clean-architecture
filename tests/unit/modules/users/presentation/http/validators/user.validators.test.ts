import { describe, expect, it } from "vitest";

import { createUserSchema } from "@/modules/users/presentation/http/validators/create-user.validator";
import { deleteUserSchema } from "@/modules/users/presentation/http/validators/delete-user.validator";
import { getUserByIdSchema } from "@/modules/users/presentation/http/validators/get-user-by-id.validator";
import { listUsersSchema } from "@/modules/users/presentation/http/validators/list-users.validator";
import { updateUserSchema } from "@/modules/users/presentation/http/validators/update-user.validator";

describe("createUserSchema", () => {
  it("accepts a valid create user payload", () => {
    const result = createUserSchema.safeParse({
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = createUserSchema.safeParse({
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "DifferentPassword123!",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a short name", () => {
    const result = createUserSchema.safeParse({
      body: {
        name: "J",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("listUsersSchema", () => {
  it("applies pagination and sort defaults", () => {
    const result = listUsersSchema.safeParse({
      query: {},
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.query).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  });

  it("rejects an invalid created date range", () => {
    const result = listUsersSchema.safeParse({
      query: {
        createdFrom: "2026-02-01",
        createdTo: "2026-01-01",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("getUserByIdSchema", () => {
  it("accepts a valid uuid", () => {
    const result = getUserByIdSchema.safeParse({
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid uuid", () => {
    const result = getUserByIdSchema.safeParse({
      params: {
        id: "not-a-uuid",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("accepts a partial update payload", () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      body: {
        name: "Updated Name",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update body", () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      body: {},
    });

    expect(result.success).toBe(false);
  });
});

describe("deleteUserSchema", () => {
  it("accepts a valid uuid", () => {
    const result = deleteUserSchema.safeParse({
      params: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    expect(result.success).toBe(true);
  });
});
