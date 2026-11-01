import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleAlreadyExistsError } from "@/modules/auth/authorization/application/errors/role-already-exists.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { CreateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/create-role.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";

describe("CreateRoleUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const permissionRepository: IPermissionRepository = {
    listKeysForUser: vi.fn(),
    hasKeyForUser: vi.fn(),
    listForRole: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    replaceForRole: vi.fn(),
    removeFromRole: vi.fn(),
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
    assignToUser: vi.fn(),
    removeFromUser: vi.fn(),
    replaceForUser: vi.fn(),
  };

  const useCase = new CreateRoleUseCase(identityRepository, permissionRepository, roleRepository);

  const created = {
    id: "role-1",
    key: "editor",
    name: "Editor",
    description: "Can edit content",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "ok",
      roles: ["admin"],
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
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(true);
    vi.mocked(roleRepository.findByKey).mockResolvedValue(null);
    vi.mocked(roleRepository.create).mockResolvedValue(created);
  });

  it("creates a role after verifying the session and roles.create", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        key: "Editor",
        name: " Editor ",
        description: "Can edit content",
      }),
    ).resolves.toEqual(created);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.create");
    expect(roleRepository.findByKey).toHaveBeenCalledWith("editor");
    expect(roleRepository.create).toHaveBeenCalledWith({
      key: "editor",
      name: "Editor",
      description: "Can edit content",
    });
  });

  it("throws RoleAlreadyExistsError when the key is taken", async () => {
    vi.mocked(roleRepository.findByKey).mockResolvedValue(created);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        key: "editor",
        name: "Editor",
        description: null,
      }),
    ).rejects.toBeInstanceOf(RoleAlreadyExistsError);
    expect(roleRepository.create).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without roles.create", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        key: "editor",
        name: "Editor",
        description: null,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(roleRepository.findByKey).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        key: "editor",
        name: "Editor",
        description: null,
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(permissionRepository.hasKeyForUser).not.toHaveBeenCalled();
  });

  it("throws TokenExpiredError for expired sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "expired_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "expired",
        key: "editor",
        name: "Editor",
        description: null,
      }),
    ).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it("throws TokenRevokedError for revoked sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "revoked_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "revoked",
        key: "editor",
        name: "Editor",
        description: null,
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
