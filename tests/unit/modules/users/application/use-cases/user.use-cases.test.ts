import { describe, expect, it, vi } from "vitest";

import type { ListUsersDto } from "@/modules/users/application/dto/list-users.dto";
import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import { UserNotFoundError } from "@/modules/users/application/errors/user-not-found.error";
import type { IPasswordHasher } from "@/modules/users/application/ports/password-hasher";
import { DeleteUserUseCase } from "@/modules/users/application/use-cases/delete-user.use-case";
import { GetUserByIdUseCase } from "@/modules/users/application/use-cases/get-user-by-id.use-case";
import { ListUsersUseCase } from "@/modules/users/application/use-cases/list-users.use-case";
import { UpdateUserUseCase } from "@/modules/users/application/use-cases/update-user.use-case";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { createTestUser } from "@tests/helpers/users";

describe("GetUserByIdUseCase", () => {
  it("returns the user when it exists", async () => {
    const user = createTestUser();
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
    const users = [createTestUser(), createTestUser({ name: "Jane Doe", email: "jane@example.com" })];
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
    const existingUser = createTestUser();
    const updatedUser = createTestUser({ name: "Updated Name" });

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

    await expect(useCase.execute(existingUser.getId(), { name: "Updated Name" })).resolves.toBe(
      updatedUser,
    );
    expect(userRepository.update).toHaveBeenCalledWith(existingUser.getId(), {
      name: "Updated Name",
    });
  });

  it("allows keeping the same email", async () => {
    const existingUser = createTestUser();
    const updatedUser = createTestUser({ name: "Updated Name" });

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

    await expect(
      useCase.execute(existingUser.getId(), {
        name: "Updated Name",
        email: "john@example.com",
      }),
    ).resolves.toBe(updatedUser);

    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(userRepository.update).toHaveBeenCalledWith(existingUser.getId(), {
      name: "Updated Name",
      email: "john@example.com",
    });
  });

  it("hashes a new password when provided", async () => {
    const existingUser = createTestUser();
    const updatedUser = createTestUser();

    const userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      update: vi.fn().mockResolvedValue(updatedUser),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn().mockResolvedValue("new-hashed-password"),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(
      useCase.execute(existingUser.getId(), { password: "NewPassword123!" }),
    ).resolves.toBe(updatedUser);

    expect(passwordHasher.hash).toHaveBeenCalledWith("NewPassword123!");
    expect(userRepository.update).toHaveBeenCalledWith(existingUser.getId(), {
      passwordHash: "new-hashed-password",
    });
  });

  it("throws when the user does not exist", async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      update: vi.fn(),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(useCase.execute("missing-id", { name: "Updated" })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("throws when the new email is already taken", async () => {
    const existingUser = createTestUser();
    const otherUser = createTestUser({ name: "Jane Doe", email: "jane@example.com" });

    const userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn().mockResolvedValue(otherUser),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(
      useCase.execute(existingUser.getId(), { email: "jane@example.com" }),
    ).rejects.toBeInstanceOf(UserEmailAlreadyExistsError);
  });

  it("throws when update returns null", async () => {
    const existingUser = createTestUser();

    const userRepository = {
      findById: vi.fn().mockResolvedValue(existingUser),
      findByEmail: vi.fn(),
      update: vi.fn().mockResolvedValue(null),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new UpdateUserUseCase(userRepository, passwordHasher);

    await expect(useCase.execute(existingUser.getId(), { name: "Updated" })).rejects.toBeInstanceOf(
      UserNotFoundError,
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
