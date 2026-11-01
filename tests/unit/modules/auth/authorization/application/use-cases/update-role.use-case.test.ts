import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import { RoleNotFoundError } from "@/modules/auth/authorization/application/errors/role-not-found.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IRoleRepository } from "@/modules/auth/authorization/application/ports/role.repository";
import { UpdateRoleUseCase } from "@/modules/auth/authorization/application/use-cases/update-role.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenExpiredError } from "@/modules/auth/shared/application/errors/token-expired.error";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";
import { TokenRevokedError } from "@/modules/auth/shared/application/errors/token-revoked.error";
import { ValidationError } from "@/shared/errors/validation-error";

describe("UpdateRoleUseCase", () => {
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
  };

  const useCase = new UpdateRoleUseCase(identityRepository, permissionRepository, roleRepository);

  const role = {
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
    vi.mocked(roleRepository.update).mockResolvedValue(role);
  });

  it("updates name and description after verifying the session and roles.update", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        name: " Lead editor ",
        description: " Reviews content ",
      }),
    ).resolves.toEqual(role);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "roles.update");
    expect(roleRepository.update).toHaveBeenCalledWith("role-1", {
      name: "Lead editor",
      description: "Reviews content",
    });
  });

  it("clears description when set to null", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      roleId: "role-1",
      description: null,
    });

    expect(roleRepository.update).toHaveBeenCalledWith("role-1", { description: null });
  });

  it("throws ValidationError when neither name nor description is provided", async () => {
    await expect(
      useCase.execute({ userId: "user-1", sessionId: "session-1", roleId: "role-1" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(roleRepository.update).not.toHaveBeenCalled();
  });

  it("throws RoleNotFoundError when the role does not exist", async () => {
    vi.mocked(roleRepository.update).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "missing",
        name: "Editor",
      }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it("throws PermissionDeniedError without roles.update", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        roleId: "role-1",
        name: "Editor",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(roleRepository.update).not.toHaveBeenCalled();
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        roleId: "role-1",
        name: "Editor",
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
        roleId: "role-1",
        name: "Editor",
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
        roleId: "role-1",
        name: "Editor",
      }),
    ).rejects.toBeInstanceOf(TokenRevokedError);
  });
});
