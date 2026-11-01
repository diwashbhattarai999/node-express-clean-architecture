import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogRepository } from "@/modules/auth/audit/application/ports/audit-log.repository";
import { ProcessAuditLogExportUseCase } from "@/modules/auth/audit/application/use-cases/process-audit-log-export.use-case";
import type { IObjectStorage } from "@/shared/storage/object-storage.port";

describe("ProcessAuditLogExportUseCase", () => {
  const auditLogRepository: IAuditLogRepository = {
    list: vi.fn(),
    findById: vi.fn(),
    listForExport: vi.fn(),
  };

  const objectStorage: IObjectStorage = {
    putObject: vi.fn(),
    getObject: vi.fn(),
    deleteObject: vi.fn(),
    exists: vi.fn(),
    getSignedUrl: vi.fn(),
    getPublicUrl: vi.fn(),
  };

  const useCase = new ProcessAuditLogExportUseCase(auditLogRepository, objectStorage);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditLogRepository.listForExport).mockResolvedValue([
      {
        id: "event-1",
        eventType: "login_success",
        outcome: "success",
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        metadata: { reason: "ok", token: "secret" },
      },
    ]);
    vi.mocked(objectStorage.putObject).mockResolvedValue({ key: "audit-exports/export-1.json" });
  });

  it("writes sanitized JSON to object storage", async () => {
    const result = await useCase.execute({
      exportId: "550e8400-e29b-41d4-a716-446655440099",
      requestedBy: "550e8400-e29b-41d4-a716-446655440000",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
      format: "json",
    });

    expect(result.count).toBe(1);
    expect(result.key).toBe("audit-exports/550e8400-e29b-41d4-a716-446655440099.json");
    expect(objectStorage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: result.key,
        contentType: "application/json",
        body: expect.stringContaining('"reason": "ok"'),
      }),
    );
    const body = vi.mocked(objectStorage.putObject).mock.calls[0]?.[0].body;
    expect(String(body)).not.toContain("secret");
  });

  it("writes a CSV export", async () => {
    await useCase.execute({
      exportId: "550e8400-e29b-41d4-a716-446655440099",
      requestedBy: "550e8400-e29b-41d4-a716-446655440000",
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
      format: "csv",
    });

    expect(objectStorage.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "audit-exports/550e8400-e29b-41d4-a716-446655440099.csv",
        contentType: "text/csv",
        body: expect.stringContaining("id,eventType,outcome,ipAddress,userAgent,createdAt,metadata"),
      }),
    );
  });
});
