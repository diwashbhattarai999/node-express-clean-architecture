import { describe, expect, it, vi } from "vitest";

import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import type { IPasswordHasher } from "@/modules/users/application/ports/password-hasher";
import { DeleteUserUseCase } from "@/modules/users/application/use-cases/delete-user.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update-user.use-case";
import { UserFactory } from "@/modules/users/domain/factories/user.factory";
import type { ListUsersDto } from "@/modules/users/application/dto/list-users.dto";

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
    } as unknown as IUserRepository;

    const useCase = new GetUserByIdUseCase(userRepository);

    await expect(useCase.execute(user.getId())).resolves.toBe(user);
  });

  it("throws when the user does not exist", async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as IUserRepository;

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
        total: 2,
      }),
    } as unknown as IUserRepository;

    const useCase = new ListUsersUseCase(userRepository);
    const criteria: ListUsersDto = {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    await expect(useCase.execute(criteria)).resolves.toEqual({
      items: users,
      total: 2,
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
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

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
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

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
    } as unknown as IUserRepository;

    const useCase = new DeleteUserUseCase(userRepository);

    await expect(useCase.execute("user-id")).resolves.toBeUndefined();
  });

  it("throws when the user does not exist", async () => {
    const userRepository = {
      delete: vi.fn().mockResolvedValue(false),
    } as unknown as IUserRepository;

    const useCase = new DeleteUserUseCase(userRepository);

    await expect(useCase.execute("missing-id")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
