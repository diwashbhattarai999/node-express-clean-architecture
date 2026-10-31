import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import { ListOwnOAuthAccountsUseCase } from "@/modules/auth/oauth/application/use-cases/list-own-oauth-accounts.use-case";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListOwnOAuthAccountsUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const accountRepository: IOauthAccountRepository = {
    findByProviderUser: vi.fn(),
    findEmailOwner: vi.fn(),
    listForUser: vi.fn(),
    createAccount: vi.fn(),
    recordSuccessfulLogin: vi.fn(),
  };

  const useCase = new ListOwnOAuthAccountsUseCase(identityRepository, accountRepository);

  const accounts = [
    {
      id: "ext-1",
      provider: "google",
      providerEmail: "ada@example.com",
      linkedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
  ];

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
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    vi.mocked(accountRepository.listForUser).mockResolvedValue(accounts);
  });

  it("lists linked OAuth accounts after verifying the session", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).resolves.toEqual({ accounts });

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(accountRepository.listForUser).toHaveBeenCalledWith("user-1");
  });

  it("returns an empty list when none are linked", async () => {
    vi.mocked(accountRepository.listForUser).mockResolvedValue([]);

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1" }),
    ).resolves.toEqual({ accounts: [] });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "bad" }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(accountRepository.listForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "expired" }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({ userId: "user-1", sessionId: "revoked" }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
