import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { ListOwnRolesUseCase } from "@/modules/auth/authorization/application/use-cases/list-own-roles.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("ListOwnRolesUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const roleRepository: IRoleRepository = {
    listForUser: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
    listUsersForRole: vi.fn(),
  };

  const useCase = new ListOwnRolesUseCase(identityRepository, roleRepository);

  const roles = [
    {
      id: "role-1",
      key: "member",
      name: "Member",
      description: "Default member role",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
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
    vi.mocked(roleRepository.listForUser).mockResolvedValue(roles);
  });

  it("lists assigned roles after verifying the session", async () => {
    await expect(useCase.execute({ userId: "user-1", sessionId: "session-1" })).resolves.toEqual({
      roles,
    });

    expect(identityRepository.findAuthenticatedPrincipal).toHaveBeenCalledWith(
      "user-1",
      "session-1",
    );
    expect(roleRepository.listForUser).toHaveBeenCalledWith("user-1");
  });

  it("returns an empty list when no roles are assigned", async () => {
    vi.mocked(roleRepository.listForUser).mockResolvedValue([]);

    await expect(useCase.execute({ userId: "user-1", sessionId: "session-1" })).resolves.toEqual({
      roles: [],
    });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(useCase.execute({ userId: "user-1", sessionId: "bad" })).rejects.toBeInstanceOf(
      TokenInvalidError,
    );
    expect(roleRepository.listForUser).not.toHaveBeenCalled();
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
