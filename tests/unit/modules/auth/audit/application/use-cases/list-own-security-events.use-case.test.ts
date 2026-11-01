import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogRepository } from "@/modules/auth/audit/application/ports/audit-log.repository";
import { ListOwnSecurityEventsUseCase } from "@/modules/auth/audit/application/use-cases/list-own-security-events.use-case";
import type { IIdentityRepository } from "@/modules/auth/identity/application/ports/identity.repository";
import { TokenInvalidError } from "@/modules/auth/shared/application/errors/token-invalid.error";

describe("ListOwnSecurityEventsUseCase", () => {
  const identityRepository: Pick<IIdentityRepository, "findAuthenticatedPrincipal"> = {
    findAuthenticatedPrincipal: vi.fn(),
  };

  const auditLogRepository: IAuditLogRepository = {
    list: vi.fn(),
    findById: vi.fn(),
    listForExport: vi.fn(),
  };

  const useCase = new ListOwnSecurityEventsUseCase(identityRepository, auditLogRepository);

  const events = {
    items: [
      {
        id: "event-1",
        eventType: "login_success" as const,
        outcome: "success" as const,
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    total: 1,
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
    vi.mocked(auditLogRepository.list).mockResolvedValue(events);
  });

  it("lists the caller's events after verifying the session", async () => {
    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "session-1",
        page: 1,
        limit: 10,
        eventType: "login_success",
      }),
    ).resolves.toEqual(events);

    expect(auditLogRepository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      userId: "user-1",
      eventType: "login_success",
    });
  });

  it("throws TokenInvalidError for invalid sessions", async () => {
    vi.mocked(identityRepository.findAuthenticatedPrincipal).mockResolvedValue({
      outcome: "invalid_session",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        sessionId: "bad",
        page: 1,
        limit: 10,
      }),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(auditLogRepository.list).not.toHaveBeenCalled();
  });
});
