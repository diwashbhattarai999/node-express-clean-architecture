import { describe, expect, it, vi } from "vitest";

import { UserEmailAlreadyExistsError } from "@/modules/users/application/errors/user-email-already-exists.error";
import type { IPasswordHasher } from "@/modules/users/application/ports/password-hasher";
import { CreateUserUseCase } from "@/modules/users/application/use-cases/create-user.use-case";
import { InvalidEmailError } from "@/modules/users/domain/errors/invalid-email.error";
import type { IUserRepository } from "@/modules/users/domain/repositories/user.repository";
import { createTestUser } from "@tests/helpers/users";

describe("CreateUserUseCase", () => {
  it("creates a user when the email is available", async () => {
    const createdUser = createTestUser();
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdUser),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn().mockResolvedValue("hashed-password"),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new CreateUserUseCase(userRepository, passwordHasher);

    await expect(
      useCase.execute({
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      }),
    ).resolves.toBe(createdUser);

    expect(passwordHasher.hash).toHaveBeenCalledWith("StrongPassword123!");
    expect(userRepository.create).toHaveBeenCalledOnce();
  });

  it("throws when the email already exists", async () => {
    const existingUser = createTestUser();
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn(),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new CreateUserUseCase(userRepository, passwordHasher);

    await expect(
      useCase.execute({
        name: "John Doe",
        email: "john@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      }),
    ).rejects.toBeInstanceOf(UserEmailAlreadyExistsError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("throws when the email is invalid", async () => {
    const userRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    } as unknown as IUserRepository;

    const passwordHasher = {
      hash: vi.fn(),
      compare: vi.fn(),
    } as unknown as IPasswordHasher;

    const useCase = new CreateUserUseCase(userRepository, passwordHasher);

    await expect(
      useCase.execute({
        name: "John Doe",
        email: "not-an-email",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      }),
    ).rejects.toBeInstanceOf(InvalidEmailError);
  });
});
