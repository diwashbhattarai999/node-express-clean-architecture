import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPermissionRepository = {
  listKeysForUser: vi.fn(),
  hasKeyForUser: vi.fn(),
  listForRole: vi.fn(),
  list: vi.fn(),
  findById: vi.fn(),
  replaceForRole: vi.fn(),
  removeFromRole: vi.fn(),
};

const mockSessionRepository = {
  createSession: vi.fn(),
  rotateRefreshSession: vi.fn(),
  revokeSessionByRefreshTokenHash: vi.fn(),
  revokeSessionById: vi.fn(),
  revokeAllSessionsForUser: vi.fn(),
  revokeOtherSessionsForUser: vi.fn(),
  listSessionsForUser: vi.fn(),
  findSessionForUser: vi.fn(),
  revokeSessionForUser: vi.fn(),
};

const mockAccessTokenSigner = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockIdentityRepository = {
  findIdentityByNormalized: vi.fn(),
  register: vi.fn(),
  existsById: vi.fn(),
  findAuthenticatedPrincipal: vi.fn(),
  findOwnProfile: vi.fn(),
  updateOwnProfile: vi.fn(),
  listIdentitiesForUser: vi.fn(),
  addEmailIdentity: vi.fn(),
  verifyAddedEmailByTokenHash: vi.fn(),
  removeEmailIdentity: vi.fn(),
  scheduleAccountDeletion: vi.fn(),
  cancelAccountDeletion: vi.fn(),
  applyDueAccountDeletions: vi.fn(),
  upsertUsername: vi.fn(),
  listUsers: vi.fn(),
  findAdminDetails: vi.fn(),
  setUserStatus: vi.fn(),
  hardDeleteById: vi.fn(),
};

const mockAuditLogRepository = {
  list: vi.fn(),
  findById: vi.fn(),
  listForExport: vi.fn(),
};

const mockObjectStorage = {
  putObject: vi.fn(),
  getObject: vi.fn(),
  deleteObject: vi.fn(),
  exists: vi.fn(),
  getSignedUrl: vi.fn(),
  getPublicUrl: vi.fn(),
};

vi.mock("@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository", () => ({
  PostgresIdentityRepository: vi.fn(function PostgresIdentityRepository() {
    return mockIdentityRepository;
  }),
}));

vi.mock("@/modules/auth/sessions/infrastructure/repositories/postgres-session.repository", () => ({
  PostgresSessionRepository: vi.fn(function PostgresSessionRepository() {
    return mockSessionRepository;
  }),
}));

vi.mock(
  "@/modules/auth/authorization/infrastructure/repositories/postgres-permission.repository",
  () => ({
    PostgresPermissionRepository: vi.fn(function PostgresPermissionRepository() {
      return mockPermissionRepository;
    }),
  }),
);

vi.mock("@/modules/auth/audit/infrastructure/repositories/postgres-audit-log.repository", () => ({
  PostgresAuditLogRepository: vi.fn(function PostgresAuditLogRepository() {
    return mockAuditLogRepository;
  }),
}));

vi.mock("@/modules/auth/shared/infrastructure/security/jose-access-token.signer", () => ({
  JoseAccessTokenSigner: vi.fn(function JoseAccessTokenSigner() {
    return mockAccessTokenSigner;
  }),
}));

vi.mock("@/infrastructure/storage", () => ({
  createObjectStorage: vi.fn(() => mockObjectStorage),
}));

const { createApp } = await import("@/app/create-app");

