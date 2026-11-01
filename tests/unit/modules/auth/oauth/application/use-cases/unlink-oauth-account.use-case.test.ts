import { beforeEach, describe, expect, it, vi } from "vitest";

import { LastAuthMethodError } from "@/modules/auth/identity/application/errors/last-auth-method.error";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { OAuthProviderName } from "@/modules/auth/oauth/application/constants/oauth-providers";
import { OAuthAccountNotFoundError } from "@/modules/auth/oauth/application/errors/oauth-account-not-found.error";
import type { IOauthAccountRepository } from "@/modules/auth/oauth/application/ports/oauth-account.repository";
import { UnlinkOAuthAccountUseCase } from "@/modules/auth/oauth/application/use-cases/unlink-oauth-account.use-case";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("UnlinkOAuthAccountUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const accountRepository: IOauthAccountRepository = {
    findByProviderUser: vi.fn(),
    findEmailOwner: vi.fn(),
    listForUser: vi.fn(),
    createAccount: vi.fn(),
    recordSuccessfulLogin: vi.fn(),
    linkToUser: vi.fn(),
    unlinkFromUser: vi.fn(),
  };

  const useCase = new UnlinkOAuthAccountUseCase(identityRepository, accountRepository);

  const input = {
    userId: "user-1",
    sessionId: "session-1",
    provider: OAuthProviderName.GOOGLE,
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
        email: "ada@example.com",
        username: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });
    vi.mocked(accountRepository.unlinkFromUser).mockResolvedValue({ outcome: "removed" });
  });

  it("unlinks the provider after verifying the session", async () => {
    await expect(useCase.execute(input)).resolves.toBeUndefined();

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(accountRepository.unlinkFromUser).toHaveBeenCalledWith("user-1", "google");
  });

  it("throws LastAuthMethodError when the provider is the last sign-in method", async () => {
    vi.mocked(accountRepository.unlinkFromUser).mockResolvedValue({
      outcome: "last_auth_method",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(LastAuthMethodError);
  });

  it("throws OAuthAccountNotFoundError when the provider is not linked", async () => {
    vi.mocked(accountRepository.unlinkFromUser).mockResolvedValue({ outcome: "not_found" });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(OAuthAccountNotFoundError);
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(TokenInvalidError);
    expect(accountRepository.unlinkFromUser).not.toHaveBeenCalled();
  });
});
