import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuditExportNotFoundError } from "@/modules/auth/audit/application/errors/audit-export-not-found.error";
import { GetAdminAuditExportUseCase } from "@/modules/auth/audit/application/use-cases/get-admin-audit-export.use-case";
import { PermissionDeniedError } from "@/modules/auth/authorization/application/errors/permission-denied.error";
import type { IPermissionRepository } from "@/modules/auth/authorization/application/ports/permission.repository";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

describe("GetAdminAuditExportUseCase", () => {
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

  const objectStorage: IObjectStorage = {
    putObject: vi.fn(),
    getObject: vi.fn(),
    deleteObject: vi.fn(),
    exists: vi.fn(),
    getSignedUrl: vi.fn(),
    getPublicUrl: vi.fn(),
  };

  const useCase = new GetAdminAuditExportUseCase(
    identityRepository,
    permissionRepository,
    objectStorage,
  );

  const exportId = "0aaa5979-9791-44e0-b42c-00aff64c335a";
  const csvBody = Buffer.from("id,eventType\nevent-1,login_success\n");

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
    vi.mocked(objectStorage.exists).mockResolvedValue(false);
  });

  it("returns the csv export when the object exists", async () => {
    vi.mocked(objectStorage.exists).mockImplementation(async (key) => key.endsWith(".csv"));
    vi.mocked(objectStorage.getObject).mockResolvedValue({
      key: `audit-exports/${exportId}.csv`,
      body: csvBody,
      contentType: "text/csv",
    });

    const result = await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      exportId,
    });

    expect(permissionRepository.hasKeyForUser).toHaveBeenCalledWith("user-1", "audit_logs.export");
    expect(objectStorage.getObject).toHaveBeenCalledWith(`audit-exports/${exportId}.csv`);
    expect(result).toEqual({
      format: "csv",
      filename: `audit-export-${exportId}.csv`,
      contentType: "text/csv",
      body: csvBody,
    });
  });

  it("falls back to json when csv is missing", async () => {
    const jsonBody = Buffer.from("[]");
    vi.mocked(objectStorage.exists).mockImplementation(async (key) => key.endsWith(".json"));
    vi.mocked(objectStorage.getObject).mockResolvedValue({
      key: `audit-exports/${exportId}.json`,
      body: jsonBody,
      contentType: "application/json",
    });

    const result = await useCase.execute({
      userId: "user-1",
      sessionId: "session-1",
      exportId,
    });

    expect(result.format).toBe("json");
    expect(result.filename).toBe(`audit-export-${exportId}.json`);
    expect(result.body).toBe(jsonBody);
  });

  it("throws AuditExportNotFoundError when the file is still pending", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        exportId,
      }),
    ).rejects.toBeInstanceOf(AuditExportNotFoundError);
    expect(objectStorage.getObject).not.toHaveBeenCalled();
  });

  it("throws PermissionDeniedError without audit_logs.export", async () => {
    vi.mocked(permissionRepository.hasKeyForUser).mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        exportId,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(objectStorage.exists).not.toHaveBeenCalled();
  });
});
