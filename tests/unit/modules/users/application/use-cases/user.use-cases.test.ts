import { describe, expect, it, vi } from "vitest";

import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { UserRepository } from "@/modules/users/application/repositories/user.repository";
import type { PasswordHasher } from "@/modules/users/application/services/password-hasher";
import { DeleteUserUseCase } from "@/modules/users/application/use-cases/delete-user.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update-user.use-case";
import { UserFactory } from "@/modules/users/domain/factories/user.factory";

const createUser = (overrides: Partial<{ name: string; email: string }> = {}) =>
  UserFactory.create({
    name: overrides.name ?? "John Doe",
    email: overrides.email ?? "john@example.com",
    passwordHash: "hashed-password",
  });

describe("GetUserByIdUseCase", () => {
  it("returns the user when it exists", async () => {
    const user = createUser();
    const userRepository = {
      findById: vi.fn().mockResolvedValue(user),
    } as unknown as UserRepository;

    const useCase = new GetUserByIdUseCase(userRepository);

    await expect(useCase.execute(user.getId())).resolves.toBe(user);
  });

  it("throws when the user does not exist", async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as UserRepository;

    const useCase = new GetUserByIdUseCase(userRepository);

    await expect(useCase.execute("missing-id")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

describe("ListUsersUseCase", () => {
  it("returns paginated users", async () => {
    const users = [createUser(), createUser({ name: "Jane Doe", email: "jane@example.com" })];
    const userRepository = {
      findMany: vi.fn().mockResolvedValue({
        items: users,
        totalRecords: 2,
      }),
    } as unknown as UserRepository;

    const useCase = new ListUsersUseCase(userRepository);
    const criteria = {
      page: 1,
      limit: 10,
      sortBy: "createdAt" as const,
      sortOrder: "desc" as const,
    };

    await expect(useCase.execute(criteria)).resolves.toEqual({
      items: users,
      totalRecords: 2,
    });
    expect(userRepository.findMany).toHaveBeenCalledWith(criteria);
  });
});

describe("UpdateUserUseCase", () => {
  it("updates the user when the email is unchanged", async () => {
    const existingUser = createUser();
    const updatedUser = createUser();

    const userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      update: vi.fn().mockResolvedValue(updatedUser),
    } as unknown as UserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as PasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(useCase.execute(existingUser.getId(), { name: "Updated Name" })).resolves.toBe(updatedUser);
    expect(userRepository.update).toHaveBeenCalledWith(existingUser.getId(), {
      name: "Updated Name",
    });
  });

  it("throws when the new email is already taken", async () => {
    const existingUser = createUser();
    const otherUser = createUser({ name: "Jane Doe", email: "jane@example.com" });

    const userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn().mockResolvedValue(otherUser),
    } as unknown as UserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as PasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(useCase.execute(existingUser.getId(), { email: "jane@example.com" })).rejects.toBeInstanceOf(
      UserEmailAlreadyExistsError,
    );
  });
});

describe("DeleteUserUseCase", () => {
  it("deletes the user when it exists", async () => {
    const userRepository = {
      delete: vi.fn().mockResolvedValue(true),
    } as unknown as UserRepository;

    const useCase = new DeleteUserUseCase(userRepository);

    await expect(useCase.execute("user-id")).resolves.toBeUndefined();
  });

  it("throws when the user does not exist", async () => {
    const userRepository = {
      delete: vi.fn().mockResolvedValue(false),
    } as unknown as UserRepository;

    const useCase = new DeleteUserUseCase(userRepository);

    await expect(useCase.execute("missing-id")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
