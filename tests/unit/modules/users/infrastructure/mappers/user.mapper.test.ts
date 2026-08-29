import { describe, expect, it } from "vitest";

import {
  toDomainUser,
  toPersistenceUser,
  toPersistenceUserUpdate,
} from "@/modules/users/infrastructure/mappers/user.mapper";
import { createTestUser } from "@tests/helpers/users";

describe("user.mapper", () => {
  it("maps a persistence record to a domain user", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");

    const user = toDomainUser({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed-password",
      createdAt,
      updatedAt,
    });

    expect(user.getId()).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(user.getName()).toBe("John Doe");
    expect(user.getEmail().getValue()).toBe("john@example.com");
    expect(user.getPasswordHash()).toBe("hashed-password");
    expect(user.getCreatedAt()).toEqual(createdAt);
    expect(user.getUpdatedAt()).toEqual(updatedAt);
  });

  it("maps a domain user to persistence values", () => {
    const user = createTestUser({
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed-password",
    });

    expect(toPersistenceUser(user)).toEqual({
      id: user.getId(),
      name: "John Doe",
      email: "john@example.com",
      passwordHash: "hashed-password",
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    });
  });

  it("maps partial update data", () => {
    expect(
      toPersistenceUserUpdate({
        name: "Updated",
        email: "updated@example.com",
      }),
    ).toEqual({
      name: "Updated",
      email: "updated@example.com",
    });

    expect(toPersistenceUserUpdate({})).toEqual({});
  });
});
