import type {
  AuthUser,
  CreateSessionInput,
} from "@/modules/auth/shared/application/types/auth.types";

export type ListSessionsForUserInput = {
  userId: string;
  currentSessionId: string;
  includeRevoked: boolean;
  page: number;
  limit: number;
};

export type AuthSessionSummary = {
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  isCurrent: boolean;
};

/** New session row on refresh; `familyId` is taken from the current session. */
export type RotateSessionInput = {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RotateRefreshSessionResult =
  | { outcome: "invalid" }
  | { outcome: "expired" }
  | { outcome: "revoked" }
  | { outcome: "reused" }
  | { outcome: "rotated"; user: AuthUser; sessionId: string };

export interface ISessionRepository {
  createSession(userId: string, session: CreateSessionInput): Promise<void>;

  rotateRefreshSession(
    currentRefreshTokenHash: string,
    newSession: RotateSessionInput,
  ): Promise<RotateRefreshSessionResult>;

  /** Revokes an active session by refresh-token hash. Returns whether a row was updated. */
  revokeSessionByRefreshTokenHash(refreshTokenHash: string): Promise<boolean>;

  /** Revokes an active session by id. Returns whether a row was updated. */
  revokeSessionById(sessionId: string): Promise<boolean>;

  /** Revokes every active session for the user. Returns how many rows were updated. */
  revokeAllSessionsForUser(userId: string): Promise<number>;

  listSessionsForUser(input: ListSessionsForUserInput): Promise<{
    items: AuthSessionSummary[];
    total: number;
  }>;

  /** Own session only (userId scoped). Returns null when missing. */
  findSessionForUser(input: {
    userId: string;
    sessionId: string;
    currentSessionId: string;
  }): Promise<AuthSessionSummary | null>;

  /**
   * Revokes an active session owned by the user.
   * `already_revoked` is idempotent success; `not_found` includes other users' sessions.
   */
  revokeSessionForUser(input: {
    userId: string;
    sessionId: string;
  }): Promise<"revoked" | "already_revoked" | "not_found">;
}