describe("Security events and audit log APIs", () => {
  const app = createApp();
  const actorId = "550e8400-e29b-41d4-a716-446655440000";
  const eventId = "550e8400-e29b-41d4-a716-446655440080";

  const event = {
    id: eventId,
    eventType: "login_success" as const,
    outcome: "success" as const,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    metadata: { method: "password" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccessTokenSigner.verify.mockResolvedValue({
      userId: actorId,
      sessionId: "550e8400-e29b-41d4-a716-446655440002",
      jti: "jti-1",
    });
    mockIdentityRepository.findAuthenticatedPrincipal.mockResolvedValue({
      outcome: "ok",
      roles: ["admin"],
      user: {
        id: actorId,
        status: "active",
        displayName: "Ada Lovelace",
        avatarUrl: null,
        email: "ada@example.com",
        username: "ada",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    });
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(true);
    mockAuditLogRepository.list.mockResolvedValue({ total: 1, items: [event] });
    mockAuditLogRepository.findById.mockResolvedValue(event);
    mockObjectStorage.exists.mockResolvedValue(false);
  });

  it("lists the caller's security events", async () => {
    const response = await request(app)
      .get("/api/v1/users/me/security-events")
      .set("Authorization", "Bearer access.jwt")
      .query({ eventType: "login_success" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Security events retrieved.",
      data: [
        {
          id: eventId,
          eventType: "login_success",
          outcome: "success",
          ipAddress: "127.0.0.1",
          userAgent: "vitest",
          createdAt: "2026-01-01T00:00:00.000Z",
          metadata: { method: "password" },
        },
      ],
    });
    expect(mockAuditLogRepository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      userId: actorId,
      eventType: "login_success",
    });
  });

  it("lists admin audit logs", async () => {
    const response = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", "Bearer access.jwt")
      .query({ userId: actorId, outcome: "success" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Audit logs retrieved.");
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(actorId, "audit_logs.read");
    expect(mockAuditLogRepository.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      userId: actorId,
      outcome: "success",
    });
  });

  it("returns a single audit log", async () => {
    const response = await request(app)
      .get(`/api/v1/admin/audit-logs/${eventId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "Audit log retrieved.",
      data: { id: eventId, eventType: "login_success" },
    });
  });

  it("queues an audit log export", async () => {
    const response = await request(app)
      .post("/api/v1/admin/audit-logs/exports")
      .set("Authorization", "Bearer access.jwt")
      .send({
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-31T23:59:59.000Z",
        format: "json",
        filters: { eventType: "login_success" },
      });

    expect(response.status).toBe(202);
    expect(response.body.message).toBe("Audit log export queued.");
    expect(response.body.data.status).toBe("pending");
    expect(response.body.data.exportId).toEqual(expect.any(String));
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(
      actorId,
      "audit_logs.export",
    );
  });

  it("downloads a ready audit export", async () => {
    const exportId = "0aaa5979-9791-44e0-b42c-00aff64c335a";
    const csv = "id,eventType\nevent-1,login_success\n";
    mockObjectStorage.exists.mockImplementation(async (key: string) => key.endsWith(".csv"));
    mockObjectStorage.getObject.mockResolvedValue({
      key: `audit-exports/${exportId}.csv`,
      body: Buffer.from(csv),
      contentType: "text/csv",
    });

    const response = await request(app)
      .get(`/api/v1/admin/audit-logs/exports/${exportId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/text\/csv/);
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="audit-export-${exportId}.csv"`,
    );
    expect(response.text).toBe(csv);
    expect(mockPermissionRepository.hasKeyForUser).toHaveBeenCalledWith(
      actorId,
      "audit_logs.export",
    );
  });

  it("returns 404 when the audit export is still pending", async () => {
    const response = await request(app)
      .get("/api/v1/admin/audit-logs/exports/0aaa5979-9791-44e0-b42c-00aff64c335a")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
    expect(response.body.message).toBe("Audit export not found. It may still be processing.");
  });

  it("returns 404 when the audit log is missing", async () => {
    mockAuditLogRepository.findById.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/v1/admin/audit-logs/${eventId}`)
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("returns 403 without audit_logs.read", async () => {
    mockPermissionRepository.hasKeyForUser.mockResolvedValue(false);

    const response = await request(app)
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", "Bearer access.jwt");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("PERMISSION_DENIED");
  });

  it("returns 401 without Authorization", async () => {
    const response = await request(app).get("/api/v1/users/me/security-events");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("TOKEN_INVALID");
  });
});
