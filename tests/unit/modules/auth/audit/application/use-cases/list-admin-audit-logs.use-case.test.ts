import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogRepository } from "@/modules/auth/audit/application/ports/audit-log.repository";
import { ListAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/list-admin-audit-logs.use-case";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

describe("ListAdminAuditLogsUseCase", () => {
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

  const auditLogRepository: IAuditLogRepository = {
    list: vi.fn(),
    findById: vi.fn(),
    listForExport: vi.fn(),
  };

  const useCase = new ListAdminAuditLogsUseCase(
    identityRepository,
    permissionRepository,
    auditLogRepository,
  );

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
    vi.mocked(auditLogRepository.list).mockResolvedValue({ items: [], total: 0 });
  });

  it("lists audit logs after verifying audit_logs.read", async () => {
    await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      page: 1,
      limit: 10,
      targetUserId: "user-2",
      outcome: "failure",
    });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "audit_logs.read");
    expect(auditLogRepository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      userId: "user-2",
      outcome: "failure",
    });
  });

  it("throws PermissionDeniedError without audit_logs.read", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        page: 1,
        limit: 10,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(auditLogRepository.list).not.toHaveBeenCalled();
  });
});
