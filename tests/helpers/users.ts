import { UserFactory } from "@/modules/users/domain/factories/user.factory";

export const createTestUser = (
  overrides: Partial<{
    name: string;
    email: string;
    passwordHash: string;
  }> = {},
) =>
  UserFactory.create({
    name: overrides.name ?? "John Doe",
    email: overrides.email ?? "john@example.com",
    passwordHash: overrides.passwordHash ?? "hashed-password",
  });
