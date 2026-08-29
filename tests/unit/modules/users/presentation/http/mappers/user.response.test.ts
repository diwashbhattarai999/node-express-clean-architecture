import { describe, expect, it } from "vitest";

import {
  toUserResponse,
  toUserResponseList,
} from "@/modules/users/presentation/http/mappers/user.response";
import { createTestUser } from "@tests/helpers/users";

describe("toUserResponse", () => {
  it("maps a user without exposing the password hash", () => {
    const user = createTestUser({
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "secret-hash",
    });

    const response = toUserResponse(user);

    expect(response).toEqual({
      id: user.getId(),
      name: "John Doe",
      email: "john@example.com",
      createdAt: user.getCreatedAt().toISOString(),
      updatedAt: user.getUpdatedAt().toISOString(),
    });
    expect(response).not.toHaveProperty("passwordHash");
  });

  it("maps a list of users", () => {
    const users = [
      createTestUser({ email: "john@example.com" }),
      createTestUser({ name: "Jane Doe", email: "jane@example.com" }),
    ];

    expect(toUserResponseList(users)).toHaveLength(2);
    expect(toUserResponseList(users)[0]?.email).toBe("john@example.com");
  });
});
