import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityAlreadyExistsError } from "@/modules/auth/application/errors/identity-already-exists.error";
import type { IAuthAccountRepository } from "@/modules/auth/application/ports/auth-account.repository";
import type { IPasswordHasher } from "@/modules/auth/application/ports/password-hasher.port";
import { RegisterUseCase } from "@/modules/auth/application/use-cases/register.use-case";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("RegisterUseCase", () => {
  const authAccountRepository: IAuthAccountRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    verifyEmailByTokenHash: vi.fn(),
    findUnverifiedEmailIdentity: vi.fn(),
    replaceEmailVerificationToken: vi.fn(),
    verifyPhoneByCodeHash: vi.fn(),
    findUnverifiedPhoneIdentity: vi.fn(),
    replacePhoneVerificationToken: vi.fn(),
    findPasswordLoginCandidate: vi.fn(),
    createSession: vi.fn(),
  };

  const passwordHasher: IPasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new RegisterUseCase(authAccountRepository, passwordHasher, emailSender, {
    frontendBaseUrl: "http://localhost:5173",
    brandName: "Your Brand",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(passwordHasher.hash).mockResolvedValue("hashed-password");
    vi.mocked(authAccountRepository.findIdentityByNormalized).mockResolvedValue(null);
    vi.mocked(authAccountRepository.register).mockResolvedValue({
      id: "user-1",
      status: "pending_verification",
      displayName: "Ada",
      avatarUrl: null,
      email: "ada@example.com",
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(emailSender.send).mockResolvedValue({ id: "email-1" });
  });

  it("registers with email, hashes password, and sends verification email", async () => {
    const result = await useCase.execute({
      email: "Ada@Example.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
      displayName: "Ada",
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("StrongPassword123!");
    expect(authAccountRepository.register).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Ada",
        passwordHash: "hashed-password",
        email: {
          identifier: "ada@example.com",
          normalizedIdentifier: "ada@example.com",
        },
        verificationToken: expect.objectContaining({
          purpose: "email_verification",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(emailSender.send).toHaveBeenCalledOnce();
    expect(result.status).toBe("pending_verification");
    expect(result.email).toBe("ada@example.com");
  });

  it("throws when email identity already exists", async () => {
    vi.mocked(authAccountRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "existing",
    });

    await expect(
      useCase.execute({
        email: "ada@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      }),
    ).rejects.toBeInstanceOf(IdentityAlreadyExistsError);

    expect(authAccountRepository.register).not.toHaveBeenCalled();
  });

  it("registers with phone without sending email", async () => {
    vi.mocked(authAccountRepository.register).mockResolvedValue({
      id: "user-2",
      status: "pending_verification",
      displayName: null,
      avatarUrl: null,
      email: null,
      username: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await useCase.execute({
      phone: "+9779812345678",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });

    expect(authAccountRepository.register).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: {
          identifier: "+9779812345678",
          normalizedIdentifier: "+9779812345678",
        },
        verificationToken: expect.objectContaining({
          purpose: "phone_verification",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it("still succeeds when verification email fails to send", async () => {
    vi.mocked(emailSender.send).mockRejectedValue(new Error("smtp down"));

    const result = await useCase.execute({
      email: "ada@example.com",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    });

    expect(result.id).toBe("user-1");
  });
});
