import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportAdminAuditLogsUseCase } from "@/modules/auth/audit/application/use-cases/export-admin-audit-logs.use-case";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { JobName } from "@/shared/jobs/job-names";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

describe("ExportAdminAuditLogsUseCase", () => {
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

  const jobQueue: IJobQueue = {
    enqueue: vi.fn(),
    upsertRepeatable: vi.fn(),
    remove: vi.fn(),
    close: vi.fn(),
  };

  const useCase = new ExportAdminAuditLogsUseCase(
    identityRepository,
    permissionRepository,
    jobQueue,
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
    vi.mocked(jobQueue.enqueue).mockResolvedValue(undefined);
  });

  it("enqueues an export job after verifying audit_logs.export", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      from: new Date("2026-01-01T00:00:00.000Z"),
      to: new Date("2026-01-31T00:00:00.000Z"),
      format: "csv",
      targetUserId: "user-2",
    });

    expect(result.status).toBe("pending");
    expect(result.exportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "audit_logs.export");
    expect(jobQueue.enqueue).toHaveBeenCalledWith(
      JobName.EXPORT_AUDIT_LOGS,
      expect.objectContaining({
        exportId: result.exportId,
        requestedBy: "user-1",
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-31T00:00:00.000Z",
        format: "csv",
        userId: "user-2",
      }),
    );
  });

  it("throws PermissionDeniedError without audit_logs.export", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        from: new Date("2026-01-01T00:00:00.000Z"),
        to: new Date("2026-01-31T00:00:00.000Z"),
        format: "json",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(jobQueue.enqueue).not.toHaveBeenCalled();
  });
});
