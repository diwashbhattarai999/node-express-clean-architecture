import { and, eq, isNull, ne } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { isUniqueViolation } from "@/infrastructure/database/drizzle/errors";
import { authTokens } from "@/infrastructure/database/drizzle/schema/auth/auth-tokens.schema";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passwordCredentials } from "@/infrastructure/database/drizzle/schema/auth/password-credentials.schema";
import { sessions } from "@/infrastructure/database/drizzle/schema/auth/sessions.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import { IdentityAlreadyExistsError } from "@/modules/auth/application/errors/identity-already-exists.error";
import type {
  AuthUser,
  CreateSessionInput,
  IAuthAccountRepository,
  PasswordLoginCandidate,
  RegisterAccountInput,
  ReplaceEmailVerificationTokenInput,
  ReplacePhoneVerificationTokenInput,
  RotateRefreshSessionResult,
  RotateSessionInput,
  TLoginIdentityType,
  UnverifiedEmailIdentity,
  UnverifiedPhoneIdentity,
  VerifyEmailByTokenHashResult,
  VerifyPhoneByCodeHashResult,
} from "@/modules/auth/application/ports/auth-account.repository";

export class PostgresAuthAccountRepository implements IAuthAccountRepository {
  public async findIdentityByNormalized(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<{ userId: string } | null> {
    const [row] = await db
      .select({ userId: loginIdentities.userId })
      .from(loginIdentities)
      .where(
        and(
          eq(loginIdentities.type, type),
          eq(loginIdentities.normalizedIdentifier, normalizedIdentifier),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async register(input: RegisterAccountInput): Promise<AuthUser> {
    try {
      return await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(users)
          .values({
            id: input.id,
            displayName: input.displayName,
            status: "pending_verification",
          })
          .returning();

        if (!createdUser) {
          throw new Error("Failed to create user account.");
        }

        let emailIdentityId: string | undefined;
        let phoneIdentityId: string | undefined;
        let primaryEmail: string | null = null;

        if (input.email) {
          const [emailIdentity] = await tx
            .insert(loginIdentities)
            .values({
              userId: createdUser.id,
              type: "email",
              identifier: input.email.identifier,
              normalizedIdentifier: input.email.normalizedIdentifier,
              isPrimary: true,
              verifiedAt: null,
            })
            .returning({ id: loginIdentities.id });

          emailIdentityId = emailIdentity?.id;
          primaryEmail = input.email.normalizedIdentifier;
        }

        if (input.phone) {
          const [phoneIdentity] = await tx
            .insert(loginIdentities)
            .values({
              userId: createdUser.id,
              type: "phone",
              identifier: input.phone.identifier,
              normalizedIdentifier: input.phone.normalizedIdentifier,
              isPrimary: true,
              verifiedAt: null,
            })
            .returning({ id: loginIdentities.id });

          phoneIdentityId = phoneIdentity?.id;
        }

        await tx.insert(passwordCredentials).values({
          userId: createdUser.id,
          passwordHash: input.passwordHash,
        });

        const identityIdForToken =
          input.verificationToken.purpose === "email_verification"
            ? (emailIdentityId ?? null)
            : (phoneIdentityId ?? null);

        await tx.insert(authTokens).values({
          userId: createdUser.id,
          identityId: identityIdForToken,
          type: input.verificationToken.purpose,
          tokenHash: input.verificationToken.tokenHash,
          expiresAt: input.verificationToken.expiresAt,
        });

        return {
          id: createdUser.id,
          status: "pending_verification",
          displayName: createdUser.displayName,
          avatarUrl: createdUser.avatarUrl,
          email: primaryEmail,
          username: null,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new IdentityAlreadyExistsError();
      }

      throw error;
    }
  }

  public async verifyEmailByTokenHash(
    tokenHash: string,
    session: CreateSessionInput,
  ): Promise<VerifyEmailByTokenHashResult> {
    const [token] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.type, "email_verification"),
          isNull(authTokens.consumedAt),
          isNull(authTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!token) {
      return { outcome: "invalid" };
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      return { outcome: "expired" };
    }

    return db.transaction(async (tx) => {
      const now = new Date();

      const [consumed] = await tx
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.id, token.id),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        )
        .returning({ id: authTokens.id });

      if (!consumed) {
        return { outcome: "invalid" as const };
      }

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, token.userId),
            eq(authTokens.type, "email_verification"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
            ne(authTokens.id, token.id),
          ),
        );

      if (token.identityId) {
        await tx
          .update(loginIdentities)
          .set({ verifiedAt: now, updatedAt: now })
          .where(and(eq(loginIdentities.id, token.identityId), isNull(loginIdentities.verifiedAt)));
      }

      const [user] = await tx.select().from(users).where(eq(users.id, token.userId)).limit(1);

      if (!user || user.deletedAt) {
        return { outcome: "invalid" as const };
      }

      let status = user.status;
      let updatedAt = user.updatedAt;

      if (user.status === "pending_verification") {
        const [activated] = await tx
          .update(users)
          .set({
            status: "active",
            activatedAt: now,
            updatedAt: now,
          })
          .where(eq(users.id, user.id))
          .returning();

        if (activated) {
          status = activated.status;
          updatedAt = activated.updatedAt;
        }
      }

      await tx.insert(sessions).values({
        id: session.id,
        userId: user.id,
        familyId: session.familyId,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
      });

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
        identities.find((identity) => identity.type === "email" && identity.isPrimary)
          ?.identifier ??
        identities.find((identity) => identity.type === "email")?.identifier ??
        null;

      const username =
        identities.find((identity) => identity.type === "username")?.identifier ?? null;

      return {
        outcome: "verified" as const,
        sessionId: session.id,
        user: {
          id: user.id,
          status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: primaryEmail,
          username,
          createdAt: user.createdAt,
          updatedAt,
        },
      };
    });
  }

  public async findUnverifiedEmailIdentity(
    normalizedEmail: string,
  ): Promise<UnverifiedEmailIdentity | null> {
    const [row] = await db
      .select({
        userId: loginIdentities.userId,
        identityId: loginIdentities.id,
        email: loginIdentities.normalizedIdentifier,
        deletedAt: users.deletedAt,
      })
      .from(loginIdentities)
      .innerJoin(users, eq(users.id, loginIdentities.userId))
      .where(
        and(
          eq(loginIdentities.type, "email"),
          eq(loginIdentities.normalizedIdentifier, normalizedEmail),
          isNull(loginIdentities.verifiedAt),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      userId: row.userId,
      identityId: row.identityId,
      email: row.email,
    };
  }

  public async replaceEmailVerificationToken(
    input: ReplaceEmailVerificationTokenInput,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, input.userId),
            eq(authTokens.type, "email_verification"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        );

      await tx.insert(authTokens).values({
        userId: input.userId,
        identityId: input.identityId,
        type: "email_verification",
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
    });
  }

  public async verifyPhoneByCodeHash(
    normalizedPhone: string,
    codeHash: string,
    session: CreateSessionInput,
    maxAttempts: number,
  ): Promise<VerifyPhoneByCodeHashResult> {
    const [identity] = await db
      .select({
        userId: loginIdentities.userId,
        identityId: loginIdentities.id,
        deletedAt: users.deletedAt,
      })
      .from(loginIdentities)
      .innerJoin(users, eq(users.id, loginIdentities.userId))
      .where(
        and(
          eq(loginIdentities.type, "phone"),
          eq(loginIdentities.normalizedIdentifier, normalizedPhone),
          isNull(loginIdentities.verifiedAt),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!identity) {
      return { outcome: "invalid" };
    }

    const [token] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.userId, identity.userId),
          eq(authTokens.type, "phone_verification"),
          isNull(authTokens.consumedAt),
          isNull(authTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!token) {
      return { outcome: "invalid" };
    }

    if (token.attemptCount >= maxAttempts) {
      return { outcome: "too_many_attempts" };
    }

    if (token.expiresAt.getTime() <= Date.now()) {
      return { outcome: "expired" };
    }

    if (token.tokenHash !== codeHash) {
      const [updated] = await db
        .update(authTokens)
        .set({ attemptCount: token.attemptCount + 1 })
        .where(and(eq(authTokens.id, token.id), isNull(authTokens.consumedAt)))
        .returning({ attemptCount: authTokens.attemptCount });

      if (updated && updated.attemptCount >= maxAttempts) {
        return { outcome: "too_many_attempts" };
      }

      return { outcome: "invalid" };
    }

    return db.transaction(async (tx) => {
      const now = new Date();

      const [consumed] = await tx
        .update(authTokens)
        .set({ consumedAt: now })
        .where(
          and(
            eq(authTokens.id, token.id),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        )
        .returning({ id: authTokens.id });

      if (!consumed) {
        return { outcome: "invalid" as const };
      }

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, identity.userId),
            eq(authTokens.type, "phone_verification"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
            ne(authTokens.id, token.id),
          ),
        );

      await tx
        .update(loginIdentities)
        .set({ verifiedAt: now, updatedAt: now })
        .where(
          and(eq(loginIdentities.id, identity.identityId), isNull(loginIdentities.verifiedAt)),
        );

      const [user] = await tx.select().from(users).where(eq(users.id, identity.userId)).limit(1);

      if (!user || user.deletedAt) {
        return { outcome: "invalid" as const };
      }

      let status = user.status;
      let updatedAt = user.updatedAt;

      if (user.status === "pending_verification") {
        const [activated] = await tx
          .update(users)
          .set({
            status: "active",
            activatedAt: now,
            updatedAt: now,
          })
          .where(eq(users.id, user.id))
          .returning();

        if (activated) {
          status = activated.status;
          updatedAt = activated.updatedAt;
        }
      }

      await tx.insert(sessions).values({
        id: session.id,
        userId: user.id,
        familyId: session.familyId,
        refreshTokenHash: session.refreshTokenHash,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
      });

      const identities = await tx
        .select({
          type: loginIdentities.type,
          identifier: loginIdentities.normalizedIdentifier,
          isPrimary: loginIdentities.isPrimary,
        })
        .from(loginIdentities)
        .where(eq(loginIdentities.userId, user.id));

      const primaryEmail =
        identities.find((row) => row.type === "email" && row.isPrimary)?.identifier ??
        identities.find((row) => row.type === "email")?.identifier ??
        null;

      const username = identities.find((row) => row.type === "username")?.identifier ?? null;

      return {
        outcome: "verified" as const,
        sessionId: session.id,
        user: {
          id: user.id,
          status,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          email: primaryEmail,
          username,
          createdAt: user.createdAt,
          updatedAt,
        },
      };
    });
  }

  public async findUnverifiedPhoneIdentity(
    normalizedPhone: string,
  ): Promise<UnverifiedPhoneIdentity | null> {
    const [row] = await db
      .select({
        userId: loginIdentities.userId,
        identityId: loginIdentities.id,
        phone: loginIdentities.normalizedIdentifier,
      })
      .from(loginIdentities)
      .innerJoin(users, eq(users.id, loginIdentities.userId))
      .where(
        and(
          eq(loginIdentities.type, "phone"),
          eq(loginIdentities.normalizedIdentifier, normalizedPhone),
          isNull(loginIdentities.verifiedAt),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  public async replacePhoneVerificationToken(
    input: ReplacePhoneVerificationTokenInput,
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, input.userId),
            eq(authTokens.type, "phone_verification"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        );

      await tx.insert(authTokens).values({
        userId: input.userId,
        identityId: input.identityId,
        type: "phone_verification",
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
    });
  }

  public async findPasswordLoginCandidate(
    type: TLoginIdentityType,
    normalizedIdentifier: string,
  ): Promise<PasswordLoginCandidate | null> {
    const [identity] = await db
      .select({
        userId: loginIdentities.userId,
      })
      .from(loginIdentities)
      .where(
        and(
          eq(loginIdentities.type, type),
          eq(loginIdentities.normalizedIdentifier, normalizedIdentifier),
        ),
      )
      .limit(1);

    if (!identity) {
      return null;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, identity.userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      return null;
    }

    const [credential] = await db
      .select({ passwordHash: passwordCredentials.passwordHash })
      .from(passwordCredentials)
      .where(eq(passwordCredentials.userId, user.id))
      .limit(1);

    if (!credential) {
      return null;
    }

    const identities = await db
      .select({
        type: loginIdentities.type,
        identifier: loginIdentities.normalizedIdentifier,
        isPrimary: loginIdentities.isPrimary,
        verifiedAt: loginIdentities.verifiedAt,
      })
      .from(loginIdentities)
      .where(eq(loginIdentities.userId, user.id));

    const primaryVerifiedEmail =
      identities.find((row) => row.type === "email" && row.isPrimary && row.verifiedAt !== null)
        ?.identifier ??
      identities.find((row) => row.type === "email" && row.verifiedAt !== null)?.identifier ??
      null;

    const username = identities.find((row) => row.type === "username")?.identifier ?? null;

    return {
      userId: user.id,
      status: user.status,
      passwordHash: credential.passwordHash,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: primaryVerifiedEmail,
      username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

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
}
