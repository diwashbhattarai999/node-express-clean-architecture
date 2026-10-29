import { and, count, desc, eq, isNull, type SQL } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { sessions } from "@/infrastructure/database/drizzle/schema/auth/sessions.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import type {
  AuthSessionSummary,
  ISessionRepository,
  ListSessionsForUserInput,
  RotateRefreshSessionResult,
  RotateSessionInput,
} from "@/modules/auth/sessions/application/ports/session.repository";
import type { CreateSessionInput } from "@/modules/auth/shared/application/types/auth.types";
import { getPaginationOffset } from "@/shared/http/pagination";

export class PostgresSessionRepository implements ISessionRepository {
  public async createSession(userId: string, session: CreateSessionInput): Promise<void> {
    await db.insert(sessions).values({
      id: session.id,
      userId,
      familyId: session.familyId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
    });
  }

  public async rotateRefreshSession(
    currentRefreshTokenHash: string,
    newSession: RotateSessionInput,
  ): Promise<RotateRefreshSessionResult> {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.refreshTokenHash, currentRefreshTokenHash))
        .limit(1)
        .for("update");

      if (!current) {
        return { outcome: "invalid" as const };
      }

      const now = new Date();

      if (current.revokedAt) {
        const isRotated =
          current.replacedBySessionId !== null || current.revocationReason === "rotation_reuse";

        if (isRotated) {
          await tx
            .update(sessions)
            .set({
              revokedAt: now,
              revocationReason: "rotation_reuse",
            })
            .where(and(eq(sessions.familyId, current.familyId), isNull(sessions.revokedAt)));

          return { outcome: "reused" as const };
        }

        return { outcome: "revoked" as const };
      }

      if (current.expiresAt.getTime() <= now.getTime()) {
        await tx
          .update(sessions)
          .set({
            revokedAt: now,
            revocationReason: "expired",
          })
          .where(and(eq(sessions.id, current.id), isNull(sessions.revokedAt)));

        return { outcome: "expired" as const };
      }

      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, current.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!user) {
        return { outcome: "invalid" as const };
      }

      await tx.insert(sessions).values({
        id: newSession.id,
        userId: current.userId,
        familyId: current.familyId,
        refreshTokenHash: newSession.refreshTokenHash,
        expiresAt: newSession.expiresAt,
        ipAddress: newSession.ipAddress ?? null,
        userAgent: newSession.userAgent ?? null,
      });

      const [revoked] = await tx
        .update(sessions)
        .set({
          revokedAt: now,
          replacedBySessionId: newSession.id,
          lastUsedAt: now,
        })
        .where(and(eq(sessions.id, current.id), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });

      if (!revoked) {
        // Concurrent rotation won; treat the presented token as reused.
        await tx
          .update(sessions)
          .set({
            revokedAt: now,
            revocationReason: "rotation_reuse",
          })
          .where(and(eq(sessions.familyId, current.familyId), isNull(sessions.revokedAt)));

        return { outcome: "reused" as const };
      }

      const identities = await tx
        .select({
          type: loginIdentities.type,
          identifier: loginIdentities.normalizedIdentifier,
          isPrimary: loginIdentities.isPrimary,
          verifiedAt: loginIdentities.verifiedAt,
        })
        .from(loginIdentities)
        .where(eq(loginIdentities.userId, user.id));

      const primaryEmail =
        identities.find(
          (identity) =>
            identity.type === "email" && identity.isPrimary && identity.verifiedAt !== null,
        )?.identifier ??
        identities.find((identity) => identity.type === "email" && identity.verifiedAt !== null)
          ?.identifier ??
        null;

      const username =
        identities.find((identity) => identity.type === "username")?.identifier ?? null;

      return {
        outcome: "rotated" as const,
        sessionId: newSession.id,
        user: {
          id: user.id,
          status: user.status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: primaryEmail,
          username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    });
  }

  public async revokeSessionByRefreshTokenHash(refreshTokenHash: string): Promise<boolean> {
    const now = new Date();
    const revoked = await db
      .update(sessions)
      .set({
        revokedAt: now,
        revocationReason: "logout",
      })
      .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt)))
      .returning({ id: sessions.id });

    return revoked.length > 0;
  }

  public async revokeSessionById(sessionId: string): Promise<boolean> {
    const now = new Date();
    const revoked = await db
      .update(sessions)
      .set({
        revokedAt: now,
        revocationReason: "logout",
      })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
      .returning({ id: sessions.id });

    return revoked.length > 0;
  }

  public async revokeAllSessionsForUser(userId: string): Promise<number> {
    const now = new Date();
    const revoked = await db
      .update(sessions)
      .set({
        revokedAt: now,
        revocationReason: "logout_all",
      })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
      .returning({ id: sessions.id });

    return revoked.length;
  }

  public async listSessionsForUser(
    input: ListSessionsForUserInput,
  ): Promise<{ items: AuthSessionSummary[]; total: number }> {
    const conditions: SQL[] = [eq(sessions.userId, input.userId)];

    if (!input.includeRevoked) {
      conditions.push(isNull(sessions.revokedAt));
    }

    const whereClause = and(...conditions);
    const offset = getPaginationOffset(input.page, input.limit);

    const [totalResult] = await db.select({ value: count() }).from(sessions).where(whereClause);

    const rows = await db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        lastUsedAt: sessions.lastUsedAt,
        expiresAt: sessions.expiresAt,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        deviceName: sessions.deviceName,
      })
      .from(sessions)
      .where(whereClause)
      .orderBy(desc(sessions.lastUsedAt), desc(sessions.createdAt))
      .limit(input.limit)
      .offset(offset);

    return {
      total: totalResult?.value ?? 0,
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        lastUsedAt: row.lastUsedAt,
        expiresAt: row.expiresAt,
        ipAddress: row.ipAddress ?? null,
        userAgent: row.userAgent ?? null,
        deviceName: row.deviceName ?? null,
        isCurrent: row.id === input.currentSessionId,
      })),
    };
  }

  public async findSessionForUser(input: {
    userId: string;
    sessionId: string;
    currentSessionId: string;
  }): Promise<AuthSessionSummary | null> {
    const [row] = await db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        lastUsedAt: sessions.lastUsedAt,
        expiresAt: sessions.expiresAt,
        ipAddress: sessions.ipAddress,
        userAgent: sessions.userAgent,
        deviceName: sessions.deviceName,
      })
      .from(sessions)
      .where(and(eq(sessions.userId, input.userId), eq(sessions.id, input.sessionId)))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      deviceName: row.deviceName ?? null,
      isCurrent: row.id === input.currentSessionId,
    };
  }

  public async revokeSessionForUser(input: {
    userId: string;
    sessionId: string;
  }): Promise<"revoked" | "already_revoked" | "not_found"> {
    const [existing] = await db
      .select({
        id: sessions.id,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(and(eq(sessions.userId, input.userId), eq(sessions.id, input.sessionId)))
      .limit(1);

    if (!existing) {
      return "not_found";
    }

    if (existing.revokedAt) {
      return "already_revoked";
    }

    const now = new Date();
    await db
      .update(sessions)
      .set({
        revokedAt: now,
        revocationReason: "logout",
      })
      .where(and(eq(sessions.id, input.sessionId), isNull(sessions.revokedAt)));

    return "revoked";
  }
}
