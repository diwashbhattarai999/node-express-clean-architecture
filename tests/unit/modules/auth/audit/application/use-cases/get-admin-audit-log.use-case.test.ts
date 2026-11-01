import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuditLogNotFoundError } from "@/modules/auth/audit/application/errors/audit-log-not-found.error";
import type { IAuditLogRepository } from "@/modules/auth/audit/application/ports/audit-log.repository";
import { GetAdminAuditLogUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-log.use-case";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";

describe("GetAdminAuditLogUseCase", () => {
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

  const useCase = new GetAdminAuditLogUseCase(
    identityRepository,
    permissionRepository,
    auditLogRepository,
  );

  const event = {
    id: "event-1",
    eventType: "login_failure" as const,
    outcome: "failure" as const,
    ipAddress: null,
    userAgent: null,
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
    vi.mocked(auditLogRepository.findById).mockResolvedValue(event);
  });

  it("returns the event after verifying audit_logs.read", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        eventId: "event-1",
      }),
    ).resolves.toEqual(event);

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "audit_logs.read");
    expect(auditLogRepository.findById).toHaveBeenCalledWith("event-1");
  });

  it("throws AuditLogNotFoundError when the event is missing", async () => {
    vi.mocked(auditLogRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        eventId: "missing",
      }),
    ).rejects.toBeInstanceOf(AuditLogNotFoundError);
  });
});
