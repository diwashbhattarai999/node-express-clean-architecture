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
  RegisterAccountInput,
  TLoginIdentityType,
  VerifyEmailByTokenHashResult,
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
}
