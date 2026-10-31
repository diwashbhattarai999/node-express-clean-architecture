import { beforeEach, describe, expect, it, vi } from "vitest";

import { IdentityAlreadyExistsError } from "@/modules/auth/identity/application/errors/identity-already-exists.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { AddEmailUseCase } from "@/modules/auth/identity/application/use-cases/add-email.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import type { IEmailSender } from "@/shared/email/email-sender.port";

describe("AddEmailUseCase", () => {
  const identityRepository: IIdentityRepository = {
    findIdentityByNormalized: vi.fn(),
    register: vi.fn(),
    findAuthenticatedPrincipal: vi.fn(),
    findOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    listIdentitiesForUser: vi.fn(),
    addEmailIdentity: vi.fn(),
    verifyAddedEmailByTokenHash: vi.fn(),
    removeEmailIdentity: vi.fn(),
    upsertUsername: vi.fn(),
  };

  const emailSender: IEmailSender = {
    send: vi.fn(),
  };

  const useCase = new AddEmailUseCase(identityRepository, emailSender, {
    frontendBaseUrl: "http://localhost:5173",
    brandName: "Node Express Clean Architecture",
  });

  const identity = {
    id: "identity-1",
    type: "email" as const,
    identifier: "ada@example.com",
    verifiedAt: null,
    isPrimary: false,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["member"],
      user: {
        id: "user-1",
        status: "active",
        displayName: "Ada",
        avatarUrl: null,
        email: "primary@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue(null);
    vi.mocked(identityRepository.addEmailIdentity).mockResolvedValue(identity);
    vi.mocked(emailSender.send).mockResolvedValue({ id: "msg-1" });
  });

  it("adds an unverified email and sends a verification message", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        email: "Ada@Example.com",
      }),
    ).resolves.toEqual(identity);

    expect(identityRepository.findIdentityByNormalized).toHaveBeenCalledWith(
      "email",
      "ada@example.com",
    );
    expect(identityRepository.addEmailIdentity).toHaveBeenCalledWith({
      userId: "user-1",
      identifier: "ada@example.com",
      normalizedIdentifier: "ada@example.com",
      tokenHash: expect.any(String),
      expiresAt: expect.any(Date),
    });
    expect(emailSender.send).toHaveBeenCalledOnce();
  });

  it("throws when the email is already taken", async () => {
    vi.mocked(identityRepository.findIdentityByNormalized).mockResolvedValue({
      userId: "other-user",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        email: "taken@example.com",
      }),
    ).rejects.toBeInstanceOf(IdentityAlreadyExistsError);
    expect(identityRepository.addEmailIdentity).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        email: "ada@example.com",
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(identityRepository.addEmailIdentity).not.toHaveBeenCalled();
  });
});
