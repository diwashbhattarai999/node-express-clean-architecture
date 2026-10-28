import { and, eq, isNotNull, isNull, ne } from "drizzle-orm";

import { db } from "@/infrastructure/database/drizzle";
import { authTokens } from "@/infrastructure/database/drizzle/schema/auth/auth-tokens.schema";
import { loginIdentities } from "@/infrastructure/database/drizzle/schema/auth/login-identities.schema";
import { passwordCredentials } from "@/infrastructure/database/drizzle/schema/auth/password-credentials.schema";
import { sessions } from "@/infrastructure/database/drizzle/schema/auth/sessions.schema";
import { users } from "@/infrastructure/database/drizzle/schema/users.schema";
import type {
  ICredentialsRepository,
  PasswordLoginCandidate,
  PasswordResetTarget,
  ReplacePasswordResetTokenInput,
  ResetPasswordByTokenHashResult,
} from "@/modules/auth/credentials/application/ports/credentials.repository";
import type { TLoginIdentityType } from "@/modules/auth/shared/application/types/auth.types";

export class PostgresCredentialsRepository implements ICredentialsRepository {
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

  public async findPasswordResetTarget(
    normalizedEmail: string,
  ): Promise<PasswordResetTarget | null> {
    const [row] = await db
      .select({
        userId: loginIdentities.userId,
        identityId: loginIdentities.id,
        email: loginIdentities.normalizedIdentifier,
        status: users.status,
      })
      .from(loginIdentities)
      .innerJoin(users, eq(users.id, loginIdentities.userId))
      .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
      .where(
        and(
          eq(loginIdentities.type, "email"),
          eq(loginIdentities.normalizedIdentifier, normalizedEmail),
          isNotNull(loginIdentities.verifiedAt),
          isNull(users.deletedAt),
          eq(users.status, "active"),
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

  public async replacePasswordResetToken(input: ReplacePasswordResetTokenInput): Promise<void> {
    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, input.userId),
            eq(authTokens.type, "password_reset"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        );

      await tx.insert(authTokens).values({
        userId: input.userId,
        identityId: input.identityId,
        type: "password_reset",
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      });
    });
  }

  public async resetPasswordByTokenHash(
    tokenHash: string,
    passwordHash: string,
  ): Promise<ResetPasswordByTokenHashResult> {
    return db.transaction(async (tx) => {
      const [token] = await tx
        .select()
        .from(authTokens)
        .where(
          and(
            eq(authTokens.tokenHash, tokenHash),
            eq(authTokens.type, "password_reset"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
          ),
        )
        .limit(1)
        .for("update");

      if (!token) {
        const [anyToken] = await tx
          .select({
            revokedAt: authTokens.revokedAt,
            consumedAt: authTokens.consumedAt,
            expiresAt: authTokens.expiresAt,
          })
          .from(authTokens)
          .where(and(eq(authTokens.tokenHash, tokenHash), eq(authTokens.type, "password_reset")))
          .limit(1);

        if (!anyToken) {
          return { outcome: "invalid" as const };
        }

        if (anyToken.revokedAt || anyToken.consumedAt) {
          return { outcome: "revoked" as const };
        }

        return { outcome: "expired" as const };
      }

      const now = new Date();

      if (token.expiresAt.getTime() <= now.getTime()) {
        await tx
          .update(authTokens)
          .set({ revokedAt: now })
          .where(and(eq(authTokens.id, token.id), isNull(authTokens.consumedAt)));

        return { outcome: "expired" as const };
      }

      const [user] = await tx
        .select({ id: users.id, deletedAt: users.deletedAt })
        .from(users)
        .where(eq(users.id, token.userId))
        .limit(1);

      if (!user || user.deletedAt) {
        return { outcome: "invalid" as const };
      }

      const [updatedCredential] = await tx
        .update(passwordCredentials)
        .set({
          passwordHash,
          passwordChangedAt: now,
          updatedAt: now,
        })
        .where(eq(passwordCredentials.userId, token.userId))
        .returning({ id: passwordCredentials.id });

      if (!updatedCredential) {
        return { outcome: "invalid" as const };
      }

      await tx
        .update(authTokens)
        .set({ consumedAt: now })
        .where(and(eq(authTokens.id, token.id), isNull(authTokens.consumedAt)));

      await tx
        .update(authTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authTokens.userId, token.userId),
            eq(authTokens.type, "password_reset"),
            isNull(authTokens.consumedAt),
            isNull(authTokens.revokedAt),
            ne(authTokens.id, token.id),
          ),
        );

      await tx
        .update(sessions)
        .set({
          revokedAt: now,
          revocationReason: "password_reset",
        })
        .where(and(eq(sessions.userId, token.userId), isNull(sessions.revokedAt)));

      return { outcome: "reset" as const };
    });
  }
}
